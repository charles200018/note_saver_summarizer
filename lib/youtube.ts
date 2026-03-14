import { getSubtitles } from "youtube-captions-scraper";
import { YoutubeTranscript } from "youtube-transcript";

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function normalizeCaptionText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function collapseTranscript(lines: string[]): string {
  return lines.map((line) => normalizeCaptionText(line)).filter(Boolean).join(" ");
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

// ---------------------------------------------------------------------------
// Strategy 1: YouTube Innertube internal API (most reliable in serverless)
// ---------------------------------------------------------------------------

type JsonObj = Record<string, unknown>;

function buildInnertubeParams(videoId: string): string {
  // Encode videoId as a protobuf field 1 (wire type 2 = length-delimited string).
  const videoIdBytes = Buffer.from(videoId, "utf8");
  const proto = Buffer.concat([Buffer.from([0x0a, videoIdBytes.length]), videoIdBytes]);
  return proto.toString("base64");
}

function findKey(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = findKey(item, key);
      if (r !== null) return r;
    }
    return null;
  }
  const record = obj as JsonObj;
  if (key in record) return record[key];
  for (const val of Object.values(record)) {
    const r = findKey(val, key);
    if (r !== null) return r;
  }
  return null;
}

function extractSegmentsFromInnertubeResponse(data: unknown): unknown[] | null {
  // Try the known fast path first.
  try {
    const d = data as JsonObj;
    const action = (d?.actions as JsonObj[])?.[0] as JsonObj | undefined;
    const panel = (action?.updateEngagementPanelAction as JsonObj)?.content as JsonObj | undefined;
    const renderer = (panel?.transcriptRenderer as JsonObj)?.content as JsonObj | undefined;
    const body = (renderer?.transcriptSearchPanelRenderer as JsonObj)?.body as JsonObj | undefined;
    const list = (body?.transcriptSegmentListRenderer as JsonObj)?.initialSegments;
    if (Array.isArray(list) && list.length > 0) return list as unknown[];
  } catch {
    // continue to recursive search
  }
  // Recursive fallback: find `initialSegments` anywhere in the JSON tree.
  const found = findKey(data as JsonObj, "initialSegments");
  return Array.isArray(found) && found.length > 0 ? (found as unknown[]) : null;
}

async function fetchTranscriptViaInnertube(videoId: string): Promise<string> {
  const params = buildInnertubeParams(videoId);

  const response = await fetch("https://www.youtube.com/youtubei/v1/get_transcript", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Origin: "https://www.youtube.com",
      Referer: `https://www.youtube.com/watch?v=${videoId}`,
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20240101.00.00",
          hl: "en",
          gl: "US",
        },
      },
      params,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Innertube API responded with ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  const segments = extractSegmentsFromInnertubeResponse(data);

  if (!segments) {
    throw new Error("No transcript segments in Innertube response");
  }

  const text = segments
    .map((s: unknown) => {
      const seg = s as JsonObj;
      const renderer = seg?.transcriptSegmentRenderer as JsonObj | undefined;
      const runs = (renderer?.snippet as JsonObj)?.runs as Array<{ text?: string }> | undefined;
      return runs?.[0]?.text ?? "";
    })
    .filter(Boolean)
    .join(" ");

  if (!text.trim()) {
    throw new Error("Innertube transcript was empty");
  }

  return text;
}

// ---------------------------------------------------------------------------
// Strategy 2: Scrape captionTracks from the YouTube watch page HTML
// ---------------------------------------------------------------------------

function extractCaptionTracksFromHtml(html: string): Array<{
  baseUrl: string;
  languageCode?: string;
  kind?: string;
}> {
  // Try the ytInitialPlayerResponse JSON first (more structured).
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var |window\[|<\/script>)/s);
  if (playerMatch) {
    try {
      const player = JSON.parse(playerMatch[1]) as JsonObj;
      const tracks = (
        ((player?.captions as JsonObj)?.playerCaptionsTracklistRenderer as JsonObj)
          ?.captionTracks as Array<{ baseUrl: string; languageCode?: string; kind?: string }>
      );
      if (Array.isArray(tracks) && tracks.length > 0) {
        return tracks.filter((t) => Boolean(t.baseUrl));
      }
    } catch {
      // fall through to simpler regex
    }
  }

  // Simpler regex fallback.
  const match = html.match(/"captionTracks":(\[[^\]]*\])/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]) as Array<{
      baseUrl: string;
      languageCode?: string;
      kind?: string;
    }>;
    return parsed.filter((t) => Boolean(t.baseUrl));
  } catch {
    return [];
  }
}

function parseXmlTranscript(xml: string): string {
  const segments = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) =>
    decodeHtmlEntities(m[1] || "")
  );
  return collapseTranscript(segments);
}

function parseVttTranscript(vtt: string): string {
  const lines = vtt
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith("WEBVTT") &&
        !line.includes("-->") &&
        !/^\d+$/.test(line)
    )
    .map((line) => line.replace(/<[^>]+>/g, ""));
  return collapseTranscript(lines);
}

async function fetchTranscriptViaDirectCaptionTracks(videoId: string): Promise<string> {
  const watchResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "cookie": "CONSENT=YES+1; SOCS=CAI",
    },
    cache: "no-store",
  });

  if (!watchResponse.ok) throw new Error("Unable to load YouTube page.");

  const html = await watchResponse.text();
  const tracks = extractCaptionTracksFromHtml(html);
  if (tracks.length === 0) throw new Error("No caption tracks found in page HTML.");

  const preferredTrack =
    tracks.find((t) => t.languageCode?.toLowerCase().startsWith("en") && t.kind !== "asr") ||
    tracks.find((t) => t.languageCode?.toLowerCase().startsWith("en")) ||
    tracks[0];

  const vttResponse = await fetch(`${preferredTrack.baseUrl}&fmt=vtt`, { cache: "no-store" });
  if (vttResponse.ok) {
    const vttTranscript = parseVttTranscript(await vttResponse.text());
    if (vttTranscript) return vttTranscript;
  }

  const xmlResponse = await fetch(preferredTrack.baseUrl, { cache: "no-store" });
  if (!xmlResponse.ok) throw new Error("Caption track download failed.");

  const xmlTranscript = parseXmlTranscript(await xmlResponse.text());
  if (xmlTranscript) return xmlTranscript;

  throw new Error("Caption track was empty.");
}

// ---------------------------------------------------------------------------
// Strategy 3: youtube-transcript npm package
// ---------------------------------------------------------------------------

async function fetchTranscriptViaYoutubeTranscript(videoId: string): Promise<string> {
  for (const lang of ["en", "en-US", "en-GB"]) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      const text = collapseTranscript(transcript.map((line) => line.text || ""));
      if (text) return text;
    } catch {
      // Try next language.
    }
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const text = collapseTranscript(transcript.map((line) => line.text || ""));
    if (text) return text;
  } catch {
    // Fall through.
  }

  throw new Error("youtube-transcript library failed.");
}

// ---------------------------------------------------------------------------
// Strategy 4: youtube-captions-scraper npm package
// ---------------------------------------------------------------------------

async function fetchTranscriptViaCaptionsScraper(videoId: string): Promise<string> {
  for (const lang of ["en", "en-US", "en-GB"]) {
    try {
      const subtitles = await getSubtitles({ videoID: videoId, lang });
      const transcript = subtitles
        .map((item) => normalizeCaptionText(item.text || ""))
        .filter(Boolean)
        .join(" ");
      if (transcript) return transcript;
    } catch {
      // Try next language.
    }
  }
  throw new Error("youtube-captions-scraper library failed.");
}

// ---------------------------------------------------------------------------
// Public entry point: try all strategies in order
// ---------------------------------------------------------------------------

export async function fetchTranscript(videoUrl: string): Promise<string> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const strategies = [
    () => fetchTranscriptViaInnertube(videoId),
    () => fetchTranscriptViaDirectCaptionTracks(videoId),
    () => fetchTranscriptViaYoutubeTranscript(videoId),
    () => fetchTranscriptViaCaptionsScraper(videoId),
  ];

  let lastError = "";
  for (const strategy of strategies) {
    try {
      const text = await strategy();
      if (text) return text;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(
    `Could not retrieve captions for this video. ${lastError} Ensure the video is public and has captions enabled.`
  );
}

export function getVideoThumbnail(videoUrl: string): string {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return "";
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export async function getVideoTitle(videoUrl: string): Promise<string> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return "Unknown Video";

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { cache: "no-store" }
    );
    if (!response.ok) return `YouTube Video (${videoId})`;

    const data = (await response.json()) as { title?: string };
    return data.title?.trim() || `YouTube Video (${videoId})`;
  } catch {
    return `YouTube Video (${videoId})`;
  }
}
