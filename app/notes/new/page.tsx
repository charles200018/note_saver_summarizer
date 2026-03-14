import { NoteEditor } from "@/components/notes/NoteEditor";
import { TopNav } from "@/components/layout/TopNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewNotePage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const params = await searchParams;
  const initialTitle = typeof params.title === "string" ? params.title : undefined;
  const initialContent = typeof params.content === "string" ? params.content : undefined;

  return (
    <div className="lg:ml-64">
      <TopNav title="New Note" email={user.email} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-3xl">
        <NoteEditor initialTitle={initialTitle} initialContent={initialContent} />
      </main>
    </div>
  );
}
