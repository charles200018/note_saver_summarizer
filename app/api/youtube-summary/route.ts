import { summarizeTranscript } from "@/lib/groq";
import { extractVideoId as extractYouTubeVideoId, fetchTranscript } from "@/lib/youtube";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const rateLimitStore = new Map<string, number[]>();

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = rateLimitStore.get(key) ?? [];
  const recentHits = hits.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recentHits.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(key, recentHits);
    return true;
  }

  recentHits.push(now);
  rateLimitStore.set(key, recentHits);
  return false;
}

function toSummaryResponse(summary: {
  tldr: string;
  keyPoints: string[];
  detailedSummary: string;
}) {
  return {
    TLDR: summary.tldr,
    "Key Points": summary.keyPoints,
    "Detailed Summary": summary.detailedSummary,
  };
}

export async function POST(request: Request) {
  let rawUrl = "";
  let videoIdForLogs: string | null = null;

  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Server is missing GROQ_API_KEY." }, { status: 500 });
    }

    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as { youtubeUrl?: string; url?: string };
    const youtubeUrl = (body.youtubeUrl ?? body.url ?? "").trim();
    rawUrl = youtubeUrl;

    if (!youtubeUrl) {
      return NextResponse.json({ error: "Please provide a YouTube URL." }, { status: 400 });
    }

    videoIdForLogs = extractYouTubeVideoId(youtubeUrl);
    if (!videoIdForLogs) {
      return NextResponse.json({ error: "Please provide a valid YouTube URL." }, { status: 400 });
    }

    const transcript = await fetchTranscript(youtubeUrl);
    if (transcript.length <= 500) {
      return NextResponse.json(
        { error: "This video does not provide accessible captions." },
        { status: 422 }
      );
    }

    const summary = await summarizeTranscript(transcript);

    return NextResponse.json({
      success: true,
      videoId: videoIdForLogs,
      summary: toSummaryResponse(summary),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";

    if (message.includes("This video does not provide accessible captions.")) {
      console.error("youtube-summary transcript fetch failed", {
        videoId: videoIdForLogs,
        apiResponse: null,
        transcriptFetchError: message,
        youtubeUrl: rawUrl,
      });

      return NextResponse.json(
        { error: "This video does not provide accessible captions." },
        { status: 422 }
      );
    }

    if (message.includes("Please provide a valid YouTube URL.")) {
      return NextResponse.json({ error: "Please provide a valid YouTube URL." }, { status: 400 });
    }

    console.error("POST /api/youtube-summary failed", error);
    return NextResponse.json({ error: "Failed to summarize this YouTube video." }, { status: 500 });
  }
}
