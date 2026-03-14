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

export function YouTubeInput() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    if (!isValidYouTubeUrl(trimmedUrl)) {
      setError("Please paste a valid YouTube video URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await summarizeYouTubeVideo(trimmedUrl);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setUrl("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize video");
    } finally {
      setLoading(false);
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
          disabled={loading}
          className="luxury-btn disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Summarizing...
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
    </motion.div>
  );
}
