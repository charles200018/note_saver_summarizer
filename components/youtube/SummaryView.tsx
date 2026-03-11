"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { motion } from "framer-motion";
import { deleteSummary } from "@/actions/youtube";
import { useRouter } from "next/navigation";
import { AddToFolderModal, CreateFolderModal } from "@/components/folders";

interface SummaryViewProps {
  summary: {
    id: string;
    video_url: string;
    video_title: string;
    thumbnail_url: string;
    summary: string;
    key_points: string[];
    created_at: string;
  };
}

export function SummaryView({ summary }: SummaryViewProps) {
  const router = useRouter();
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this summary?")) return;
    await deleteSummary(summary.id);
    router.push("/youtube");
  };

  const handleCreateFolder = () => {
    setCreateFolderModalOpen(true);
  };

  const handleFolderCreated = () => {
    setFolderModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {summary.thumbnail_url && (
          <a
            href={summary.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative shrink-0 w-72 h-40 rounded-xl overflow-hidden bg-[#1a1a1f] group border border-[#2a2a2f]"
          >
            <Image
              src={summary.thumbnail_url}
              alt={summary.video_title}
              className="w-full h-full object-cover"
              fill
              sizes="288px"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/60 transition-colors">
              <div className="w-14 h-14 rounded-full bg-[var(--color-accent)/90] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#0a0a0f] ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </a>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-light text-[#e4e4e7] tracking-wide">{summary.video_title}</h2>
          <p className="mt-2 text-sm text-[#606060] font-light tracking-wider uppercase">
            {new Date(summary.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={summary.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[var(--color-accent)/10] px-4 py-2 text-xs font-light tracking-wide text-[var(--color-accent)] border border-[var(--color-accent)/30] hover:bg-[var(--color-accent)/20] transition-colors"
            >
              Watch Video
            </a>
            <button
              onClick={() => setFolderModalOpen(true)}
              className="rounded-xl bg-[#1a1a1f] px-4 py-2 text-xs font-light tracking-wide text-[#808080] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)/30] border border-[#2a2a2f] transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Add to Collection
            </button>
            <button
              onClick={handleDelete}
              className="rounded-xl bg-[#1a1a1f] px-4 py-2 text-xs font-light tracking-wide text-[#808080] hover:text-[#b4783c] border border-[#2a2a2f] hover:border-[#b4783c]/30 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {summary.key_points.length > 0 && (
        <div className="luxury-card p-6">
          <h3 className="font-light text-[#e4e4e7] mb-5 flex items-center gap-3 tracking-wide">
            <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
            Key Points
          </h3>
          <ul className="space-y-3">
            {summary.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#a0a0a0] font-light leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="luxury-card p-6">
        <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#e4e4e7] prose-headings:font-light prose-headings:tracking-wide prose-p:text-[#a0a0a0] prose-p:font-light prose-p:leading-relaxed prose-strong:text-[#e4e4e7] prose-strong:font-normal prose-li:text-[#a0a0a0]">
          <ReactMarkdown>{summary.summary}</ReactMarkdown>
        </div>
      </div>

      <AddToFolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        itemId={summary.id}
        itemType="youtube_summary"
        itemTitle={summary.video_title}
        onCreateFolder={handleCreateFolder}
      />

      <CreateFolderModal
        isOpen={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        onCreated={handleFolderCreated}
      />
    </motion.div>
  );
}
