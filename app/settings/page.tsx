import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import AppearanceClient from "@/components/settings/AppearanceClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="dashboard-shell min-h-screen lg:ml-64">
      <main>
        <TopNav title="Settings" email={user.email} />
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Page Header */}
          <section className="section-panel mb-8 rounded-3xl p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-[#c9a46c]">Preferences</p>
            <h2 className="mt-3 font-[family-name:var(--font-serif)] text-3xl font-medium tracking-[0.06em] text-[#f5e6d3] sm:text-4xl">Account Settings</h2>
            <p className="mt-3 text-sm font-light text-[#c8b6a0]">Manage your preferences, profile details, and workspace appearance.</p>
          </section>

          <div className="grid gap-6 max-w-4xl">
            {/* Profile Section */}
            <section className="overflow-hidden rounded-2xl border border-[#3a2617] bg-gradient-to-br from-[#17100c] to-[#100907]">
              <div className="border-b border-[#3a2617] bg-gradient-to-r from-[#2a1a12]/45 to-transparent p-6">
                <h3 className="flex items-center gap-3 font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.05em] text-[#f5e6d3]">
                  <svg className="w-5 h-5 text-[#c9a46c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e7cfa1] to-[#c9a46c] text-2xl font-bold text-[#140c08] shadow-lg shadow-black/25">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-medium text-[#f5e6d3]">{user.email?.split('@')[0]}</p>
                    <p className="text-sm text-[#b69b79]">{user.email}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#c9a46c]">Active Member</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium tracking-wide text-[#c8b6a0]">Display Name</label>
                    <input 
                      type="text" 
                      defaultValue={user.email?.split('@')[0]}
                      className="w-full rounded-xl border border-[#3a2617] bg-[#100907] px-4 py-3 text-[#f5e6d3] placeholder-[#6e5336] transition-all duration-300 focus:border-[#c9a46c]/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium tracking-wide text-[#c8b6a0]">Email</label>
                    <input 
                      type="email" 
                      defaultValue={user.email ?? ""}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-[#2a1a12] bg-[#100907]/70 px-4 py-3 text-[#9d8567]"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Appearance Section */}
            <section id="appearance" className="overflow-hidden rounded-2xl border border-[#3a2617] bg-gradient-to-br from-[#17100c] to-[#100907]">
              <div className="border-b border-[#3a2617] bg-gradient-to-r from-[#2a1a12]/45 to-transparent p-6">
                <h3 className="flex items-center gap-3 font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.05em] text-[#f5e6d3]">
                  <svg className="w-5 h-5 text-[#c9a46c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Appearance
                </h3>
              </div>
              <div className="p-6">
                <AppearanceClient />
              </div>
            </section>

            {/* AI Status Section */}
            <section className="overflow-hidden rounded-2xl border border-[#3a2617] bg-gradient-to-br from-[#17100c] to-[#100907]">
              <div className="border-b border-[#3a2617] bg-gradient-to-r from-[#2a1a12]/45 to-transparent p-6">
                <h3 className="flex items-center gap-3 font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.05em] text-[#f5e6d3]">
                  <svg className="w-5 h-5 text-[#c9a46c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Features
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="rounded-xl border border-[#c9a46c]/22 bg-gradient-to-r from-[#2a1a12]/55 to-transparent p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-2 w-2 rounded-full bg-[#c9a46c] animate-pulse" />
                    <span className="text-sm font-medium text-[#f5e6d3]">AI Features Active</span>
                  </div>
                  <p className="text-xs text-[#b69b79]">Powered by advanced language models for smart features</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#3a2617] bg-[#120b08]/75 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-[#c9a46c]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-[#f5e6d3]">YouTube Summary</span>
                    </div>
                    <p className="text-xs text-[#b69b79]">Extract key points from videos</p>
                  </div>
                  <div className="rounded-xl border border-[#3a2617] bg-[#120b08]/75 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-[#c9a46c]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-[#f5e6d3]">Smart Search</span>
                    </div>
                    <p className="text-xs text-[#b69b79]">Search notes with AI</p>
                  </div>
                  <div className="rounded-xl border border-[#3a2617] bg-[#120b08]/75 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-[#c9a46c]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-[#f5e6d3]">Image to Text</span>
                    </div>
                    <p className="text-xs text-[#b69b79]">Extract text from images</p>
                  </div>
                  <div className="rounded-xl border border-[#3a2617] bg-[#120b08]/75 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-[#c9a46c]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-[#f5e6d3]">Voice Notes</span>
                    </div>
                    <p className="text-xs text-[#b69b79]">Record and transcribe</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Storage & Data */}
            <section className="overflow-hidden rounded-2xl border border-[#3a2617] bg-gradient-to-br from-[#17100c] to-[#100907]">
              <div className="border-b border-[#3a2617] bg-gradient-to-r from-[#2a1a12]/45 to-transparent p-6">
                <h3 className="flex items-center gap-3 font-[family-name:var(--font-serif)] text-2xl font-medium tracking-[0.05em] text-[#f5e6d3]">
                  <svg className="w-5 h-5 text-[#c9a46c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  Storage & Data
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#f5e6d3]">Storage Used</p>
                    <p className="text-sm text-[#b69b79]">Your current data usage</p>
                  </div>
                  <span className="font-medium text-[#e7cfa1]">24.5 MB / 5 GB</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#2a1a12]">
                  <div className="h-full w-[5%] rounded-full bg-gradient-to-r from-[#8d6a3d] to-[#e7cfa1]" />
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="rounded-xl border border-[#3a2617] bg-[#120b08]/75 p-4 text-center">
                    <p className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[#f5e6d3]">12</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#b69b79]">Notes</p>
                  </div>
                  <div className="rounded-xl border border-[#3a2617] bg-[#120b08]/75 p-4 text-center">
                    <p className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[#f5e6d3]">8</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#b69b79]">Summaries</p>
                  </div>
                  <div className="rounded-xl border border-[#3a2617] bg-[#120b08]/75 p-4 text-center">
                    <p className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[#f5e6d3]">3</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#b69b79]">Collections</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button className="rounded-xl border border-[#c9a46c]/35 bg-gradient-to-r from-[#342115] to-[#1a110d] px-8 py-3 font-semibold uppercase tracking-[0.16em] text-[#f5e6d3] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#e7cfa1]/55 hover:shadow-[0_12px_30px_rgba(0,0,0,0.32)]">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
