import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FolderDetailClient from "./FolderDetailClient";

interface FolderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FolderDetailPage({ params }: FolderDetailPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  
  const { id } = await params;
  
  return <FolderDetailClient id={id} email={user.email} />;
}
