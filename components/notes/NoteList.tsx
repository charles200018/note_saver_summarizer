"use client";

import { useState } from "react";
import { NoteCard } from "./NoteCard";
import { AddToFolderModal, CreateFolderModal } from "../folders";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  updated_at: string;
}

export function NoteList({
  notes,
  allTags,
}: {
  notes: Note[];
  allTags: string[];
}) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; title: string } | null>(null);

  const handleAddToFolder = (noteId: string, noteTitle: string) => {
    setSelectedItem({ id: noteId, title: noteTitle });
    setFolderModalOpen(true);
  };

  const handleCreateFolder = () => {
    setCreateFolderModalOpen(true);
  };

  const handleFolderCreated = () => {
    // Re-open the folder modal after creating a folder
    if (selectedItem) {
      setFolderModalOpen(true);
    }
  };

  const filtered = notes.filter((note) => {
    const matchSearch =
      !search ||
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase());
    const matchTag =
      !selectedTag || note.tags.includes(selectedTag);
    return matchSearch && matchTag;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="luxury-input w-full pl-11 pr-4"
          />
        </div>

        {allTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="luxury-input px-4 cursor-pointer"
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="luxury-card py-20 text-center">
          <p className="text-[#606060] font-light tracking-wide">No notes found</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <NoteCard 
              key={note.id} 
              note={note} 
              onAddToFolder={handleAddToFolder}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <AddToFolderModal
          isOpen={folderModalOpen}
          onClose={() => {
            setFolderModalOpen(false);
            setSelectedItem(null);
          }}
          itemId={selectedItem.id}
          itemType="note"
          itemTitle={selectedItem.title}
          onCreateFolder={handleCreateFolder}
        />
      )}

      <CreateFolderModal
        isOpen={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        onCreated={handleFolderCreated}
      />
    </div>
  );
}
