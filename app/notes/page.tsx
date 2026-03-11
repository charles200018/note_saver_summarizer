import { getNotes } from "@/actions/notes";
import { NoteList } from "@/components/notes/NoteList";
import { TopNav } from "@/components/layout/TopNav";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  
  const notes = await getNotes();

  const allTags = Array.from(
    new Set(notes.flatMap((n: { tags: string[] }) => n.tags))
  ).sort();

  return (
    <div className="ml-64">
      <TopNav title="Notes" email={user.email} />
      <main className="p-8">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-[#808080] font-light tracking-wide">{notes.length} notes</p>
          <Link
            href="/notes/new"
            className="luxury-btn flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            New Note
          </Link>
        </div>
        <NoteList notes={notes} allTags={allTags} />
      </main>
    </div>
  );
}
