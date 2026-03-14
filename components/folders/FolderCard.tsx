"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Folder } from "@/actions/folders";

interface FolderCardProps {
  folder: Folder;
  onDelete?: (id: string) => void;
}

export function FolderCard({ folder, onDelete }: FolderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <Link href={`/folders/${folder.id}`}>
        <div className="luxury-card p-6">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)/45] to-transparent" />
          
          <div className="flex items-start gap-5">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#3a2617] bg-[#1a110d]"
              style={{ backgroundColor: folder.color + "15" }}
            >
              <svg
                className="h-6 w-6"
                style={{ color: folder.color }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.05em] text-[#f5e6d3] truncate">
                {folder.name}
              </h3>
              {folder.description && (
                <p className="mt-3 line-clamp-2 text-sm font-light leading-relaxed text-[#c8b6a0]">
                  {folder.description}
                </p>
              )}
              <p className="mt-3 text-xs font-light uppercase tracking-[0.16em] text-[#b69b79]">
                {folder.item_count || 0} item{folder.item_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </Link>
      
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(folder.id);
          }}
          className="absolute top-4 right-4 rounded-lg bg-[#140c08]/90 p-2 text-[#8f7049] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#2a1a12] hover:text-[#e7cfa1]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}
