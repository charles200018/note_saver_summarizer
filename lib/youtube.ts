import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

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

function parseVttToText(vttContent: string): string {
  const lines = vttContent.split("\n");
  const textLines: string[] = [];
  let lastText = "";

  for (const line of lines) {
    // Skip WEBVTT header, timestamps, and empty lines
    if (
      line.startsWith("WEBVTT") ||
      line.startsWith("Kind:") ||
      line.startsWith("Language:") ||
      line.includes("-->") ||
      line.trim() === ""
    ) {
      continue;
    }

    // Clean up the line - remove VTT formatting tags
    let cleanLine = line
      .replace(/<[^>]+>/g, "") // Remove HTML-like tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();

    // Skip duplicate lines (VTT often has repeated text)
    if (cleanLine && cleanLine !== lastText) {
      textLines.push(cleanLine);
      lastText = cleanLine;
    }
  }

  return textLines.join(" ");
}

async function fetchTranscriptViaYtDlp(videoId: string): Promise<string> {
  const tempDir = tmpdir();
  const outputBase = join(tempDir, `yt_transcript_${videoId}_${Date.now()}`);
  const vttFile = `${outputBase}.en.vtt`;
  const autoVttFile = `${outputBase}.en.vtt`;
  
  // Full path to yt-dlp executable
  const ytDlpPath = process.platform === 'win32' 
    ? 'C:\\Users\\ichar\\AppData\\Local\\Microsoft\\WinGet\\Links\\yt-dlp.exe'
    : 'yt-dlp';

  try {
    // Try to get subtitles (manual captions first, then auto-generated)
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // First try manual subtitles
    try {
      await execAsync(
        `"${ytDlpPath}" --write-sub --sub-lang en --skip-download -o "${outputBase}" "${videoUrl}"`,
        { timeout: 60000 }
      );
      
      const content = await readFile(vttFile, "utf-8");
      await unlink(vttFile).catch(() => {});
      return parseVttToText(content);
    } catch {
      // If manual subs fail, try auto-generated
    }

    // Try auto-generated subtitles
    await execAsync(
      `"${ytDlpPath}" --write-auto-sub --sub-lang en --skip-download -o "${outputBase}" "${videoUrl}"`,
      { timeout: 60000 }
    );

    const content = await readFile(autoVttFile, "utf-8");
    await unlink(autoVttFile).catch(() => {});
    return parseVttToText(content);
  } catch (error) {
    // Clean up any leftover files
    await unlink(vttFile).catch(() => {});
    await unlink(autoVttFile).catch(() => {});
    
    if (error instanceof Error) {
      if (error.message.includes("subtitles")) {
        throw new Error("This video doesn't have captions/subtitles available");
      }
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
    throw new Error("Failed to fetch transcript");
  }
}

export async function fetchTranscript(videoUrl: string): Promise<string> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  return await fetchTranscriptViaYtDlp(videoId);
}

export function getVideoThumbnail(videoUrl: string): string {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return "";
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getVideoTitle(videoUrl: string): string {
  const videoId = extractVideoId(videoUrl);
  return videoId ? `YouTube Video (${videoId})` : "Unknown Video";
}
