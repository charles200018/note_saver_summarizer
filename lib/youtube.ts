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

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

function parseCaptionXml(xml: string): string {
  const segments = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((match) =>
    decodeHtmlEntities(match[1] || "")
  );

  return collapseTranscript(segments);
}

async function fetchCaptionXml(videoId: string, lang: string, kind?: "asr"): Promise<string | null> {
  const captionUrl = new URL("https://video.google.com/timedtext");
  captionUrl.searchParams.set("lang", lang);
  captionUrl.searchParams.set("v", videoId);
  if (kind) {
    captionUrl.searchParams.set("kind", kind);
  }

  const response = await fetch(captionUrl.toString(), {
    cache: "no-store",
    headers: {
      "accept-language": `${lang},en-US;q=0.9,en;q=0.8`,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    return null;
  }

  const xml = await response.text();
  if (!xml.trim() || !xml.includes("<text")) {
    return null;
  }

  return xml;
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

  if (message.includes("caption") || message.includes("timedtext") || message.includes("transcript")) {
    return "Captions are unavailable for this video, or YouTube did not return caption data.";
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

  let lastError: unknown = new Error("Captions are unavailable.");
  for (const lang of ["en", "en-US", "en-GB"]) {
    try {
      const manualXml = await fetchCaptionXml(videoId, lang);
      const manualText = manualXml ? parseCaptionXml(manualXml) : "";
      if (manualText) {
        return manualText;
      }

      const autoXml = await fetchCaptionXml(videoId, lang, "asr");
      const autoText = autoXml ? parseCaptionXml(autoXml) : "";
      if (autoText) {
        return autoText;
      }
    } catch (error) {
      lastError = error;
    }
  }

  try {
    const fallbackXml = await fetchCaptionXml(videoId, "en");
    const fallbackText = fallbackXml ? parseCaptionXml(fallbackXml) : "";
    if (fallbackText) {
      return fallbackText;
    }
  } catch (error) {
    lastError = error;
  }

  if (lastError instanceof Error && !String(lastError.message).trim()) {
    lastError = new Error("Caption XML was empty.");
  }

  throw new Error(mapTranscriptError(lastError));
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
  if (!transcript.trim()) {
    throw new Error("Transcript was empty after parsing caption XML.");
  }

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
