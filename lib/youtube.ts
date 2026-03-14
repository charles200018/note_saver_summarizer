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

async function fetchTranscriptViaYoutubeTranscript(videoId: string): Promise<string> {
  const languagePreference = ["en", "en-US", "en-GB"];

  for (const lang of languagePreference) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      const text = collapseTranscript(transcript.map((line) => line.text || ""));
      if (text) return text;
    } catch {
      // Try next language.
    }
  }

  // Last attempt: let library auto-select available language track.
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const text = collapseTranscript(transcript.map((line) => line.text || ""));
    if (text) return text;
  } catch {
    // Fall through to secondary strategy.
  }

  throw new Error("Primary transcript fetch failed.");
}

async function fetchTranscriptViaCaptionsScraper(videoId: string): Promise<string> {
  const languagePreference = ["en", "en-US", "en-GB"];

  for (const lang of languagePreference) {
    try {
      const subtitles = await getSubtitles({ videoID: videoId, lang });
      const transcript = subtitles
        .map((item) => normalizeCaptionText(item.text || ""))
        .filter(Boolean)
        .join(" ");

      if (transcript) return transcript;
    } catch {
      // Try the next language variant.
    }
  }

  throw new Error("This video does not have accessible English captions.");
}

export async function fetchTranscript(videoUrl: string): Promise<string> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  try {
    return await fetchTranscriptViaYoutubeTranscript(videoId);
  } catch {
    try {
      return await fetchTranscriptViaCaptionsScraper(videoId);
    } catch {
      throw new Error(
        "Could not retrieve captions for this video. Ensure captions are available and the video is public."
      );
    }
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
