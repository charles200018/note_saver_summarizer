"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { deleteNote, togglePinNote } from "@/actions/notes";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AddToFolderModal, CreateFolderModal } from "@/components/folders";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export function NoteViewClient({ note }: { note: Note }) {
  const router = useRouter();
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this note?")) return;
    await deleteNote(note.id);
  };

  const handleTogglePin = async () => {
    await togglePinNote(note.id, note.is_pinned);
    router.refresh();
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
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href={`/notes/${note.id}?edit=true`}
          className="luxury-btn"
        >
          Edit
        </Link>
        <button
          onClick={handleTogglePin}
          className="rounded-xl bg-[#1a1a1f] px-5 py-2.5 text-sm font-light tracking-wide text-[#808080] hover:text-[var(--color-accent)] border border-[#2a2a2f] hover:border-[var(--color-accent)/30] transition-colors"
        >
          {note.is_pinned ? "Unpin" : "Pin"}
        </button>
        <button
          onClick={() => setFolderModalOpen(true)}
          className="rounded-xl bg-[#1a1a1f] px-5 py-2.5 text-sm font-light tracking-wide text-[#808080] hover:text-[var(--color-accent)] border border-[#2a2a2f] hover:border-[var(--color-accent)/30] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Add to Collection
        </button>
        <button
          onClick={handleDelete}
          className="rounded-xl bg-[#1a1a1f] px-5 py-2.5 text-sm font-light tracking-wide text-[#808080] hover:text-[#b4783c] border border-[#2a2a2f] hover:border-[#b4783c]/30 transition-colors"
        >
          Delete
        </button>
      </div>

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--color-accent)/10] px-4 py-1.5 text-xs font-light tracking-wider text-[var(--color-accent)] border border-[var(--color-accent)/20] uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="luxury-card p-8">
        <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#e4e4e7] prose-headings:font-light prose-headings:tracking-wide prose-p:text-[#a0a0a0] prose-p:font-light prose-p:leading-relaxed prose-strong:text-[#e4e4e7] prose-strong:font-normal prose-code:text-[var(--color-accent)] prose-pre:bg-[#0a0a0f] prose-pre:border prose-pre:border-[#2a2a2f] prose-li:text-[#a0a0a0]">
          <ReactMarkdown>{note.content}</ReactMarkdown>
        </div>
      </div>

      <p className="text-xs text-[#505050] font-light tracking-wider uppercase">
        Updated {new Date(note.updated_at).toLocaleString()}
      </p>

      <AddToFolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        itemId={note.id}
        itemType="note"
        itemTitle={note.title}
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
