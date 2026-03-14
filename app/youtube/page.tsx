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
    <div className="lg:ml-64">
      <TopNav title="YouTube Summarizer" email={user.email} />
      <main className="p-4 sm:p-6 lg:p-8 space-y-10 max-w-4xl">
        <YouTubeInput />

        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-lg font-light text-[#e4e4e7] tracking-wide">
              History
            </h2>
            <span className="text-sm font-light text-[#606060] tracking-wider">
              {summaries.length} summaries
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-[#2563eb]/30 to-transparent" />
          </div>
          <SummaryList summaries={summaries} />
        </section>
      </main>
    </div>
  );
}
