type CaptionTrack = {
  baseUrl?: string;
  base_url?: string;
  languageCode?: string;
  language_code?: string;
  kind?: string;
};

type Json3Payload = {
  events?: Array<{
    segs?: Array<{ utf8?: string }>;
  }>;
};

type PlayerResponse = {
  videoDetails?: {
    title?: string;
    lengthSeconds?: string;
  };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
};

type PlayerClient = {
  clientName: "ANDROID" | "IOS" | "WEB";
  clientVersion: string;
  userAgent: string;
};

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

function extractPlayerResponse(html: string): PlayerResponse | null {
  const anchor = "ytInitialPlayerResponse = ";
  const anchorIndex = html.indexOf(anchor);

  if (anchorIndex < 0) {
    return null;
  }

  const startIndex = html.indexOf("{", anchorIndex);
  if (startIndex < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < html.length; index++) {
    const character = html[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        const json = html.slice(startIndex, index + 1);
        return JSON.parse(json) as PlayerResponse;
      }
    }
  }

  return null;
}

async function fetchPlayerResponse(videoId: string): Promise<PlayerResponse> {
  const clients: PlayerClient[] = [
    {
      clientName: "ANDROID",
      clientVersion: "20.10.38",
      userAgent: "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
    },
    {
      clientName: "IOS",
      clientVersion: "20.10.4",
      userAgent: "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 17_2 like Mac OS X)",
    },
    {
      clientName: "WEB",
      clientVersion: "2.20250220.01.00",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  ];

  for (const client of clients) {
    try {
      const innerTubeResponse = await fetchWithTimeout("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
        method: "POST",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          "x-youtube-client-name": client.clientName === "ANDROID" ? "3" : client.clientName === "IOS" ? "5" : "1",
          "x-youtube-client-version": client.clientVersion,
          "user-agent": client.userAgent,
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: client.clientName,
              clientVersion: client.clientVersion,
              hl: "en",
              gl: "US",
            },
          },
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        }),
      });

      if (!innerTubeResponse.ok) {
        continue;
      }

      const payload = (await innerTubeResponse.json()) as PlayerResponse;
      if (payload.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length) {
        return payload;
      }
    } catch {
      // Continue with the next client.
    }
  }

  const watchResponse = await fetchWithTimeout(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    cache: "no-store",
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  if (!watchResponse.ok) {
    throw new Error("Could not load the YouTube watch page.");
  }

  const html = await watchResponse.text();
  const playerResponse = extractPlayerResponse(html);

  if (!playerResponse) {
    throw new Error("Could not read video metadata from the YouTube page.");
  }

  return playerResponse;
}

function json3ToPlainText(payload: Json3Payload): string {
  const lines: string[] = [];
  for (const event of payload.events || []) {
    const line = (event.segs || []).map((segment) => segment.utf8 || "").join("");
    const normalized = normalizeText(line);
    if (!normalized) continue;
    if (lines[lines.length - 1] !== normalized) {
      lines.push(normalized);
    }
  }
  return lines.join(" ").trim();
}

async function fetchCaptionText(baseUrl: string): Promise<string> {
  const headers = {
    "accept-language": "en-US,en;q=0.9",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  };

  const legacyTimedTextHeaders = {
    "accept-language": "en",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)",
  };

  const jsonUrl = new URL(baseUrl);
  jsonUrl.searchParams.set("fmt", "json3");

  const jsonResponse = await fetchWithTimeout(jsonUrl.toString(), {
    cache: "no-store",
    headers,
  });

  if (jsonResponse.ok) {
    try {
      const payload = (await jsonResponse.json()) as Json3Payload;
      const jsonText = json3ToPlainText(payload);
      if (jsonText) return jsonText;
    } catch {
      // Fall through to XML parsing
    }
  }

  const tryParseXml = (xml: string): string => {
    const lines: string[] = [];

    const textNodes = xml.match(/<text[^>]*>([\s\S]*?)<\/text>/g) || [];
    for (const match of textNodes) {
      const inner = match.replace(/^<text[^>]*>/, "").replace(/<\/text>$/, "");
      const normalized = normalizeText(inner);
      if (!normalized) continue;
      if (lines[lines.length - 1] !== normalized) {
        lines.push(normalized);
      }
    }

    if (!lines.length) {
      const paragraphPattern = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
      let paragraphMatch: RegExpExecArray | null;

      while ((paragraphMatch = paragraphPattern.exec(xml)) !== null) {
        const inner = paragraphMatch[3] || "";

        let line = "";
        const segmentPattern = /<s[^>]*>([^<]*)<\/s>/g;
        let segmentMatch: RegExpExecArray | null;

        while ((segmentMatch = segmentPattern.exec(inner)) !== null) {
          line += segmentMatch[1] || "";
        }

        if (!line) {
          line = inner.replace(/<[^>]+>/g, "");
        }

        const normalized = normalizeText(line);
        if (!normalized) continue;
        if (lines[lines.length - 1] !== normalized) {
          lines.push(normalized);
        }
      }
    }

    return lines.join(" ").trim();
  };

  const xmlResponse = await fetchWithTimeout(baseUrl, {
    cache: "no-store",
    headers,
  });

  if (xmlResponse.ok) {
    const xml = await xmlResponse.text();
    const parsed = tryParseXml(xml);
    if (parsed) return parsed;
  }

  const legacyResponse = await fetchWithTimeout(baseUrl, {
    cache: "no-store",
    headers: legacyTimedTextHeaders,
  });

  if (!legacyResponse.ok) {
    throw new Error("This video does not provide accessible captions.");
  }

  const legacyXml = await legacyResponse.text();
  const legacyParsed = tryParseXml(legacyXml);
  if (legacyParsed) return legacyParsed;

  throw new Error("This video does not provide accessible captions.");
}

function pickCaptionTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (!tracks.length) return null;
  const languagePriority = ["en", "en-us", "en-gb"];
  const scoredTracks = tracks
    .map((track) => {
      const language = (track.languageCode || track.language_code || "").toLowerCase();
      const priority = languagePriority.indexOf(language);
      const languageScore = priority >= 0 ? priority : language.startsWith("en-") ? 5 : 50;
      const kindScore = track.kind === "asr" ? 1 : 0;
      return { track, score: languageScore + kindScore };
    })
    .sort((a, b) => a.score - b.score);
  return scoredTracks[0]?.track || null;
}

async function fetchTranscriptViaApi(videoId: string): Promise<string> {
  const playerResponse = await fetchPlayerResponse(videoId);
  const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

  const orderedTracks = [...tracks]
    .map((track) => {
      const picked = pickCaptionTrack([track]);
      const language = (picked?.languageCode || picked?.language_code || "").toLowerCase();
      const languagePriority = language === "en" || language === "en-us" || language === "en-gb" ? 0 : language.startsWith("en-") ? 1 : 2;
      const asrPenalty = picked?.kind === "asr" ? 1 : 0;
      return { track, score: languagePriority + asrPenalty };
    })
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.track);

  const trackErrors: string[] = [];
  for (const track of orderedTracks) {
    const baseUrl = track.baseUrl || track.base_url;
    if (!baseUrl) continue;

    try {
      const text = await fetchCaptionText(baseUrl);
      if (text) return text;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      trackErrors.push(msg);
    }
  }

  if (tracks.length > 0) {
    console.error("youtube transcript track attempts failed", {
      videoId,
      trackCount: tracks.length,
      languages: tracks.map((track) => track.languageCode || track.language_code || "unknown"),
      errors: trackErrors.slice(0, 3),
    });
    throw new Error("Unable to parse caption data for this video.");
  }

  throw new Error("Could not fetch captions for this video.");
}

export function extractVideoId(input: string): string | null {
  const value = input.trim();

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId && videoId.length === 11 ? videoId : null;
    }

    if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        return videoId && videoId.length === 11 ? videoId : null;
      }

      if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
        const videoId = url.pathname.split("/").filter(Boolean)[1];
        return videoId && videoId.length === 11 ? videoId : null;
      }
    }
  } catch {
    const fallback = value.match(/([a-zA-Z0-9_-]{11})/);
    return fallback?.[1] ?? null;
  }

  return null;
}

function mapTranscriptError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const message = rawMessage.toLowerCase();

  if (message.includes("no captions available for this video")) {
    return "Could not fetch captions - the video may be private or have captions disabled.";
  }

  if (message.includes("private") || message.includes("disabled") || message.includes("unavailable")) {
    return "Could not fetch captions - the video may be private or have captions disabled.";
  }

  const detail = rawMessage.length > 240 ? `${rawMessage.slice(0, 240)}...` : rawMessage;
  return `Unable to fetch captions for this video right now. ${detail}`;
}

export async function fetchTranscript(videoUrl: string): Promise<string> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Please enter a valid YouTube video URL.");
  }

  try {
    return await fetchTranscriptViaApi(videoId);
  } catch (error) {
    throw new Error(mapTranscriptError(error));
  }
}

export async function fetchCaptionTranscript(videoUrl: string): Promise<{
  videoId: string;
  transcript: string;
}> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Please enter a valid YouTube video URL.");
  }

  const transcript = await fetchTranscript(videoUrl);
  return { videoId, transcript };
}

export async function getVideoDuration(videoUrl: string): Promise<number> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return 0;

  try {
    const playerResponse = await fetchPlayerResponse(videoId);
    const lengthSeconds = playerResponse.videoDetails?.lengthSeconds;
    return lengthSeconds ? Number(lengthSeconds) || 0 : 0;
  } catch (error) {
    console.error("Failed to read video duration", error);
    return 0;
  }
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
    const response = await fetchWithTimeout(
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
