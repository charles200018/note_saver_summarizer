import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/layout/TopNav";
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

  return (
    <div className="lg:ml-64">
      <TopNav title="Dashboard" email={user.email} />
      <main className="p-4 sm:p-6 lg:p-8 space-y-10">
        {/* Your Collections */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#2563eb] to-[#1d4ed8]" />
              <h2 className="text-lg font-light tracking-wide text-[#e4e4e7]">Your Collections</h2>
            </div>
            <Link
              href="/folders"
              className="text-sm text-[#2563eb] hover:text-[#60a5fa] transition-colors tracking-wide"
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
                    className="group luxury-card rounded-2xl p-5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center border border-[#2563eb]/20"
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
                        <h3 className="font-medium text-[#e4e4e7] text-sm truncate tracking-wide">
                          {folder.name}
                        </h3>
                        <p className="text-xs text-[#6b6560] mt-1">
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
              <p className="text-[#6b6560] text-sm tracking-wide">No collections yet</p>
              <Link href="/folders" className="mt-3 inline-block text-sm text-[#2563eb] hover:text-[#60a5fa] tracking-wide">
                Create your first collection →
              </Link>
            </div>
          )}
        </section>

        {/* Recent Notes */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#2563eb] to-[#1d4ed8]" />
              <h2 className="text-lg font-light tracking-wide text-[#e4e4e7]">Recent Notes</h2>
            </div>
            <Link
              href="/notes"
              className="text-sm text-[#2563eb] hover:text-[#60a5fa] transition-colors tracking-wide"
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
                  className="group luxury-card rounded-2xl p-6 transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-[#e4e4e7] text-sm truncate tracking-wide">
                      {note.title || "Untitled"}
                    </h3>
                    {note.is_pinned && (
                      <svg className="w-4 h-4 text-[#2563eb] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-[#8a857d] line-clamp-2 leading-relaxed">
                    {note.content.replace(/[#*`>\-]/g, "").slice(0, 100)}
                  </p>
                  {note.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {note.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="rounded-full bg-[#2563eb]/10 px-3 py-1 text-[10px] font-medium text-[#2563eb] border border-[#2563eb]/20 tracking-wide uppercase">
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
              <p className="text-[#6b6560] text-sm tracking-wide">No notes yet</p>
              <Link href="/notes/new" className="mt-3 inline-block text-sm text-[#2563eb] hover:text-[#60a5fa] tracking-wide">
                Create your first note →
              </Link>
            </div>
          )}
        </section>

        {/* Recent Summaries */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#2563eb] to-[#1d4ed8]" />
              <h2 className="text-lg font-light tracking-wide text-[#e4e4e7]">Recent Summaries</h2>
            </div>
            <Link
              href="/youtube"
              className="text-sm text-[#2563eb] hover:text-[#60a5fa] transition-colors tracking-wide"
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
                  className="group luxury-card flex gap-5 rounded-2xl p-5 transition-all duration-300"
                >
                  {s.thumbnail_url && (
                    <div className="relative shrink-0 w-36 h-24 rounded-xl overflow-hidden border border-[#1e1e28]">
                      <Image src={s.thumbnail_url} alt={s.video_title} className="w-full h-full object-cover" fill sizes="144px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#e4e4e7] text-sm truncate tracking-wide">{s.video_title}</h3>
                    <p className="mt-2 text-xs text-[#8a857d] line-clamp-2 leading-relaxed">
                      {s.key_points?.[0] ?? ""}
                    </p>
                    <p className="mt-3 text-[10px] text-[#6b6560] uppercase tracking-wider">
                      {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="luxury-card rounded-2xl py-16 text-center">
              <p className="text-[#6b6560] text-sm tracking-wide">No summaries yet</p>
              <Link href="/youtube" className="mt-3 inline-block text-sm text-[#2563eb] hover:text-[#60a5fa] tracking-wide">
                Summarize a video →
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
