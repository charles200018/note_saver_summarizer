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
        <div className="relative shrink-0 w-44 h-26 rounded-lg overflow-hidden bg-[#1a1a1f] border border-[#2a2a2f]">
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
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)/90] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#0a0a0f] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0 py-1">
          <h3 className="font-light text-[#e4e4e7] truncate text-base pr-8 tracking-wide">
            {summary.video_title}
          </h3>
          <div className="mt-3 space-y-1.5">
            {summary.key_points.slice(0, 2).map((point, i) => (
              <p key={i} className="text-xs text-[#808080] line-clamp-1 font-light">
                <span className="text-[var(--color-accent)] mr-2">•</span>
                {point}
              </p>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#505050] font-light tracking-wider uppercase">
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
          className="absolute top-5 right-5 rounded-lg p-2 text-[#505050] hover:text-[var(--color-accent)] transition-colors opacity-0 group-hover:opacity-100 bg-[#0a0a0f]/80"
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
