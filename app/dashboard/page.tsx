import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/layout/TopNav";
import { Sidebar } from "@/components/layout/Sidebar";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: notes }, { data: summaries }, { data: folders }] = await Promise.all([
    supabase
      .schema("app_notes")
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .schema("app_notes")
      .from("youtube_summaries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .schema("app_notes")
      .from("folders")
      .select("*, folder_items(count)")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const notesCount = notes?.length ?? 0;
  const summariesCount = summaries?.length ?? 0;
  const foldersCount = folders?.length ?? 0;

  return (
    <>
      <Sidebar />
      <div className="dashboard-shell lg:ml-64">
        <TopNav title="Dashboard" email={user.email} />
        <main className="p-4 sm:p-6 lg:p-8 space-y-10">
        <section className="aurora-panel rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[#c9a46c]">Workspace Overview</p>
              <h2 className="mt-3 font-[family-name:var(--font-serif)] text-3xl font-medium tracking-[0.06em] text-[#f5e6d3] sm:text-4xl">
                Your knowledge hub is active and ready
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#c8b6a0] sm:text-base">
                Keep collecting notes, extracting video insights, and organizing your content into high-signal collections.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="metric-tile min-w-[110px]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#b79363]">Collections</p>
                <p className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-semibold text-[#f5e6d3]">{foldersCount}</p>
                <p className="text-[11px] text-[#9e8768]">Recent loaded</p>
              </div>
              <div className="metric-tile min-w-[110px]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#b79363]">Notes</p>
                <p className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-semibold text-[#f5e6d3]">{notesCount}</p>
                <p className="text-[11px] text-[#9e8768]">Recently updated</p>
              </div>
              <div className="metric-tile min-w-[110px]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#b79363]">Summaries</p>
                <p className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-semibold text-[#f5e6d3]">{summariesCount}</p>
                <p className="text-[11px] text-[#9e8768]">Newest insights</p>
              </div>
            </div>
          </div>
        </section>

        {/* Your Collections */}
        <section className="section-panel rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-px rounded-full bg-gradient-to-b from-[#f1dab2] to-[#8d6a3d]" />
              <h2 className="font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.06em] text-[#f5e6d3]">Your Collections</h2>
            </div>
            <Link
              href="/folders"
              className="text-sm tracking-[0.12em] text-[#c9a46c] transition-colors hover:text-[#e7cfa1]"
            >
              View all →
            </Link>
          </div>
          {folders && folders.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {folders.map((folder) => {
                const itemCount = folder.folder_items?.[0]?.count ?? 0;
                return (
                  <Link
                    key={folder.id}
                    href={`/folders/${folder.id}`}
                    className="group luxury-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#c9a46c]/20 bg-[#1c120d]"
                        style={{ backgroundColor: folder.color + "15" }}
                      >
                        <svg
                          className="h-5 w-5"
                          style={{ color: folder.color }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-[family-name:var(--font-serif)] text-lg font-medium truncate tracking-[0.04em] text-[#f5e6d3]">
                          {folder.name}
                        </h3>
                        <p className="mt-1 text-xs text-[#b69b79]">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="luxury-card rounded-2xl py-16 text-center">
              <p className="text-sm tracking-wide text-[#b69b79]">No collections yet</p>
              <Link href="/folders" className="mt-3 inline-block text-sm tracking-[0.12em] text-[#c9a46c] hover:text-[#e7cfa1]">
                Create your first collection →
              </Link>
            </div>
          )}
        </section>

        {/* Recent Notes */}
        <section className="section-panel rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-px rounded-full bg-gradient-to-b from-[#f1dab2] to-[#8d6a3d]" />
              <h2 className="font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.06em] text-[#f5e6d3]">Recent Notes</h2>
            </div>
            <Link
              href="/notes"
              className="text-sm tracking-[0.12em] text-[#c9a46c] transition-colors hover:text-[#e7cfa1]"
            >
              View all →
            </Link>
          </div>
          {notes && notes.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="group luxury-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-[family-name:var(--font-serif)] text-xl font-medium truncate tracking-[0.04em] text-[#f5e6d3]">
                      {note.title || "Untitled"}
                    </h3>
                    {note.is_pinned && (
                      <svg className="w-4 h-4 text-[#c9a46c] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#c8b6a0]">
                    {note.content.replace(/[#*`>\-]/g, "").slice(0, 100)}
                  </p>
                  {note.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {note.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="rounded-full border border-[#c9a46c]/22 bg-[#20140e] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#e7cfa1]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="luxury-card rounded-2xl py-16 text-center">
              <p className="text-sm tracking-wide text-[#b69b79]">No notes yet</p>
              <Link href="/notes/new" className="mt-3 inline-block text-sm tracking-[0.12em] text-[#c9a46c] hover:text-[#e7cfa1]">
                Create your first note →
              </Link>
            </div>
          )}
        </section>

        {/* Recent Summaries */}
        <section className="section-panel rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-px rounded-full bg-gradient-to-b from-[#f1dab2] to-[#8d6a3d]" />
              <h2 className="font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.06em] text-[#f5e6d3]">Recent Summaries</h2>
            </div>
            <Link
              href="/youtube"
              className="text-sm tracking-[0.12em] text-[#c9a46c] transition-colors hover:text-[#e7cfa1]"
            >
              View all →
            </Link>
          </div>
          {summaries && summaries.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {summaries.map((s) => (
                <Link
                  key={s.id}
                  href={`/youtube/${s.id}`}
                  className="group luxury-card flex gap-5 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                >
                  {s.thumbnail_url && (
                    <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border border-[#3a2617]">
                      <Image src={s.thumbnail_url} alt={s.video_title} className="w-full h-full object-cover" fill sizes="144px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-[family-name:var(--font-serif)] text-xl font-medium truncate tracking-[0.04em] text-[#f5e6d3]">{s.video_title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#c8b6a0]">
                      {s.key_points?.[0] ?? ""}
                    </p>
                    <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[#b69b79]">
                      {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="luxury-card rounded-2xl py-16 text-center">
              <p className="text-sm tracking-wide text-[#b69b79]">No summaries yet</p>
              <Link href="/youtube" className="mt-3 inline-block text-sm tracking-[0.12em] text-[#c9a46c] hover:text-[#e7cfa1]">
                Summarize a video →
              </Link>
            </div>
          )}
        </section>
        </main>
      </div>
    </>
  );
}
