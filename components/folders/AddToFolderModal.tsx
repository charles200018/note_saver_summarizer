"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getFolders,
  addItemToFolder,
  removeItemFromFolder,
  getFoldersContainingItem,
  Folder,
} from "@/actions/folders";

interface AddToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: "note" | "youtube_summary";
  itemId: string;
  itemTitle: string;
  onCreateFolder?: () => void;
}

export function AddToFolderModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemTitle,
  onCreateFolder,
}: AddToFolderModalProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(
    new Set()
  );
  const [originalFolderIds, setOriginalFolderIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [foldersData, containingFolders] = await Promise.all([
      getFolders(),
      getFoldersContainingItem(itemType, itemId),
    ]);

    setFolders(foldersData);
    const initialSet = new Set(containingFolders);
    setSelectedFolderIds(initialSet);
    setOriginalFolderIds(new Set(containingFolders));
    setLoading(false);
  }, [itemType, itemId]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const toggleFolder = (folderId: string) => {
    setSelectedFolderIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      // Find folders to add to and remove from
      const toAdd = [...selectedFolderIds].filter(
        (id) => !originalFolderIds.has(id)
      );
      const toRemove = [...originalFolderIds].filter(
        (id) => !selectedFolderIds.has(id)
      );

      // Add to new folders
      for (const folderId of toAdd) {
        const result = await addItemToFolder(folderId, itemType, itemId);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      // Remove from unselected folders
      for (const folderId of toRemove) {
        const result = await removeItemFromFolder(folderId, itemType, itemId);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update folders");
    }

    setSaving(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-xl bg-gradient-to-b from-[#1a1a1f] to-[#12121a] p-8 shadow-2xl border border-[#2a2a2f] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Violet accent line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)/50] to-transparent" />
            
            <h2 className="mb-2 text-xl font-light text-[#e4e4e7] tracking-wide">
              Add to Collection
            </h2>
            <p className="mb-6 text-sm text-[#808080] truncate font-light">
              {itemTitle}
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
              </div>
            ) : folders.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[#808080] mb-5 font-light">No collections yet</p>
                <button
                  onClick={() => {
                    onClose();
                    onCreateFolder?.();
                  }}
                  className="luxury-btn"
                >
                  Create Your First Collection
                </button>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto space-y-2 mb-5 pr-2">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => toggleFolder(folder.id)}
                      className={`w-full flex items-center gap-4 rounded-xl p-4 transition-all ${
                        selectedFolderIds.has(folder.id)
                          ? "bg-[var(--color-accent)/10] border border-[var(--color-accent)/40]"
                          : "bg-[#1a1a1f] border border-[#2a2a2f] hover:border-[#3a3a3f]"
                      }`}
                    >
                      <div
                        className="h-5 w-5 rounded-md"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span className="flex-1 text-left text-[#e4e4e7] font-light tracking-wide">
                        {folder.name}
                      </span>
                      {selectedFolderIds.has(folder.id) && (
                        <svg
                          className="h-5 w-5 text-[var(--color-accent)]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onCreateFolder?.();
                  }}
                  className="w-full text-center text-sm text-[var(--color-accent)] hover:text-[#e4e4e7] mb-5 font-light tracking-wide"
                >
                  + Create New Collection
                </button>
              </>
            )}

            {error && <p className="text-sm text-[#b4783c] mb-5 font-light">{error}</p>}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-[#808080] hover:text-[#e4e4e7] transition-colors font-light tracking-wide"
              >
                Cancel
              </button>
              {folders.length > 0 && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="luxury-btn disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
