import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08080c] via-[#0c0c12] to-[#08080c]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--color-accent)/8] via-transparent to-transparent" />
      
      <div className="relative mx-auto max-w-lg text-center space-y-10 px-4">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] via-[#14b8a6] to-[#0f766e] flex items-center justify-center shadow-xl shadow-[var(--color-accent)/30]">
            {/* Diamond Icon */}
            <svg className="w-10 h-10 text-[#08080c]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 9l10 13 10-13L12 2zm0 3.84L18.26 9 12 17.65 5.74 9 12 5.84z"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-4xl font-light text-[#e4e4e7] tracking-[0.3em]">
            AURELIUS
          </h1>
          <div className="mt-4 w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent" />
          <p className="mt-4 text-[#808080] text-base font-light tracking-wide">
            Premium Knowledge Curation
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <div className="premium-feature-card flex items-center gap-4 text-left p-5">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-[var(--color-accent)/10] flex items-center justify-center border border-[var(--color-accent)/20]">
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-light text-[#e4e4e7] text-sm tracking-wide">Refined Notes</h3>
              <p className="text-xs text-[#606060] mt-1 font-light">Create, curate, and organize with precision</p>
            </div>
          </div>

          <div className="premium-feature-card flex items-center gap-4 text-left p-5">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-[var(--color-accent)/10] flex items-center justify-center border border-[var(--color-accent)/20]">
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div>
              <h3 className="font-light text-[#e4e4e7] text-sm tracking-wide">AI Summaries</h3>
              <p className="text-xs text-[#606060] mt-1 font-light">Distill video insights in moments</p>
            </div>
          </div>

          <div className="premium-feature-card flex items-center gap-4 text-left p-5">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-[var(--color-accent)/10] flex items-center justify-center border border-[var(--color-accent)/20]">
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-light text-[#e4e4e7] text-sm tracking-wide flex items-center gap-2">
                Image to Text
                <span className="text-[9px] px-2 py-0.5 bg-[var(--color-accent)]/20 text-[#bfdbfe] rounded-full border border-[var(--color-accent)]/30">AI</span>
              </h3>
              <p className="text-xs text-[#606060] mt-1 font-light">Extract text from any image instantly</p>
            </div>
          </div>
        </div>

        <GoogleSignInButton />
        
        {/* Subtle footer text */}
        <p className="text-[10px] text-[#404040] font-light tracking-[0.3em] uppercase">
          Elevate Your Knowledge
        </p>
      </div>
    </div>
  );
}
