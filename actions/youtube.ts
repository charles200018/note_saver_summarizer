"use server";

import { createClient } from "@/lib/supabase/server";
import { extractVideoId, fetchTranscript, getVideoThumbnail, getVideoTitle } from "@/lib/youtube";
import { summarizeTranscript } from "@/lib/groq";
import { revalidatePath } from "next/cache";

type SummarizeResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

export async function summarizeYouTubeVideo(videoUrl: string) {
  try {
    const normalizedUrl = videoUrl.trim();

    if (!normalizedUrl) {
      return { success: false, error: "Please paste a YouTube URL." } satisfies SummarizeResult;
    }

    if (normalizedUrl.length > 500 || !extractVideoId(normalizedUrl)) {
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

    const transcript = await fetchTranscript(normalizedUrl);
    if (!transcript) {
      return {
        success: false,
        error: "Could not fetch captions for this video. Make sure the video is public and has captions enabled.",
      } satisfies SummarizeResult;
    }

    const { tldr, keyPoints, detailedSummary } = await summarizeTranscript(transcript);
    const videoTitle = await getVideoTitle(normalizedUrl);

    const summary = [
      "## TLDR",
      "",
      tldr,
      "",
      "## Key Points",
      "",
      ...keyPoints.map((point) => `- ${point}`),
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
        video_title: videoTitle,
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
    return { success: true, data } satisfies SummarizeResult;
  } catch (error) {
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
