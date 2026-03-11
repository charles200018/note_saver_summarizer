import { getSummary } from "@/actions/youtube";
import { SummaryView } from "@/components/youtube/SummaryView";
import { TopNav } from "@/components/layout/TopNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SummaryDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  
  const { id } = await params;
  const summary = await getSummary(id);

  return (
    <div className="ml-64">
      <TopNav title="Summary" email={user.email} />
      <main className="p-8 max-w-4xl">
        <SummaryView summary={summary} />
      </main>
    </div>
  );
}
