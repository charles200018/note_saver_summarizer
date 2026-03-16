"use server";

import { createClient } from "@/lib/supabase/server";
import { getVideoThumbnail, getVideoTitle } from "@/lib/youtube";
import { extractYouTubeVideoId, getTranscriptFromUrl } from "@/lib/youtubeTranscript";
import { summarizeTranscript } from "@/lib/groq";
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
    const response = await fetch("http://localhost:3000/api/youtube/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Failed to summarize video." };
    }

    const summaryData = await response.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Please sign in again and try once more." };
    }
    
    const { data, error } = await supabase
      .schema("app_notes")
      .from("youtube_summaries")
      .insert({
        user_id: user.id,
        video_url: videoUrl,
        video_title: summaryData.title,
        thumbnail_url: getVideoThumbnail(videoUrl),
        summary: summaryData.summary,
        key_points: summaryData.keyPoints,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: "Failed to save summary. Please try again." };
    }

    revalidatePath("/youtube");
    return {
      success: true,
      data: {
        id: data.id,
        tldr: summaryData.summary.split("## TLDR")[1]?.split("## Key Points")[0]?.trim() ?? "",
        keyPoints: summaryData.keyPoints,
        detailedSummary: summaryData.summary.split("## Detailed Summary")[1]?.trim() ?? "",
      },
    };
  } catch (error) {
    console.error("summarizeYouTubeVideo failed", error);
    const message = error instanceof Error ? error.message : "Unexpected error while summarizing video.";
    return { success: false, error: message };
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
