// app/api/youtube/summarize/route.ts

import { NextResponse } from "next/server";
import { summarizeVideo } from "@/src/services/youtubeSummarizerService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoUrl } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
    }

    const summary = await summarizeVideo(videoUrl);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("summarize error", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
