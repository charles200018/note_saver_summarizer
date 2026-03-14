"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { togglePinNote } from "@/actions/notes";

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    is_pinned: boolean;
    updated_at: string;
  };
  onAddToFolder?: (noteId: string, noteTitle: string) => void;
}

export function NoteCard({ note, onAddToFolder }: NoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="luxury-card group relative p-6"
    >
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)/45] to-transparent" />
      
      <div className="flex items-start justify-between gap-3">
        <Link href={`/notes/${note.id}`} className="flex-1 min-w-0">
          <h3 className="font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.05em] text-[#f5e6d3] truncate">
            {note.title || "Untitled"}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#c8b6a0]">
            {note.content.replace(/[#*`>\-]/g, "").slice(0, 150)}
          </p>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          {onAddToFolder && (
            <button
              onClick={() => onAddToFolder(note.id, note.title || "Untitled")}
              className="rounded-lg p-2 text-[#8f7049] transition-colors opacity-0 group-hover:opacity-100 hover:text-[var(--color-accent)]"
              title="Add to collection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </button>
          )}
          <button
            onClick={async () => {
              await togglePinNote(note.id, note.is_pinned);
            }}
            className="rounded-lg p-2 text-[#8f7049] transition-colors hover:text-[var(--color-accent)]"
          >
            <svg
              className="w-4 h-4"
              fill={note.is_pinned ? "var(--color-accent)" : "none"}
              stroke={note.is_pinned ? "var(--color-accent)" : "currentColor"}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        </div>
      </div>

      {note.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--color-accent)/24] bg-[#20140e] px-3 py-1 text-xs font-light uppercase tracking-[0.16em] text-[var(--color-accent-light)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs font-light uppercase tracking-[0.16em] text-[#b69b79]">
        {new Date(note.updated_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </motion.div>
  );
}
