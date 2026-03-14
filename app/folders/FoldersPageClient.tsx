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
    <div className="lg:ml-64">
      <TopNav title="Collections" email={email} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <p className="text-[#808080] font-light tracking-wide">
              Organize your notes and YouTube summaries into collections
            </p>
            <button
            onClick={() => setShowCreateModal(true)}
            className="luxury-btn flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            New Collection
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
          </div>
        ) : folders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="mb-6 rounded-full bg-gradient-to-b from-[#1a1a1f] to-[#12121a] p-8 border border-[#2a2a2f]">
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-light text-[#e4e4e7] mb-3 tracking-wide">
              No collections yet
            </h2>
            <p className="text-[#808080] mb-8 max-w-md font-light leading-relaxed">
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
