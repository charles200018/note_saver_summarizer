import { getNote } from "@/actions/notes";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { TopNav } from "@/components/layout/TopNav";
import { NoteViewClient } from "./NoteViewClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function NoteDetailPage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  
  const { id } = await params;
  const { edit } = await searchParams;
  const note = await getNote(id);
  const isEditing = edit === "true";

  if (isEditing) {
    return (
      <div className="ml-64">
        <TopNav title="Edit Note" email={user.email} />
        <main className="p-8 max-w-3xl">
          <NoteEditor note={note} />
        </main>
      </div>
    );
  }

  return (
    <div className="ml-64">
      <TopNav title={note.title} email={user.email} />
      <main className="p-8 max-w-3xl">
        <NoteViewClient note={note} />
      </main>
    </div>
  );
}
