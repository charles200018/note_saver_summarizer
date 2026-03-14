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
    <div className="dashboard-shell lg:ml-64">
      <TopNav title="Notes" email={user.email} />
      <main className="space-y-8 p-4 sm:p-6 lg:p-8">
        <section className="section-panel rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#c9a46c]">Library</p>
              <h2 className="mt-3 font-[family-name:var(--font-serif)] text-3xl font-medium tracking-[0.06em] text-[#f5e6d3] sm:text-4xl">
                Refined notes, organized with intent
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#c8b6a0]">{notes.length} notes in your private collection.</p>
            </div>
            <Link
              href="/notes/new"
              className="luxury-btn flex items-center gap-2 self-start"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              New Note
            </Link>
          </div>
        </section>

        <section className="section-panel rounded-3xl p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-6 w-px rounded-full bg-gradient-to-b from-[#f1dab2] to-[#8d6a3d]" />
            <h3 className="font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.06em] text-[#f5e6d3]">All Notes</h3>
          </div>
          <Link
            href="/notes/new"
            className="sr-only"
          >
            New Note
          </Link>
          <NoteList notes={notes} allTags={allTags} />
        </section>
      </main>
    </div>
  );
}
