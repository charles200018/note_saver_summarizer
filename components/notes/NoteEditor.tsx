"use client";

import { useState } from "react";
import { createNote, updateNote } from "@/actions/notes";
import { motion } from "framer-motion";

interface NoteEditorProps {
  note?: {
    id: string;
    title: string;
    content: string;
    tags: string[];
  };
  initialTitle?: string;
  initialContent?: string;
}

export function NoteEditor({ note, initialTitle, initialContent }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? initialTitle ?? "");
  const [content, setContent] = useState(note?.content ?? initialContent ?? "");
  const [tags, setTags] = useState(note?.tags?.join(", ") ?? "");

  const action = note
    ? updateNote.bind(null, note.id)
    : createNote;

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      action={action}
      className="space-y-6"
    >
      <div>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          required
          className="w-full rounded-xl border border-[#2a2a2f] bg-[#12121a] px-5 py-4 text-xl font-light text-[#e4e4e7] placeholder-[#505050] outline-none focus:border-[var(--color-accent)/50] transition-colors tracking-wide"
        />
      </div>

      <div>
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note in Markdown..."
          rows={18}
          className="w-full rounded-xl border border-[#2a2a2f] bg-[#12121a] px-5 py-4 text-sm text-[#c0c0c0] placeholder-[#505050] outline-none focus:border-[var(--color-accent)/50] transition-colors font-mono resize-y leading-relaxed"
        />
      </div>

      <div>
        <input
          name="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated): react, nextjs, tutorial"
          className="w-full rounded-xl border border-[#2a2a2f] bg-[#12121a] px-5 py-3.5 text-sm text-[#c0c0c0] placeholder-[#505050] outline-none focus:border-[var(--color-accent)/50] transition-colors"
        />
      </div>

      <button
        type="submit"
        className="luxury-btn"
      >
        {note ? "Update Note" : "Create Note"}
      </button>
    </motion.form>
  );
}
