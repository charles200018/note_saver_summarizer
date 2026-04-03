import { summarizeTranscript } from "@/lib/groq";
import { extractVideoId as extractYouTubeVideoId, fetchCaptionTranscript, getVideoDuration, getVideoTitle } from "@/lib/youtube";

const transcriptCache = new Map<string, TranscriptResult>();
const summarizationRequests = new Set<string>();

type Method = "captions";

type TranscriptResult = {
  transcript: string;
  methodUsed: Method;
  duration: number;
};

async function getTranscript(videoId: string, videoUrl: string): Promise<TranscriptResult> {
  if (transcriptCache.has(videoId)) {
    return transcriptCache.get(videoId)!;
  }

  const duration = await getVideoDuration(videoId);
  const { transcript } = await fetchCaptionTranscript(videoUrl);

  const result = { transcript, methodUsed: "captions" as const, duration };
  transcriptCache.set(videoId, result);
  return result;
}

export async function summarizeVideo(videoUrl: string) {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  if (summarizationRequests.has(videoId)) {
    console.log("duplicate_processing_request_prevented", { videoId });
    throw new Error("Duplicate summarization request for this video.");
  }
  summarizationRequests.add(videoId);

  try {
    const transcriptResult = await getTranscript(videoId, videoUrl);
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
  } finally {
    summarizationRequests.delete(videoId);
  }
}
