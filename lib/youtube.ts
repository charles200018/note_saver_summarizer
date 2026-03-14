import { YoutubeTranscript } from "youtube-transcript";

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

  if (message.includes("disabled") || message.includes("caption") || message.includes("transcript")) {
    return "This video does not have accessible captions, or transcript access is disabled.";
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

  let lastError: unknown;
  for (const lang of ["en", "en-US", "en-GB"]) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      const text = collapseTranscript(transcript.map((line) => line.text || ""));
      if (text) {
        return text;
      }
    } catch (error) {
      lastError = error;
    }
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const text = collapseTranscript(transcript.map((line) => line.text || ""));
    if (text) {
      return text;
    }
  } catch (error) {
    lastError = error;
  }

  throw new Error(mapTranscriptError(lastError));
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
