"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getNotes(search?: string, tag?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("notes")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getNote(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createNote(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const tagsStr = formData.get("tags") as string;
  const tags = tagsStr
    ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title,
      content,
      tags,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  redirect(`/notes/${data.id}`);
}

export async function updateNote(id: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const tagsStr = formData.get("tags") as string;
  const tags = tagsStr
    ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const { error } = await supabase
    .from("notes")
    .update({ title, content, tags })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  redirect(`/notes/${id}`);
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  redirect("/notes");
}

export async function togglePinNote(id: string, isPinned: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .update({ is_pinned: !isPinned })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
}

export async function smartSearch(query: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get all notes for this user
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, content, tags, created_at")
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  if (!notes || notes.length === 0) return { results: [], answer: "No notes found." };

  // Create a summary of notes for the AI
  const notesSummary = notes.map((n, i) => 
    `[${i + 1}] Title: "${n.title}" | Tags: ${n.tags?.join(", ") || "none"} | Preview: ${n.content?.slice(0, 200)}...`
  ).join("\n\n");

  // Use Groq to find relevant notes and answer the query
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that searches through the user's notes to find relevant information. 
You will be given a list of notes and a search query. Find the most relevant notes and provide a helpful answer.
Always respond in valid JSON format with this structure:
{
  "relevantNoteIndices": [1, 2, 3],
  "answer": "A helpful summary answering the user's query based on their notes"
}
If no notes are relevant, return: { "relevantNoteIndices": [], "answer": "I couldn't find any notes matching your query." }`
          },
          {
            role: "user",
            content: `Search Query: "${query}"

User's Notes:
${notesSummary}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error("AI search failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    
    // Parse the AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback to simple text search
      const searchLower = query.toLowerCase();
      const matchedNotes = notes.filter(n => 
        n.title?.toLowerCase().includes(searchLower) || 
        n.content?.toLowerCase().includes(searchLower) ||
        n.tags?.some((t: string) => t.toLowerCase().includes(searchLower))
      );
      return { 
        results: matchedNotes, 
        answer: matchedNotes.length > 0 
          ? `Found ${matchedNotes.length} note(s) matching "${query}".`
          : `No notes found matching "${query}".`
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const relevantIndices: number[] = parsed.relevantNoteIndices || [];
    const relevantNotes = relevantIndices.map(i => notes[i - 1]).filter(Boolean);

    return {
      results: relevantNotes,
      answer: parsed.answer || "Search completed."
    };
  } catch {
    // Fallback to simple text search on error
    const searchLower = query.toLowerCase();
    const matchedNotes = notes.filter(n => 
      n.title?.toLowerCase().includes(searchLower) || 
      n.content?.toLowerCase().includes(searchLower) ||
      n.tags?.some((t: string) => t.toLowerCase().includes(searchLower))
    );
    return { 
      results: matchedNotes, 
      answer: matchedNotes.length > 0 
        ? `Found ${matchedNotes.length} note(s) matching "${query}".`
        : `No notes found matching "${query}".`
    };
  }
}
