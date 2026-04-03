import { getSubtitles } from "youtube-captions-scraper";

type Caption = {
  text: string;
};

function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

async function fetchTranscriptViaApi(videoId: string): Promise<string> {
  const captions = (await getSubtitles({ videoID: videoId, lang: "en" })) as Caption[] | undefined;

  if (!captions || captions.length === 0) {
    throw new Error("No captions available for this video");
  }

  return normalizeText(captions.map((caption) => caption.text).join(" "));
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
