"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createFolder } from "@/actions/folders";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const colorOptions = [
  "var(--color-accent)", // Violet
  "#b4783c", // Bronze
  "#8b7355", // Taupe
  "#6b5b4f", // Brown
  "#4a7c59", // Forest
  "#2f4858", // Slate
  "#5c4a72", // Plum
  "#7a5c61", // Mauve
  "#5a6c7a", // Steel
  "#6b705c", // Olive
];

export function CreateFolderModal({
  isOpen,
  onClose,
  onCreated,
}: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#8b5cf6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Collection name is required");
      return;
    }

    setLoading(true);
    setError("");

    const result = await createFolder(name.trim(), description.trim(), color);

    if (result.success) {
      setName("");
      setDescription("");
      setColor("var(--color-accent)");
      onCreated?.();
      onClose();
    } else {
      setError(result.error || "Failed to create collection");
    }

    setLoading(false);
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setColor("var(--color-accent)");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-xl bg-gradient-to-b from-[#1a1a1f] to-[#12121a] p-8 shadow-2xl border border-[#2a2a2f]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Violet accent line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)/50] to-transparent" />
            
            <h2 className="mb-6 text-xl font-light text-[#e4e4e7] tracking-wide">
              Create New Collection
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs text-[#808080] font-light tracking-widest uppercase">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Collection"
                  className="luxury-input w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-[#808080] font-light tracking-widest uppercase">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this collection for?"
                  rows={2}
                  className="luxury-input w-full resize-none"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs text-[#808080] font-light tracking-widest uppercase">
                  Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-9 w-9 rounded-full transition-all ${
                        color === c
                          ? "scale-110 ring-2 ring-[#e4e4e7] ring-offset-2 ring-offset-[#12121a]"
                          : "hover:scale-105 opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-[#b4783c] font-light">{error}</p>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-[#808080] hover:text-[#e4e4e7] transition-colors font-light tracking-wide"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="luxury-btn disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Collection"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
