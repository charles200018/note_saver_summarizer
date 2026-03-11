"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { getFolderWithItems, removeItemFromFolder, deleteFolder } from "@/actions/folders";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";

interface FolderDetailClientProps {
  id: string;
  email?: string;
}

export default function FolderDetailClient({ id, email }: FolderDetailClientProps) {
  const router = useRouter();
  const [data, setData] = useState<{
    folder: {
      id: string;
      name: string;
      description: string;
      color: string;
    } | null;
    notes: Array<{
      id: string;
      title: string;
      content: string;
      created_at: string;
      tags: string[];
    }>;
    summaries: Array<{
      id: string;
      video_url: string;
      video_title: string;
      thumbnail_url: string;
      summary: string;
      created_at: string;
    }>;
  }>({ folder: null, notes: [], summaries: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getFolderWithItems(id);
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleRemoveNote = async (noteId: string) => {
    if (confirm("Remove this note from the collection?")) {
      await removeItemFromFolder(id, "note", noteId);
      setData((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => n.id !== noteId),
      }));
    }
  };

  const handleRemoveSummary = async (summaryId: string) => {
    if (confirm("Remove this summary from the collection?")) {
      await removeItemFromFolder(id, "youtube_summary", summaryId);
      setData((prev) => ({
        ...prev,
        summaries: prev.summaries.filter((s) => s.id !== summaryId),
      }));
    }
  };

  const handleDeleteFolder = async () => {
    if (confirm("Are you sure you want to delete this collection? Items inside won't be deleted.")) {
      const result = await deleteFolder(id);
      if (result.success) {
        router.push("/folders");
      }
    }
  };

  if (loading) {
    return (
      <div className="ml-64 flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (!data.folder) {
    return (
      <div className="ml-64 flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-light text-[#e4e4e7] mb-4 tracking-wide">Collection not found</h1>
        <Link href="/folders" className="text-[var(--color-accent)] hover:text-[#e4e4e7] font-light tracking-wide">
          Back to Collections
        </Link>
      </div>
    );
  }

  const totalItems = data.notes.length + data.summaries.length;

  return (
    <div className="ml-64">
      <TopNav title={data.folder.name} email={email} />
      <main className="p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-10">
            <Link
              href="/folders"
              className="inline-flex items-center gap-2 text-[#808080] hover:text-[var(--color-accent)] mb-6 font-light tracking-wide transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Collections
            </Link>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div
                  className="h-16 w-16 rounded-xl flex items-center justify-center border border-[#2a2a2f]"
                  style={{ backgroundColor: data.folder.color + "15" }}
                >
                  <svg
                    className="h-8 w-8"
                    style={{ color: data.folder.color }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                </div>
                <div>
                  {data.folder.description && (
                    <p className="text-[#808080] font-light leading-relaxed">{data.folder.description}</p>
                  )}
                  <p className="text-sm text-[#505050] mt-2 font-light tracking-wider uppercase">
                    {totalItems} item{totalItems !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDeleteFolder}
                className="p-3 rounded-xl text-[#505050] hover:text-[#b4783c] hover:bg-[#b4783c]/10 border border-transparent hover:border-[#b4783c]/20 transition-all"
                title="Delete collection"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

        {/* Empty state */}
        {totalItems === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="mb-6 inline-flex rounded-full bg-gradient-to-b from-[#1a1a1f] to-[#12121a] p-8 border border-[#2a2a2f]">
              <svg
                className="h-12 w-12 text-[var(--color-accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-light text-[#e4e4e7] mb-3 tracking-wide">
              This collection is empty
            </h2>
            <p className="text-[#808080] max-w-md mx-auto font-light leading-relaxed">
              Add notes or YouTube summaries to this collection from their respective pages.
            </p>
          </motion.div>
        )}

        {/* Notes Section */}
        {data.notes.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <svg className="h-5 w-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-lg font-light text-[#e4e4e7] tracking-wide">
                Notes
              </h2>
              <span className="text-sm text-[#606060] font-light">{data.notes.length}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-[var(--color-accent)/30] to-transparent" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.notes.map((note, idx) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group luxury-card relative p-6"
                >
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)/30] to-transparent" />
                  <Link href={`/notes/${note.id}`}>
                    <h3 className="font-light text-[#e4e4e7] mb-3 line-clamp-1 tracking-wide">
                      {note.title}
                    </h3>
                    <p className="text-sm text-[#808080] line-clamp-3 font-light leading-relaxed">
                      {note.content.replace(/[#*`]/g, "")}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[var(--color-accent)/10] px-3 py-1 text-xs text-[var(--color-accent)] font-light tracking-wide uppercase"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={() => handleRemoveNote(note.id)}
                    className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-[#0a0a0f]/80 hover:bg-[#b4783c]/10 text-[#505050] hover:text-[#b4783c]"
                    title="Remove from collection"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* YouTube Summaries Section */}
        {data.summaries.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <svg className="h-5 w-5 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <h2 className="text-lg font-light text-[#e4e4e7] tracking-wide">
                YouTube Summaries
              </h2>
              <span className="text-sm text-[#606060] font-light">{data.summaries.length}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-[var(--color-accent)/30] to-transparent" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.summaries.map((summary, idx) => (
                <motion.div
                  key={summary.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group luxury-card relative overflow-hidden"
                >
                  <Link href={`/youtube/${summary.id}`}>
                    <div className="relative aspect-video border-b border-[#2a2a2f]">
                      <Image
                        src={summary.thumbnail_url || "/placeholder-video.png"}
                        alt={summary.video_title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-[var(--color-accent)/90] flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#0a0a0f] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-light text-[#e4e4e7] mb-2 line-clamp-2 tracking-wide">
                        {summary.video_title || "YouTube Video"}
                      </h3>
                      <p className="text-sm text-[#808080] line-clamp-2 font-light leading-relaxed">
                        {summary.summary}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveSummary(summary.id)}
                    className="absolute top-3 right-3 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-[#b4783c]/20 text-white hover:text-[#b4783c]"
                    title="Remove from collection"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}
        </div>
      </main>
    </div>
  );
}
