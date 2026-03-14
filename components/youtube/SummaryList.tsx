"use client";

import { useState } from "react";
import { SummaryCard } from "./SummaryCard";
import { AddToFolderModal, CreateFolderModal } from "../folders";

interface Summary {
  id: string;
  video_url: string;
  video_title: string;
  thumbnail_url: string;
  key_points: string[];
  created_at: string;
}

export function SummaryList({ summaries }: { summaries: Summary[] }) {
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; title: string } | null>(null);

  const handleAddToFolder = (summaryId: string, summaryTitle: string) => {
    setSelectedItem({ id: summaryId, title: summaryTitle });
    setFolderModalOpen(true);
  };

  const handleCreateFolder = () => {
    setCreateFolderModalOpen(true);
  };

  const handleFolderCreated = () => {
    if (selectedItem) {
      setFolderModalOpen(true);
    }
  };

  return (
    <>
      {summaries.length > 0 ? (
        <div className="space-y-4">
          {summaries.map((s) => (
            <SummaryCard 
              key={s.id} 
              summary={s} 
              onAddToFolder={handleAddToFolder}
            />
          ))}
        </div>
      ) : (
        <div className="luxury-card py-20 text-center">
          <p className="text-sm font-light tracking-wide text-[#b69b79]">
            No summaries yet. Paste a YouTube URL above to get started.
          </p>
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
          itemType="youtube_summary"
          itemTitle={selectedItem.title}
          onCreateFolder={handleCreateFolder}
        />
      )}

      <CreateFolderModal
        isOpen={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        onCreated={handleFolderCreated}
      />
    </>
  );
}
