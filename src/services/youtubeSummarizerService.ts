// src/services/youtubeSummarizerService.ts

import { summarizeTranscript } from "@/lib/groq";
import { Innertube } from "youtubei.js";
import ytdlp from "yt-dlp-exec";
import fs from "fs";
import path from "path";
import os from "os";

// Caching mechanism
const transcriptCache = new Map<string, TranscriptResult>();

type Method = "captions" | "captionTrack" | "audioTranscription";

type TranscriptResult = {
  transcript: string;
  methodUsed: Method;
  duration: number;
};

// --- Start of transcript retrieval logic ---

// Types from youtubei.js
type CaptionTrack = {
  base_url: string;
  language_code?: string;
  kind?: string;
};

// Types from yt-dlp-exec
type YtDlpSubtitleTrack = {
  ext?: string;
  url?: string;
  name?: string;
};

type YtDlpMetadata = {
  id?: string;
  duration?: number;
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

function normalizeTranscriptText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/<[^>]+>/g, " ")
    .trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function json3ToPlainText(payload: SubtitleJson3): string {
  const lines: string[] = [];

  for (const event of payload.events || []) {
    const line = (event.segs || []).map((segment) => segment.utf8 || "").join("");
    const normalized = normalizeTranscriptText(line);
    if (!normalized) continue;

    if (lines[lines.length - 1] !== normalized) {
      lines.push(normalized);
    }
  }

  return lines.join(" ").trim();
}

function xmlToPlainText(xml: string): string {
  const matches = xml.match(/<text[^>]*>([\s\S]*?)<\/text>/g) || [];
  const lines: string[] = [];

  for (const match of matches) {
    const inner = match.replace(/^<text[^>]*>/, "").replace(/<\/text>$/, "");
    const normalized = normalizeTranscriptText(decodeHtmlEntities(inner));
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
    const contentType = jsonResponse.headers.get("content-type") || "";
    if (contentType.includes("json")) {
      const payload = (await jsonResponse.json()) as SubtitleJson3;
      const jsonText = json3ToPlainText(payload);
      if (jsonText) {
        return jsonText;
      }
    } else {
      const body = await jsonResponse.text();
      const fallbackXmlText = xmlToPlainText(body);
      if (fallbackXmlText) {
        return fallbackXmlText;
      }
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
  return xmlToPlainText(xml);
}

function pickCaptionTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (!tracks.length) return null;

  const languagePriority = ["en", "en-us", "en-gb"];

  const scoredTracks = tracks
    .map((track) => {
      const language = (track.language_code || "").toLowerCase();
      const priority = languagePriority.indexOf(language);
      const languageScore = priority >= 0 ? priority : language.startsWith("en-") ? 5 : 50;
      const kindScore = track.kind === "asr" ? 1 : 0;

      return {
        track,
        score: languageScore + kindScore,
      };
    })
    .sort((a, b) => a.score - b.score);

  const best = scoredTracks[0]?.track;
  return best ?? null;
}

async function getTranscriptFromCaptions(videoId: string): Promise<string | null> {
  try {
    const youtube = await Innertube.create();
    const info = await youtube.getInfo(videoId);

    const tracks = (info.captions?.caption_tracks || []) as CaptionTrack[];
    const selectedTrack = pickCaptionTrack(tracks);

    if (selectedTrack?.base_url) {
      const innerTubeText = await fetchCaptionText(selectedTrack.base_url);
      if (innerTubeText) {
        console.log("caption_api_success");
        return innerTubeText;
      }
    }
    console.log("caption_api_failure", "No suitable track found");
    return null;
  } catch (error) {
    console.log("caption_api_failure", error);
    return null;
  }
}

async function getTranscriptFromCaptionTrack(videoUrl: string): Promise<string | null> {
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
        transcript = json3ToPlainText(subtitlePayload);
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
    console.log("caption_track_success");
    return transcript;
  } catch (error) {
    console.log("caption_track_failure", error);
    return null;
  }
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

async function getTranscriptFromAudio(videoId: string): Promise<string | null> {
  console.log("audio_transcription_used");
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const tempFile = path.join(os.tmpdir(), `${videoId}.mp3`);
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("GROQ_API_KEY not found for audio transcription");
    return null;
  }

  try {
    // 1. Download audio using yt-dlp
    await ytdlp(videoUrl, {
      extractAudio: true,
      audioFormat: "mp3",
      output: tempFile,
      noWarnings: true,
    });

    if (!fs.existsSync(tempFile)) {
      throw new Error("Failed to download audio file");
    }

    // 2. Transcribe using Groq Whisper API
    // We use a custom fetch here because standard Groq SDK/libraries might not be available or needed
    const apiKey = process.env.GROQ_API_KEY;
    const model = "whisper-large-v3";

    // Use a standard fetch with multipart form data
    const body = new FormData();
    // In Node.js environment, we need to handle the file differently if using global fetch
    // However, in Next.js/Vercel, we can pass a Blob
    const audioData = fs.readFileSync(tempFile);
    const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
    body.append("file", audioBlob, "audio.mp3");
    body.append("model", model);
    body.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: body
    });

    // Cleanup
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq Whisper API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("audio_transcription_success");
    return data.text || null;
  } catch (error) {
    console.error("audio_transcription_failure", error);
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    return null;
  }
}

async function getVideoDuration(videoUrl: string): Promise<number> {
    try {
        const metadata = (await ytdlp(videoUrl, {
            dumpSingleJson: true,
            skipDownload: true,
        })) as YtDlpMetadata;
        return metadata.duration ?? 0;
    } catch (error) {
        console.error("Failed to get video duration", error);
        return 0;
    }
}

async function getTranscript(videoId: string, videoUrl: string): Promise<TranscriptResult | null> {
  if (transcriptCache.has(videoId)) {
    return transcriptCache.get(videoId)!;
  }

  const duration = await getVideoDuration(videoUrl);

  let transcript = await getTranscriptFromCaptions(videoId);
  if (transcript) {
    const result = { transcript, methodUsed: "captions" as Method, duration };
    transcriptCache.set(videoId, result);
    return result;
  }

  transcript = await getTranscriptFromCaptionTrack(videoUrl);
  if (transcript) {
    const result = { transcript, methodUsed: "captionTrack" as Method, duration };
    transcriptCache.set(videoId, result);
    return result;
  }

  if (duration > 1800) { // 30 minutes
    console.log("audio_transcription_skipped_due_to_length");
    return null;
  }

  transcript = await getTranscriptFromAudio(videoId);
  if (transcript) {
    const result = { transcript, methodUsed: "audioTranscription" as Method, duration };
    transcriptCache.set(videoId, result);
    return result;
  }

  return null;
}

// --- End of transcript retrieval logic ---

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

export function extractYouTubeVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (!YOUTUBE_HOSTS.has(host)) {
      return null;
    }

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return id.length === 11 ? id : null;
    }

    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v") ?? "";
      return id.length === 11 ? id : null;
    }

    if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
      const id = url.pathname.split("/").filter(Boolean)[1] ?? "";
      return id.length === 11 ? id : null;
    }

    return null;
  } catch {
    const match = value.match(/^[a-zA-Z0-9_-]{11}$/);
    return match ? match[0] : null;
  }
}

async function getVideoTitle(videoUrl: string): Promise<string> {
  const videoId = extractYouTubeVideoId(videoUrl);
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

const summarizationRequests = new Set<string>();

export async function summarizeVideo(videoUrl: string) {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  if (summarizationRequests.has(videoId)) {
    console.log("duplicate_processing_request_prevented", { videoId });
    throw new Error("Duplicate summarization request for this video.");
  }
  summarizationRequests.add(videoId);

  try {
    const transcriptResult = await getTranscript(videoId, videoUrl);

    if (!transcriptResult) {
      throw new Error("This video does not provide accessible captions.");
    }

    const { transcript, methodUsed, duration } = transcriptResult;

    const { tldr, keyPoints, detailedSummary } = await summarizeTranscript(transcript);
    const videoTitle = await getVideoTitle(videoUrl);

    console.log("summarization_completed", { videoId, methodUsed });

    return {
      success: true,
      videoTitle: videoTitle,
      detailedSummary: detailedSummary,
      tldr: tldr,
      keyPoints: keyPoints,
      duration: new Date(duration * 1000).toISOString().substr(11, 8),
      methodUsed: methodUsed,
    };
  } catch (error) {
    console.error("summarization_error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during summarization.",
    };
  } finally {
    summarizationRequests.delete(videoId);
  }
}
