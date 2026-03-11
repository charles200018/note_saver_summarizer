"use client";

import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export function AuthButton({ email }: { email: string }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl bg-[#111118]/50 border border-[#1e1e28]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[#7c3aed] flex items-center justify-center text-[#0a0a0f] font-semibold text-xs">
          {email.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs text-[#a09a90] truncate flex-1">{email}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full rounded-lg bg-[#1e1e28] px-3 py-2 text-xs font-medium text-[#a09a90] hover:text-[#e4e4e7] hover:bg-[#2a2a38] transition-all duration-300 border border-[#2a2a38] hover:border-[var(--color-accent)/20] uppercase tracking-wider"
      >
        Sign Out
      </button>
    </div>
  );
}
