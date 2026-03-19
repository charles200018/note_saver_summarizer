import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import SmartSearchClient from "./SmartSearchClient";

export default async function SmartSearchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-[#08080c]">
      <Sidebar />
      <main className="lg:ml-64">
        <TopNav title="Smart Search" email={user.email} />
        <SmartSearchClient />
      </main>
    </div>
  );
}
