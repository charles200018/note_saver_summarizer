import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0b10] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#1d1d28] bg-[#101018] p-8 shadow-xl">
        <h1 className="text-2xl font-light tracking-wide text-[#f3f3f5]">Sign in</h1>
        <p className="mt-2 text-sm text-[#9a9aa5]">
          Continue with Google to access your dashboard and private data.
        </p>
        <div className="mt-6">
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
}
