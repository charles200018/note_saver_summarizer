"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchTranscript, getVideoThumbnail, getVideoTitle } from "@/lib/youtube";
import { summarizeTranscript } from "@/lib/openrouter";
import { revalidatePath } from "next/cache";

export async function summarizeYouTubeVideo(videoUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch transcript
  const transcript = await fetchTranscript(videoUrl);
  if (!transcript) throw new Error("Could not fetch transcript for this video");

  // Summarize with AI
  const { tldr, keyPoints, detailedSummary } = await summarizeTranscript(transcript);

  const summary = `## TL;DR\n\n${tldr}\n\n## Detailed Summary\n\n${detailedSummary}`;

  // Save to database
  const { data, error } = await supabase
    .from("youtube_summaries")
    .insert({
      user_id: user.id,
      video_url: videoUrl,
      video_title: getVideoTitle(videoUrl),
      thumbnail_url: getVideoThumbnail(videoUrl),
      summary,
      key_points: keyPoints,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/youtube");
  return data;
}

export async function getSummaries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("youtube_summaries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getSummary(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
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
    .from("youtube_summaries")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/youtube");
}
