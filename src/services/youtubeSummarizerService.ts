import { summarizeTranscript } from "@/lib/groq";
import { extractVideoId as extractYouTubeVideoId, fetchCaptionTranscript, getVideoDuration, getVideoTitle } from "@/lib/youtube";

type Method = "captions";

type TranscriptResult = {
  transcript: string;
  methodUsed: Method;
  duration: number;
};

async function getTranscript(videoUrl: string): Promise<TranscriptResult> {
  const duration = await getVideoDuration(videoUrl);
  const { transcript } = await fetchCaptionTranscript(videoUrl);

  return { transcript, methodUsed: "captions" as const, duration };
}

export async function summarizeVideo(videoUrl: string) {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  try {
    const transcriptResult = await getTranscript(videoUrl);
    const { transcript, methodUsed, duration } = transcriptResult;

    const { tldr, keyPoints, detailedSummary } = await summarizeTranscript(transcript);
    const videoTitle = await getVideoTitle(videoUrl);

    console.log("summarization_completed", { videoId, methodUsed });

    return {
      success: true,
      videoTitle,
      detailedSummary,
      tldr,
      keyPoints,
      duration: new Date(duration * 1000).toISOString().substr(11, 8),
      methodUsed,
    };
  } catch (error) {
    console.error("summarization_error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during summarization.",
    };
  }
}
