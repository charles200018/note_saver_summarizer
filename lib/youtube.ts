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
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    cache: "no-store",
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error("Could not load the YouTube watch page.");
  }

  const html = await response.text();
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

  const jsonUrl = new URL(baseUrl);
  jsonUrl.searchParams.set("fmt", "json3");

  const jsonResponse = await fetch(jsonUrl.toString(), {
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

  const xmlResponse = await fetch(baseUrl, {
    cache: "no-store",
    headers,
  });

  if (!xmlResponse.ok) {
    throw new Error("This video does not provide accessible captions.");
  }

  const xml = await xmlResponse.text();
  const matches = xml.match(/<text[^>]*>([\s\S]*?)<\/text>/g) || [];
  const lines: string[] = [];

  for (const match of matches) {
    const inner = match.replace(/^<text[^>]*>/, "").replace(/<\/text>$/, "");
    const normalized = normalizeText(inner);
    if (!normalized) continue;
    if (lines[lines.length - 1] !== normalized) {
      lines.push(normalized);
    }
  }

  return lines.join(" ").trim();
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
  const selectedTrack = pickCaptionTrack(tracks);

  const baseUrl = selectedTrack?.baseUrl || selectedTrack?.base_url;
  if (baseUrl) {
    const text = await fetchCaptionText(baseUrl);
    if (text) return text;
  }

  if (tracks.length > 0) {
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
