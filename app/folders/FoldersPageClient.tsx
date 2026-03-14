"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { getFolders, deleteFolder, Folder } from "@/actions/folders";
import { FolderCard, CreateFolderModal } from "@/components/folders";
import { TopNav } from "@/components/layout/TopNav";

export default function FoldersPageClient({ email }: { email?: string }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadFolders = useCallback(async () => {
    const data = await getFolders();
    setFolders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getFolders();
      if (!cancelled) {
        setFolders(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this collection?")) {
      const result = await deleteFolder(id);
      if (result.success) {
        setFolders((prev) => prev.filter((f) => f.id !== id));
      }
    }
  };

  return (
    <div className="dashboard-shell lg:ml-64">
      <TopNav title="Collections" email={email} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="section-panel rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#c9a46c]">Curated Collections</p>
                <h2 className="mt-3 font-[family-name:var(--font-serif)] text-3xl font-medium tracking-[0.06em] text-[#f5e6d3] sm:text-4xl">
                  Organize your archive with a premium structure
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#c8b6a0]">
                  Group notes and summaries into elegant collections designed for fast retrieval and calm focus.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="luxury-btn flex items-center gap-2 self-start"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                New Collection
              </button>
            </div>
          </section>

          <section className="section-panel rounded-3xl p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-6 w-px rounded-full bg-gradient-to-b from-[#f1dab2] to-[#8d6a3d]" />
              <h3 className="font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.06em] text-[#f5e6d3]">Collection Index</h3>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="sr-only"
            >
              New Collection
            </button>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#c9a46c] border-t-transparent" />
          </div>
        ) : folders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="mb-6 rounded-full border border-[#3a2617] bg-gradient-to-b from-[#21150e] to-[#130c08] p-8">
              <svg
                className="h-12 w-12 text-[#c9a46c]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h2 className="mb-3 font-[family-name:var(--font-serif)] text-3xl font-medium tracking-[0.06em] text-[#f5e6d3]">
              No collections yet
            </h2>
            <p className="mb-8 max-w-md font-light leading-relaxed text-[#c8b6a0]">
              Create collections to organize your notes and YouTube summaries.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="luxury-btn"
            >
              Create Your First Collection
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder, idx) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <FolderCard folder={folder} onDelete={handleDelete} />
              </motion.div>
            ))}
          </div>
        )}
          </section>
        </div>
      </main>

      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadFolders}
      />
    </div>
  );
}
