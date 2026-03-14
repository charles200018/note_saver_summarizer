"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface SummaryCardProps {
  summary: {
    id: string;
    video_url: string;
    video_title: string;
    thumbnail_url: string;
    key_points: string[];
    created_at: string;
  };
  onAddToFolder?: (summaryId: string, summaryTitle: string) => void;
}

export function SummaryCard({ summary, onAddToFolder }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <Link
        href={`/youtube/${summary.id}`}
        className="luxury-card flex gap-5 p-5"
      >
        <div className="relative h-26 w-44 shrink-0 overflow-hidden rounded-lg border border-[#3a2617] bg-[#140c08]">
          {summary.thumbnail_url && (
            <Image
              src={summary.thumbnail_url}
              alt={summary.video_title}
              className="w-full h-full object-cover"
              fill
              sizes="176px"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)/90]">
              <svg className="ml-0.5 h-5 w-5 text-[#140c08]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0 py-1">
          <h3 className="pr-8 font-[family-name:var(--font-serif)] text-xl font-medium tracking-[0.05em] text-[#f5e6d3] truncate">
            {summary.video_title}
          </h3>
          <div className="mt-3 space-y-1.5">
            {summary.key_points.slice(0, 2).map((point, i) => (
              <p key={i} className="line-clamp-1 text-sm font-light text-[#c8b6a0]">
                <span className="mr-2 text-[var(--color-accent)]">•</span>
                {point}
              </p>
            ))}
          </div>
          <p className="mt-3 text-xs font-light uppercase tracking-[0.16em] text-[#b69b79]">
            {new Date(summary.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </Link>
      {onAddToFolder && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToFolder(summary.id, summary.video_title);
          }}
          className="absolute top-5 right-5 rounded-lg bg-[#140c08]/90 p-2 text-[#8f7049] opacity-0 transition-colors group-hover:opacity-100 hover:text-[var(--color-accent)]"
          title="Add to collection"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}
