import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FoldersPageClient from "./FoldersPageClient";

export default async function FoldersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  
  return <FoldersPageClient email={user.email} />;
}
