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
    <div className="rounded-2xl border border-[#3a2617] bg-[linear-gradient(180deg,#17100c_0%,#100907_100%)] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
      <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#e7cfa1] to-[#c9a46c] text-[#140c08] font-semibold text-xs">
          {email.charAt(0).toUpperCase()}
        </div>
        <span className="flex-1 truncate text-xs text-[#c8b6a0]">{email}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full rounded-xl border border-[#4a3220] bg-[#1a110d] px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#e7cfa1] transition-all duration-300 hover:border-[#c9a46c]/55 hover:bg-[#22150f] hover:text-[#f5e6d3]"
      >
        Sign Out
      </button>
      </div>
    </div>
  );
}
