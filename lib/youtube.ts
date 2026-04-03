import { YoutubeTranscript } from "youtube-transcript";

type TranscriptLine = {
  text?: string;
  duration?: number;
  offset?: number;
};

type RequestHeaderMap = Record<string, string>;

type YoutubeTranscriptOptions = {
  fetch?: typeof fetch;
};

function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

function getSeconds(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 0;
  return value > 10000 ? value / 1000 : value;
}

function getForwardedHeader(name: string, requestHeaders?: RequestHeaderMap): string {
  if (!requestHeaders) return "";
  return requestHeaders[name] || requestHeaders[name.toLowerCase()] || requestHeaders[name.toUpperCase()] || "";
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  requestHeaders?: RequestHeaderMap
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const headerMap = new Headers(init.headers);
    const cookie = getForwardedHeader("cookie", requestHeaders);
    const userAgent = getForwardedHeader("user-agent", requestHeaders);

    if (cookie) headerMap.set("cookie", cookie);
    if (userAgent) headerMap.set("user-agent", userAgent);

    return await fetch(input, {
      ...init,
      headers: headerMap,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchTranscriptViaApi(videoId: string, requestHeaders?: RequestHeaderMap): Promise<string> {
  try {
    const transcriptOptions: YoutubeTranscriptOptions = {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => fetchWithTimeout(input, init ?? {}, requestHeaders),
    };

    const lines = (await YoutubeTranscript.fetchTranscript(videoId, transcriptOptions)) as TranscriptLine[];
    const transcript = lines
      .map((line) => normalizeText(line.text || ""))
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!transcript) {
      throw new Error("This video does not have captions available.");
    }

    return transcript;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    if (
      message.includes("no transcripts") ||
      message.includes("transcript is disabled") ||
      message.includes("no captions") ||
      message.includes("captions available")
    ) {
      throw new Error("This video does not have captions available.");
    }

    throw error;
  }
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

  if (message.includes("this video does not have captions available")) {
    return "This video does not have captions available.";
  }

  if (message.includes("no captions available for this video") || message.includes("no transcripts")) {
    return "Could not fetch captions - the video may be private or have captions disabled.";
  }

  if (message.includes("private") || message.includes("disabled") || message.includes("unavailable")) {
    return "Could not fetch captions - the video may be private or have captions disabled.";
  }

  if (
    message.includes("blocked") ||
    message.includes("sign in") ||
    message.includes("consent") ||
    message.includes("could not fetch") ||
    message.includes("network")
  ) {
    return "Could not fetch captions — the video may be restricted on this server. Try a different video.";
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
}>;

export async function fetchCaptionTranscript(
  videoUrl: string,
  requestHeaders: Record<string, string>
): Promise<{
  videoId: string;
  transcript: string;
}>;

export async function fetchCaptionTranscript(
  videoUrl: string,
  requestHeaders?: Record<string, string>
): Promise<{
  videoId: string;
  transcript: string;
}> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Please enter a valid YouTube video URL.");
  }

  const transcript = await fetchTranscriptViaApi(videoId, requestHeaders);
  return { videoId, transcript };
}

export async function getVideoDuration(videoUrl: string): Promise<number> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return 0;

  try {
    const lines = (await YoutubeTranscript.fetchTranscript(videoId)) as TranscriptLine[];
    if (!lines.length) return 0;

    const duration = lines.reduce((max, line) => {
      const start = getSeconds(line.offset);
      const segment = getSeconds(line.duration);
      return Math.max(max, start + segment);
    }, 0);

    return Number.isFinite(duration) ? Math.floor(duration) : 0;
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
