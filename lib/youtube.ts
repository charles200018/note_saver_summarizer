import ytdlp from "yt-dlp-exec";

type YtDlpSubtitleTrack = {
  ext?: string;
  url?: string;
  name?: string;
};

type YtDlpMetadata = {
  id?: string;
  requested_subtitles?: Record<string, YtDlpSubtitleTrack | YtDlpSubtitleTrack[]>;
  subtitles?: Record<string, YtDlpSubtitleTrack[]>;
  automatic_captions?: Record<string, YtDlpSubtitleTrack[]>;
};

type SubtitleJson3 = {
  events?: Array<{
    segs?: Array<{
      utf8?: string;
    }>;
  }>;
};

function normalizeCaptionText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/<[^>]+>/g, " ")
    .trim();
}

function collapseTranscript(lines: string[]): string {
  const cleaned = lines.map((line) => normalizeCaptionText(line)).filter(Boolean);

  // Drop immediate duplicates from fragmented subtitle segments.
  const deduped: string[] = [];
  for (const line of cleaned) {
    if (deduped[deduped.length - 1] !== line) {
      deduped.push(line);
    }
  }

  return deduped.join(" ");
}

function flattenSubtitleMap(
  source?: Record<string, YtDlpSubtitleTrack | YtDlpSubtitleTrack[]>
): Array<{ language: string; track: YtDlpSubtitleTrack }> {
  if (!source) return [];

  const results: Array<{ language: string; track: YtDlpSubtitleTrack }> = [];
  for (const [language, value] of Object.entries(source)) {
    const tracks = Array.isArray(value) ? value : [value];
    for (const track of tracks) {
      results.push({ language, track });
    }
  }

  return results;
}

function collectEnglishTracks(metadata: YtDlpMetadata): YtDlpSubtitleTrack[] {
  const languagePriority = ["en", "en-us", "en-gb"];
  const buckets = [metadata.requested_subtitles, metadata.subtitles, metadata.automatic_captions];
  const tracks: YtDlpSubtitleTrack[] = [];
  const seenUrls = new Set<string>();

  for (const source of buckets) {
    if (!source) continue;

    const entries = flattenSubtitleMap(source);
    const sourceEntries = entries.sort((left, right) => {
      const leftIndex = languagePriority.indexOf(left.language.toLowerCase());
      const rightIndex = languagePriority.indexOf(right.language.toLowerCase());
      const normalizedLeft = leftIndex === -1 ? 99 : leftIndex;
      const normalizedRight = rightIndex === -1 ? 99 : rightIndex;
      return normalizedLeft - normalizedRight;
    });

    for (const entry of sourceEntries) {
      const normalizedLanguage = entry.language.toLowerCase();
      if (
        normalizedLanguage !== "en" &&
        normalizedLanguage !== "en-us" &&
        normalizedLanguage !== "en-gb" &&
        !normalizedLanguage.startsWith("en-")
      ) {
        continue;
      }

      const variant = entry.track;
      if (!variant.url) continue;
      if (seenUrls.has(variant.url)) continue;

      if (variant.ext === "json3" || variant.url.includes("fmt=json3")) {
        seenUrls.add(variant.url);
        tracks.push(variant);
      }
    }
  }

  return tracks;
}

async function runYtDlpForSubtitleMetadata(videoUrl: string): Promise<YtDlpMetadata> {
  try {
    const metadata = (await ytdlp(videoUrl, {
      dumpSingleJson: true,
      skipDownload: true,
      writeAutoSub: true,
      writeSub: true,
      subLang: "en,en-US,en-GB,en.*",
      subFormat: "json3",
      noWarnings: true,
      preferFreeFormats: true,
    })) as YtDlpMetadata;

    return metadata;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`yt-dlp process failed: ${message}`);
  }
}

async function fetchSubtitleJson3(track: YtDlpSubtitleTrack): Promise<SubtitleJson3> {
  if (!track.url) {
    throw new Error("Subtitle track URL is missing.");
  }

  const response = await fetch(track.url, {
    cache: "no-store",
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Subtitle request failed with ${response.status}.`);
  }

  return (await response.json()) as SubtitleJson3;
}

function subtitleJson3ToTranscript(payload: SubtitleJson3): string {
  const lines: string[] = [];

  for (const event of payload.events || []) {
    const text = (event.segs || []).map((segment) => segment.utf8 || "").join("").trim();
    if (text) {
      lines.push(text);
    }
  }

  return collapseTranscript(lines);
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

  if (message.includes("yt-dlp") || message.includes("subtitle") || message.includes("caption") || message.includes("transcript")) {
    return "Subtitles are unavailable for this video, or YouTube did not return English subtitle tracks.";
  }

  if (message.includes("private") || message.includes("unavailable") || message.includes("not found")) {
    return "This video is unavailable, private, or cannot be read right now.";
  }

  const detail = rawMessage.length > 240 ? `${rawMessage.slice(0, 240)}...` : rawMessage;
  return `Unable to fetch the transcript for this video right now. ${detail}`;
}

export async function fetchTranscript(videoUrl: string): Promise<string> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Please enter a valid YouTube video URL.");
  }

  try {
    const metadata = await runYtDlpForSubtitleMetadata(videoUrl);
    if (!metadata?.id) {
      throw new Error("yt-dlp did not return metadata for this video.");
    }

    const englishTracks = collectEnglishTracks(metadata);
    if (englishTracks.length === 0) {
      throw new Error("No English subtitles or auto-subtitles were found.");
    }

    let lastError: unknown;
    let transcript = "";

    for (const track of englishTracks) {
      try {
        const subtitlePayload = await fetchSubtitleJson3(track);
        transcript = subtitleJson3ToTranscript(subtitlePayload);
        if (transcript) {
          break;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!transcript) {
      const suffix = lastError instanceof Error ? ` ${lastError.message}` : "";
      throw new Error(`Transcript was empty after parsing subtitle json3.${suffix}`.trim());
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
