import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { fetchCaptionTranscript } from "@/lib/youtube";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const videoId = (url.searchParams.get("videoId") || "").trim();

    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId query parameter." }, { status: 500 });
    }

    const incomingHeaders = await headers();
    const cookie = incomingHeaders.get("cookie") || request.headers.get("cookie") || "";
    const userAgent = incomingHeaders.get("user-agent") || request.headers.get("user-agent") || "";

    const forwardHeaders: Record<string, string> = {};
    if (cookie) forwardHeaders.cookie = cookie;
    if (userAgent) forwardHeaders["user-agent"] = userAgent;

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const { transcript } = await fetchCaptionTranscript(videoUrl, forwardHeaders);

    return NextResponse.json({ transcript }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch transcript.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}