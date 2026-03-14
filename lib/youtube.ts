function normalizeCaptionText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/<[^>]+>/g, " ")
    .trim();
}

function collapseTranscript(lines: string[]): string {
  return lines.map((line) => normalizeCaptionText(line)).filter(Boolean).join(" ");
}

type CaptionTrack = {
  baseUrl: string;
  languageCode?: string;
  kind?: string;
  name?: {
    simpleText?: string;
    runs?: Array<{ text?: string }>;
  };
};

type PlayerResponse = {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
};

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

function parseCaptionXml(xml: string): string {
  const segments = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((match) =>
    decodeHtmlEntities(match[1] || "")
  );

  return collapseTranscript(segments);
}

function extractJsonObject(source: string, marker: string): string | null {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const startIndex = source.indexOf("{", markerIndex + marker.length);
  if (startIndex === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

async function fetchYouTubeWatchPage(videoId: string): Promise<string> {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    cache: "no-store",
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      cookie: "CONSENT=YES+1; SOCS=CAI",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load YouTube watch page: ${response.status}`);
  }

  return response.text();
}

function extractPlayerResponse(html: string): PlayerResponse {
  const candidates = [
    "var ytInitialPlayerResponse = ",
    "ytInitialPlayerResponse = ",
    "window[\"ytInitialPlayerResponse\"] = ",
  ];

  for (const marker of candidates) {
    const json = extractJsonObject(html, marker);
    if (!json) {
      continue;
    }

    try {
      return JSON.parse(json) as PlayerResponse;
    } catch {
      // Try next marker.
    }
  }

  throw new Error("Could not locate ytInitialPlayerResponse on the watch page.");
}

function getCaptionTracks(playerResponse: PlayerResponse): CaptionTrack[] {
  return playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
}

function getTrackName(track: CaptionTrack): string {
  if (track.name?.simpleText) {
    return track.name.simpleText;
  }

  return track.name?.runs?.map((run) => run.text || "").join(" ") || "";
}

function selectBestEnglishCaptionTrack(captionTracks: CaptionTrack[]): CaptionTrack | null {
  if (captionTracks.length === 0) {
    return null;
  }

  const scoreTrack = (track: CaptionTrack): number => {
    const code = (track.languageCode || "").toLowerCase();
    const isAutoCaption = track.kind === "asr" || getTrackName(track).toLowerCase().includes("auto");

    if (code === "en" && !isAutoCaption) return 100;
    if ((code === "en-us" || code === "en-gb") && !isAutoCaption) return 90;
    if (code.startsWith("en") && !isAutoCaption) return 80;
    if (code === "en" && isAutoCaption) return 70;
    if ((code === "en-us" || code === "en-gb") && isAutoCaption) return 60;
    if (code.startsWith("en") && isAutoCaption) return 50;
    return 0;
  };

  const sorted = [...captionTracks]
    .map((track) => ({ track, score: scoreTrack(track) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return sorted[0]?.track ?? null;
}

async function fetchCaptionTrackXml(baseUrl: string): Promise<string> {
  const response = await fetch(baseUrl, {
    cache: "no-store",
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Caption track request failed: ${response.status}`);
  }

  const xml = await response.text();
  if (!xml.trim()) {
    throw new Error("Caption track response was empty.");
  }

  return xml;
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
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("ytinitialplayerresponse") || message.includes("caption") || message.includes("transcript")) {
    return "Captions are unavailable for this video, or YouTube did not expose caption tracks.";
  }

  if (message.includes("private") || message.includes("unavailable") || message.includes("not found")) {
    return "This video is unavailable, private, or cannot be read right now.";
  }

  return "Unable to fetch the transcript for this video right now. Please try another public video with captions.";
}

export async function fetchTranscript(videoUrl: string): Promise<string> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Please enter a valid YouTube video URL.");
  }

  try {
    const html = await fetchYouTubeWatchPage(videoId);
    const playerResponse = extractPlayerResponse(html);
    const captionTracks = getCaptionTracks(playerResponse);

    if (captionTracks.length === 0) {
      throw new Error("Caption tracks were not found for this video.");
    }

    const bestTrack = selectBestEnglishCaptionTrack(captionTracks);
    if (!bestTrack?.baseUrl) {
      throw new Error("No English caption track is available for this video.");
    }

    const xml = await fetchCaptionTrackXml(bestTrack.baseUrl);
    const transcript = parseCaptionXml(xml);

    if (!transcript) {
      throw new Error("Transcript was empty after parsing caption XML.");
    }

    return transcript;
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
