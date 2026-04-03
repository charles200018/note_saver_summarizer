"use client";

import { useState } from "react";
import { summarizeYouTubeVideo } from "@/actions/youtube";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

function isValidYouTubeUrl(input: string): boolean {
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return Boolean(url.pathname.split("/").filter(Boolean)[0]);
    }

    if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      return url.pathname === "/watch"
        ? Boolean(url.searchParams.get("v"))
        : url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/");
    }
  } catch {
    return false;
  }

  return false;
}

function extractYouTubeVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }

    if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        return id && id.length === 11 ? id : null;
      }

      if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/").filter(Boolean)[1];
        return id && id.length === 11 ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function YouTubeInput() {
  const [url, setUrl] = useState("");
  const [loadingStage, setLoadingStage] = useState<"idle" | "fetching" | "summarizing">("idle");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{
    tldr: string;
    keyPoints: string[];
    detailedSummary: string;
  } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    if (!isValidYouTubeUrl(trimmedUrl)) {
      setError("Please paste a valid YouTube video URL.");
      return;
    }

    setLoadingStage("fetching");
    setError("");
    setSummary(null);

    try {
      const videoId = extractYouTubeVideoId(trimmedUrl);
      if (!videoId) {
        setError("Please paste a valid YouTube video URL.");
        return;
      }

      const transcriptResponse = await fetch(`/api/transcript?videoId=${encodeURIComponent(videoId)}`);
      if (!transcriptResponse.ok) {
        const errorBody = (await transcriptResponse.json().catch(() => ({ error: "Failed to fetch transcript." }))) as {
          error?: string;
        };
        setError(errorBody.error || "Failed to fetch transcript.");
        return;
      }

      const transcriptBody = (await transcriptResponse.json()) as { transcript?: string; error?: string };
      const transcript = (transcriptBody.transcript || "").trim();
      if (!transcript) {
        setError(transcriptBody.error || "Failed to fetch transcript.");
        return;
      }

      setLoadingStage("summarizing");
      const result = await summarizeYouTubeVideo(trimmedUrl, transcript);
      if (result.success && result.data) {
        setSummary({
          tldr: result.data.tldr,
          keyPoints: result.data.keyPoints,
          detailedSummary: result.data.detailedSummary,
        });
        setUrl("");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize video");
    } finally {
      setLoadingStage("idle");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="luxury-card p-6"
    >
      <h3 className="text-sm font-light text-[var(--color-accent)] tracking-widest uppercase mb-4">
        Summarize a Video
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#606060]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube URL..."
            required
            className="luxury-input w-full pl-12 pr-4"
          />
        </div>
        <button
          type="submit"
          disabled={loadingStage !== "idle"}
          className="luxury-btn disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loadingStage !== "idle" ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {loadingStage === "fetching" ? "Fetching transcript..." : "Summarizing..."}
            </>
          ) : (
            "Summarize"
          )}
        </button>
      </form>
      {error && (
        <p className="mt-4 text-sm text-[#b4783c] bg-[#b4783c]/10 rounded-lg px-4 py-3 border border-[#b4783c]/20 font-light">
          {error}
        </p>
      )}

      {summary && (
        <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
          <div>
            <h4 className="text-xs tracking-wider uppercase text-[var(--color-muted)] mb-2">TLDR</h4>
            <p className="text-sm leading-relaxed text-[var(--color-foreground)]">{summary.tldr}</p>
          </div>

          <div>
            <h4 className="text-xs tracking-wider uppercase text-[var(--color-muted)] mb-2">Key Points</h4>
            <ul className="space-y-1 text-sm text-[var(--color-foreground)] list-disc pl-5">
              {summary.keyPoints.map((point, index) => (
                <li key={`${index}-${point.slice(0, 20)}`}>{point}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-wider uppercase text-[var(--color-muted)] mb-2">Detailed Summary</h4>
            <p className="text-sm leading-relaxed text-[var(--color-foreground)]">{summary.detailedSummary}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
