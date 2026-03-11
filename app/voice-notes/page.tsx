import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import VoiceNotesClient from "./VoiceNotesClient";

export default async function VoiceNotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-[#08080c]">
      <Sidebar />
      <main className="ml-64">
        <TopNav title="Voice Notes" email={user.email} />
        <VoiceNotesClient />
      </main>
    </div>
  );
}
