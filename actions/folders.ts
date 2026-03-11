"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface FolderItem {
  id: string;
  folder_id: string;
  item_type: "note" | "youtube_summary";
  item_id: string;
  added_at: string;
}

// Get all folders for current user
export async function getFolders(): Promise<Folder[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: folders, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching folders:", error);
    return [];
  }

  // Get item counts for each folder
  const foldersWithCounts = await Promise.all(
    (folders || []).map(async (folder) => {
      const { count } = await supabase
        .from("folder_items")
        .select("*", { count: "exact", head: true })
        .eq("folder_id", folder.id);
      return { ...folder, item_count: count || 0 };
    })
  );

  return foldersWithCounts;
}

// Create a new folder
export async function createFolder(
  name: string,
  description: string = "",
  color: string = "#6366f1"
): Promise<{ success: boolean; folder?: Folder; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({
      user_id: user.id,
      name,
      description,
      color,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/folders");
  return { success: true, folder: data };
}

// Update a folder
export async function updateFolder(
  id: string,
  updates: { name?: string; description?: string; color?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("folders")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/folders");
  return { success: true };
}

// Delete a folder
export async function deleteFolder(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/folders");
  return { success: true };
}

// Add item to folder
export async function addItemToFolder(
  folderId: string,
  itemType: "note" | "youtube_summary",
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user owns the folder
  const { data: folder } = await supabase
    .from("folders")
    .select("id")
    .eq("id", folderId)
    .eq("user_id", user.id)
    .single();

  if (!folder) {
    return { success: false, error: "Folder not found" };
  }

  const { error } = await supabase.from("folder_items").insert({
    folder_id: folderId,
    item_type: itemType,
    item_id: itemId,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Item already in folder" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/folders");
  revalidatePath(`/folders/${folderId}`);
  return { success: true };
}

// Remove item from folder
export async function removeItemFromFolder(
  folderId: string,
  itemType: "note" | "youtube_summary",
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("folder_items")
    .delete()
    .eq("folder_id", folderId)
    .eq("item_type", itemType)
    .eq("item_id", itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/folders");
  revalidatePath(`/folders/${folderId}`);
  return { success: true };
}

// Get folder with its items
export async function getFolderWithItems(folderId: string): Promise<{
  folder: Folder | null;
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
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { folder: null, notes: [], summaries: [] };
  }

  // Get folder
  const { data: folder } = await supabase
    .from("folders")
    .select("*")
    .eq("id", folderId)
    .eq("user_id", user.id)
    .single();

  if (!folder) {
    return { folder: null, notes: [], summaries: [] };
  }

  // Get folder items
  const { data: items } = await supabase
    .from("folder_items")
    .select("*")
    .eq("folder_id", folderId);

  const noteIds = (items || [])
    .filter((i) => i.item_type === "note")
    .map((i) => i.item_id);
  const summaryIds = (items || [])
    .filter((i) => i.item_type === "youtube_summary")
    .map((i) => i.item_id);

  // Get notes
  let notes: Array<{
    id: string;
    title: string;
    content: string;
    created_at: string;
    tags: string[];
  }> = [];
  if (noteIds.length > 0) {
    const { data } = await supabase
      .from("notes")
      .select("id, title, content, created_at, tags")
      .in("id", noteIds);
    notes = data || [];
  }

  // Get summaries
  let summaries: Array<{
    id: string;
    video_url: string;
    video_title: string;
    thumbnail_url: string;
    summary: string;
    created_at: string;
  }> = [];
  if (summaryIds.length > 0) {
    const { data } = await supabase
      .from("youtube_summaries")
      .select("id, video_url, video_title, thumbnail_url, summary, created_at")
      .in("id", summaryIds);
    summaries = data || [];
  }

  return { folder, notes, summaries };
}

// Get folders that contain a specific item
export async function getFoldersContainingItem(
  itemType: "note" | "youtube_summary",
  itemId: string
): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("folder_items")
    .select("folder_id")
    .eq("item_type", itemType)
    .eq("item_id", itemId);

  return (data || []).map((item) => item.folder_id);
}
