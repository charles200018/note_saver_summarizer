import { Innertube } from "youtubei.js";

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

function normalizeTranscriptText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/<[^>]+>/g, " ")
    .trim();
}

type Json3Payload = {
  events?: Array<{
    segs?: Array<{ utf8?: string }>;
  }>;
};

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

type CaptionTrack = {
  base_url: string;
  language_code?: string;
  kind?: string;
};

type WatchPageCaptionTrack = {
  baseUrl: string;
  languageCode?: string;
  kind?: string;
};

type WatchPagePlayerResponse = {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: WatchPageCaptionTrack[];
    };
  };
};

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

function pickWatchPageCaptionTrack(tracks: WatchPageCaptionTrack[]): WatchPageCaptionTrack | null {
  if (!tracks.length) return null;

  const languagePriority = ["en", "en-us", "en-gb"];
  const scoredTracks = tracks
    .map((track) => {
      const language = (track.languageCode || "").toLowerCase();
      const priority = languagePriority.indexOf(language);
      const languageScore = priority >= 0 ? priority : language.startsWith("en-") ? 5 : 50;
      const kindScore = track.kind === "asr" ? 1 : 0;
      return { track, score: languageScore + kindScore };
    })
    .sort((a, b) => a.score - b.score);

  return scoredTracks[0]?.track ?? null;
}

function json3ToPlainText(payload: Json3Payload): string {
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
      const payload = (await jsonResponse.json()) as Json3Payload;
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

async function fetchWatchPagePlayerResponse(videoId: string): Promise<WatchPagePlayerResponse> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en`;
  const response = await fetch(watchUrl, {
    cache: "no-store",
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      cookie: "CONSENT=YES+cb.20210328-17-p0.en+FX+999",
    },
  });

  if (!response.ok) {
    throw new Error("This video does not provide accessible captions.");
  }

  const html = await response.text();
  const marker = "ytInitialPlayerResponse =";
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("This video does not provide accessible captions.");
  }

  let start = html.indexOf("{", markerIndex + marker.length);
  if (start === -1) {
    throw new Error("This video does not provide accessible captions.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = start;

  for (; end < html.length; end += 1) {
    const char = html[end];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
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
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end += 1;
        break;
      }
    }
  }

  if (depth !== 0) {
    throw new Error("This video does not provide accessible captions.");
  }

  const payload = html.slice(start, end);
  return JSON.parse(payload) as WatchPagePlayerResponse;
}

async function fetchTranscriptFromWatchPage(videoId: string): Promise<string> {
  const playerResponse = await fetchWatchPagePlayerResponse(videoId);
  const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  const selectedTrack = pickWatchPageCaptionTrack(tracks);

  if (!selectedTrack?.baseUrl) {
    throw new Error("This video does not provide accessible captions.");
  }

  const text = await fetchCaptionText(selectedTrack.baseUrl);
  if (!text) {
    throw new Error("This video does not provide accessible captions.");
  }

  return text;
}

export async function getTranscript(videoId: string): Promise<string> {
  try {
    const youtube = await Innertube.create();
    const info = await youtube.getInfo(videoId);

    const tracks = (info.captions?.caption_tracks || []) as CaptionTrack[];
    const selectedTrack = pickCaptionTrack(tracks);

    if (selectedTrack?.base_url) {
      const innerTubeText = await fetchCaptionText(selectedTrack.base_url);
      if (innerTubeText) {
        return innerTubeText;
      }
    }
  } catch (error) {
    console.error("youtubeTranscript Innertube path failed", error);
  }

  try {
    return await fetchTranscriptFromWatchPage(videoId);
  } catch (error) {
    console.error("youtubeTranscript watch-page path failed", error);
    throw new Error("This video does not provide accessible captions.");
  }
}

export async function getTranscriptFromUrl(youtubeUrl: string): Promise<{ videoId: string; transcript: string }> {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    throw new Error("Please provide a valid YouTube URL.");
  }

  const transcript = await getTranscript(videoId);
  return { videoId, transcript };
}
