import ytdlp from "yt-dlp-exec";
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
type CaptionTrack = {
  baseUrl: string;
  languageCode?: string;
  kind?: string;
};

type PlayerResponse = {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
};

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

async function fetchPlayerResponse(videoId: string): Promise<PlayerResponse> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en`;

  const response = await fetch(watchUrl, {
    cache: "no-store",
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      cookie: "CONSENT=YES+cb.20210328-17-p0.en+FX+999",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load YouTube watch page (${response.status}).`);
  }

  const html = await response.text();
  const marker = "ytInitialPlayerResponse =";
  const index = html.indexOf(marker);
  if (index === -1) {
    throw new Error("Could not find ytInitialPlayerResponse in watch page.");
  }

  let start = html.indexOf("{", index + marker.length);
  if (start === -1) {
    throw new Error("Could not locate player response JSON start.");
  }

  let depth = 0;
  let inString = false;
  let escape = false;
  let i = start;

  for (; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "\"") {
        inString = false;
      }
    } else {
      if (ch === "\"") {
        inString = true;
      } else if (ch === "{") {
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
    }
  }

  if (depth !== 0) {
    throw new Error("Failed to parse player response JSON from watch page.");
  }

  const jsonString = html.slice(start, i);
  return JSON.parse(jsonString) as PlayerResponse;
}

function pickBestEnglishTrack(tracks: CaptionTrack[] | undefined): CaptionTrack | null {
  if (!tracks || tracks.length === 0) return null;

  const languagePriority = ["en", "en-us", "en-gb"];

  const scored = tracks
    .map((track) => {
      const code = (track.languageCode || "").toLowerCase();
      const asr = track.kind === "asr";
      let score = 100;

      const idx = languagePriority.indexOf(code);
      if (idx !== -1) {
        score = idx * 2;
      } else if (code.startsWith("en-")) {
        score = 10;
      }

      if (asr) {
        score += 1;
      }

      return { track, score };
    })
    .sort((a, b) => a.score - b.score);

  return scored[0]?.track ?? null;
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

  if (message.includes("no english subtitles or auto-subtitles were found") || message.includes("no caption tracks were found")) {
    return "Subtitles are unavailable for this video, or YouTube did not return English subtitle tracks.";
  }

  if (message.includes("yt-dlp process failed")) {
    const detail = rawMessage.length > 240 ? `${rawMessage.slice(0, 240)}...` : rawMessage;
    return `The caption extractor failed while talking to YouTube. Details: ${detail}`;
  }

  if (message.includes("could not find ytinitialplayerresponse") || message.includes("failed to load youtube watch page")) {
    const detail = rawMessage.length > 240 ? `${rawMessage.slice(0, 240)}...` : rawMessage;
    return `We could not read caption information from the YouTube watch page. Details: ${detail}`;
  }

  if (message.includes("transcript was empty after parsing subtitle json3")) {
    const detail = rawMessage.length > 240 ? `${rawMessage.slice(0, 240)}...` : rawMessage;
    return `We found subtitle tracks but could not build a transcript from them. Details: ${detail}`;
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
    // Primary path: yt-dlp, which is more resilient when available.
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
          const response = await fetch(track.url!, {
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

          const subtitlePayload = (await response.json()) as SubtitleJson3;
          transcript = subtitleJson3ToTranscript(subtitlePayload);
          if (transcript) {
            break;
          }
        } catch (innerError) {
          lastError = innerError;
        }
      }

      if (!transcript) {
        const suffix = lastError instanceof Error ? ` ${lastError.message}` : "";
        throw new Error(`Transcript was empty after parsing subtitle json3.${suffix}`.trim());
      }

      return transcript;
    } catch (ytError) {
      // If yt-dlp isn't available (e.g., ENOENT on Vercel), fall back to watch-page captions.
      console.error("fetchTranscript yt-dlp path failed, falling back to watch page", ytError);
    }

    const playerResponse = await fetchPlayerResponse(videoId);
    const tracks =
      playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

    if (!tracks || tracks.length === 0) {
      throw new Error("No caption tracks were found in the YouTube player response.");
    }

    const bestTrack = pickBestEnglishTrack(tracks);
    if (!bestTrack) {
      throw new Error("No English subtitles or auto-subtitles were found.");
    }

    const url = new URL(bestTrack.baseUrl);
    url.searchParams.set("fmt", "json3");

    const response = await fetch(url.toString(), {
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

    const subtitlePayload = (await response.json()) as SubtitleJson3;
    const transcript = subtitleJson3ToTranscript(subtitlePayload);

    if (!transcript) {
      throw new Error("Transcript was empty after parsing subtitle json3.");
    }

    return transcript;
  } catch (error) {
    console.error("fetchTranscript internal error", error);
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
