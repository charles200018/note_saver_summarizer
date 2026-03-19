"use client";

import { useState } from "react";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <main
      className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#080604] text-[#f6e7cc]" : "bg-[#f7efe2] text-[#3a2a18]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(circle_at_20%_10%,rgba(245,201,120,0.18),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(194,140,56,0.14),transparent_35%),linear-gradient(to_bottom,#080604,#120b06_55%,#070503)]"
            : "bg-[radial-gradient(circle_at_20%_10%,rgba(197,139,49,0.18),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(158,109,30,0.15),transparent_35%),linear-gradient(to_bottom,#f9f2e6,#f1e4cf_55%,#ead8bb)]"
        }`}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center p-6">
        <div
          className={`w-full rounded-2xl border p-7 shadow-[0_0_70px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-10 ${
            isDark
              ? "border-[#c89d55]/35 bg-[#120a06]/70"
              : "border-[#c89d55]/45 bg-[#fff8ec]/80"
          }`}
        >
          <nav className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                isDark
                  ? "border-[#c89d55]/50 bg-[#1b1109]/70 text-[#fae9ca] hover:border-[#efc57d]"
                  : "border-[#b88735]/50 bg-[#fff2dc] text-[#4c3318] hover:border-[#8f6520]"
              }`}
              onClick={() => setShowAbout(false)}
            >
              Home
            </button>

            <button
              type="button"
              className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                isDark
                  ? "border-[#c89d55]/50 bg-[#1b1109]/70 text-[#fae9ca] hover:border-[#efc57d]"
                  : "border-[#b88735]/50 bg-[#fff2dc] text-[#4c3318] hover:border-[#8f6520]"
              }`}
              onClick={() => setShowAbout(true)}
            >
              About
            </button>

            <button
              type="button"
              className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                isDark
                  ? "border-[#c89d55]/50 bg-[#1b1109]/70 text-[#fae9ca] hover:border-[#efc57d]"
                  : "border-[#b88735]/50 bg-[#fff2dc] text-[#4c3318] hover:border-[#8f6520]"
              }`}
              onClick={() => setIsDark((prev) => !prev)}
            >
              {isDark ? "Bright" : "Dark"} Theme
            </button>
          </nav>

          <p
            className={`mb-3 text-center text-xs uppercase tracking-[0.28em] ${
              isDark ? "text-[#c89d55]" : "text-[#9c6b24]"
            }`}
          >
            Your AI Workspace
          </p>

          <h1 className="text-center text-4xl font-semibold tracking-tight sm:text-5xl">AI Personal OS</h1>

          {!showAbout ? (
            <>
              <p
                className={`mx-auto mt-3 max-w-xl text-center text-sm sm:text-base ${
                  isDark ? "text-[#e6cb9b]/90" : "text-[#654321]/90"
                }`}
              >
                Welcome! Choose a tool below to continue your work quickly.
              </p>

              <div className="mt-8 flex flex-col gap-4">
                <button
                  type="button"
                  className={`w-full rounded-lg border px-4 py-3 text-base font-medium transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                    isDark
                      ? "border-[#c89d55]/50 bg-[#1b1109]/70 text-[#fae9ca] hover:border-[#efc57d] hover:bg-[#23150b] hover:shadow-[0_0_22px_rgba(200,157,85,0.35)]"
                      : "border-[#b88735]/50 bg-[#fff2dc] text-[#4c3318] hover:border-[#8f6520] hover:bg-[#f9e8c9]"
                  }`}
                  onClick={() => {
                    window.location.href = "https://notesaversummarizerpro.vercel.app/";
                  }}
                >
                  Open Summarizer
                </button>

                <button
                  type="button"
                  className={`w-full rounded-lg border px-4 py-3 text-base font-medium transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                    isDark
                      ? "border-[#c89d55]/50 bg-[#1b1109]/70 text-[#fae9ca] hover:border-[#efc57d] hover:bg-[#23150b] hover:shadow-[0_0_22px_rgba(200,157,85,0.35)]"
                      : "border-[#b88735]/50 bg-[#fff2dc] text-[#4c3318] hover:border-[#8f6520] hover:bg-[#f9e8c9]"
                  }`}
                  onClick={() => {
                    window.location.href = "https://ai-job-search-opal.vercel.app/account";
                  }}
                >
                  AI Job Search
                </button>
              </div>
            </>
          ) : (
            <section
              className={`mx-auto mt-6 max-w-xl rounded-lg border p-5 text-left text-sm sm:text-base ${
                isDark
                  ? "border-[#c89d55]/30 bg-[#1a110a]/60 text-[#f1debb]"
                  : "border-[#b88735]/30 bg-[#fff3df] text-[#4f381b]"
              }`}
            >
              <h2 className="mb-2 text-xl font-semibold">About</h2>
              <p>
                AI Personal OS is a simple launch page that helps you quickly access your AI tools.
                Use the menu to switch between Home and About, and choose Bright or Dark theme based on your preference.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}


