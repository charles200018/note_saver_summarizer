"use server";

import { createClient } from "@/lib/supabase/server";
import { extractVideoId as extractYouTubeVideoId, getVideoThumbnail } from "@/lib/youtube";
import { summarizeVideo } from "@/src/services/youtubeSummarizerService";
import { revalidatePath } from "next/cache";

type SummarizeResult =
  | {
      success: true;
      data: {
        id: string;
        tldr: string;
        keyPoints: string[];
        detailedSummary: string;
      };
    }
  | { success: false; error: string };

export async function summarizeYouTubeVideo(videoUrl: string) {
  try {
    const normalizedUrl = videoUrl.trim();

    if (!normalizedUrl) {
      return { success: false, error: "Please paste a YouTube URL." } satisfies SummarizeResult;
    }

    if (normalizedUrl.length > 500 || !extractYouTubeVideoId(normalizedUrl)) {
      return { success: false, error: "Please enter a valid YouTube video URL." } satisfies SummarizeResult;
    }

    if (!process.env.GROQ_API_KEY) {
      return {
        success: false,
        error: "AI is not configured yet. Please add GROQ_API_KEY in Vercel environment variables.",
      } satisfies SummarizeResult;
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Please sign in again and try once more." } satisfies SummarizeResult;
    }

    // Basic per-user rate limit: max 5 summaries per rolling 10 minutes.
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count, error: rateLimitError } = await supabase
      .schema("app_notes")
      .from("youtube_summaries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", tenMinutesAgo);

    if (rateLimitError) {
      return { success: false, error: "Unable to validate usage limits right now. Please retry." } satisfies SummarizeResult;
    }
    if ((count ?? 0) >= 5) {
      return { success: false, error: "Rate limit exceeded. Please wait a few minutes and try again." } satisfies SummarizeResult;
    }

    const result = await summarizeVideo(normalizedUrl);
    
    // Explicitly check for error property in result
    if (!result || (typeof result === 'object' && 'success' in result && result.success === false)) {
      const errorMsg = (result as any)?.error || "Could not fetch captions for this video. Make sure the video is public and has captions enabled.";
      return {
        success: false,
        error: errorMsg,
      } satisfies SummarizeResult;
    }

    const { tldr, keyPoints, detailedSummary, videoTitle } = result as any;

    const summary = [
      "## TLDR",
      "",
      tldr,
      "",
      "## Key Points",
      "",
      ...keyPoints.map((point: string) => `- ${point}`),
      "",
      "## Detailed Summary",
      "",
      detailedSummary,
    ].join("\n");

    const { data, error } = await supabase
      .schema("app_notes")
      .from("youtube_summaries")
      .insert({
        user_id: user.id,
        video_url: normalizedUrl,
        video_title: videoTitle || "YouTube Video",
        thumbnail_url: getVideoThumbnail(normalizedUrl),
        summary,
        key_points: keyPoints,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: "Failed to save summary. Please try again." } satisfies SummarizeResult;
    }

    revalidatePath("/youtube");
    return {
      success: true,
      data: {
        id: data.id,
        tldr,
        keyPoints,
        detailedSummary,
      },
    } satisfies SummarizeResult;
  } catch (error) {
    console.error("summarizeYouTubeVideo failed", error);
    const message = error instanceof Error ? error.message : "Unexpected error while summarizing video.";
    return { success: false, error: message } satisfies SummarizeResult;
  }
}

export async function getSummaries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("app_notes")
    .from("youtube_summaries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getSummary(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("app_notes")
    .from("youtube_summaries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSummary(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("app_notes")
    .from("youtube_summaries")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/youtube");
}
