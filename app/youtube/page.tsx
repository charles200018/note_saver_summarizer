import { getSummaries } from "@/actions/youtube";
import { YouTubeInput } from "@/components/youtube/YouTubeInput";
import { SummaryList } from "@/components/youtube/SummaryList";
import { TopNav } from "@/components/layout/TopNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function YouTubePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  
  const summaries = await getSummaries();

  return (
    <div className="dashboard-shell lg:ml-64">
      <TopNav title="YouTube Summarizer" email={user.email} />
      <main className="max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
        <section className="section-panel rounded-3xl p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[#c9a46c]">Reserve Extraction</p>
          <h2 className="mt-3 font-[family-name:var(--font-serif)] text-3xl font-medium tracking-[0.06em] text-[#f5e6d3] sm:text-4xl">
            Distill long-form video into elegant insight
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c8b6a0]">
            Summarize captioned YouTube videos into a concise executive format with warm, readable presentation.
          </p>
          <div className="mt-8">
            <YouTubeInput />
          </div>
        </section>

        <section className="section-panel rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.06em] text-[#f5e6d3]">
              History
            </h2>
            <span className="text-sm font-light text-[#b69b79] tracking-wider">
              {summaries.length} summaries
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-[#c9a46c]/35 to-transparent" />
          </div>
          <SummaryList summaries={summaries} />
        </section>
      </main>
    </div>
  );
}
