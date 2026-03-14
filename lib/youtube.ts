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

function extractCaptionTracksFromHtml(html: string): Array<{
  baseUrl: string;
  languageCode?: string;
  kind?: string;
}> {
  const match = html.match(/"captionTracks":(\[[^\]]*\])/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[1]) as Array<{
      baseUrl: string;
      languageCode?: string;
      kind?: string;
    }>;
    return parsed.filter((track) => Boolean(track.baseUrl));
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
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });

  if (!watchResponse.ok) {
    throw new Error("Unable to load video metadata for captions.");
  }

  const html = await watchResponse.text();
  const tracks = extractCaptionTracksFromHtml(html);
  if (tracks.length === 0) {
    throw new Error("No caption tracks found.");
  }

  const preferredTrack =
    tracks.find((track) => track.languageCode?.toLowerCase().startsWith("en") && track.kind !== "asr") ||
    tracks.find((track) => track.languageCode?.toLowerCase().startsWith("en")) ||
    tracks[0];

  const captionUrl = preferredTrack.baseUrl;
  const vttResponse = await fetch(`${captionUrl}&fmt=vtt`, { cache: "no-store" });
  if (vttResponse.ok) {
    const vtt = await vttResponse.text();
    const vttTranscript = parseVttTranscript(vtt);
    if (vttTranscript) return vttTranscript;
  }

  const xmlResponse = await fetch(captionUrl, { cache: "no-store" });
  if (!xmlResponse.ok) {
    throw new Error("Caption track request failed.");
  }

  const xml = await xmlResponse.text();
  const xmlTranscript = parseXmlTranscript(xml);
  if (xmlTranscript) return xmlTranscript;

  throw new Error("Caption track was found but transcript was empty.");
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
    return await fetchTranscriptViaDirectCaptionTracks(videoId);
  } catch {
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
