import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import AppearanceClient from "@/components/settings/AppearanceClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="ml-64">
        <TopNav title="Settings" email={user.email} />
        <div className="p-8">
          {/* Page Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-light text-[#e4e4e7] tracking-wide mb-2">Account Settings</h2>
            <p className="text-[#6b6560] font-light">Manage your preferences and account details</p>
          </div>

          <div className="grid gap-6 max-w-4xl">
            {/* Profile Section */}
            <section className="rounded-2xl bg-gradient-to-br from-[#111118] to-[#0d0d14] border border-[#1e1e28] overflow-hidden">
              <div className="p-6 border-b border-[#1e1e28] bg-gradient-to-r from-[#8b5cf6]/5 to-transparent">
                <h3 className="text-lg font-medium text-[#e4e4e7] tracking-wide flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8b5cf6] via-[#a78bfa] to-[#7c3aed] flex items-center justify-center text-[#0a0a0f] font-bold text-2xl shadow-lg shadow-[#8b5cf6]/30">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-medium text-[#e4e4e7]">{user.email?.split('@')[0]}</p>
                    <p className="text-sm text-[#6b6560]">{user.email}</p>
                    <p className="text-xs text-[#8b5cf6] mt-2 tracking-wide uppercase">Active Member</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#a09a90] mb-2 tracking-wide">Display Name</label>
                    <input 
                      type="text" 
                      defaultValue={user.email?.split('@')[0]}
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f] border border-[#2a2a38] text-[#e4e4e7] placeholder-[#4a4a50] focus:border-[#8b5cf6]/50 focus:outline-none transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#a09a90] mb-2 tracking-wide">Email</label>
                    <input 
                      type="email" 
                      defaultValue={user.email ?? ""}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f]/50 border border-[#2a2a38] text-[#6b6560] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Appearance Section */}
            <section id="appearance" className="rounded-2xl bg-gradient-to-br from-[#111118] to-[#0d0d14] border border-[#1e1e28] overflow-hidden">
              <div className="p-6 border-b border-[#1e1e28] bg-gradient-to-r from-[#8b5cf6]/5 to-transparent">
                <h3 className="text-lg font-medium text-[#e4e4e7] tracking-wide flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <section className="rounded-2xl bg-gradient-to-br from-[#111118] to-[#0d0d14] border border-[#1e1e28] overflow-hidden">
              <div className="p-6 border-b border-[#1e1e28] bg-gradient-to-r from-[#8b5cf6]/5 to-transparent">
                <h3 className="text-lg font-medium text-[#e4e4e7] tracking-wide flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Features
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#8b5cf6]/10 to-transparent border border-[#8b5cf6]/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-medium text-[#e4e4e7]">AI Features Active</span>
                  </div>
                  <p className="text-xs text-[#6b6560]">Powered by advanced language models for smart features</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#0a0a0f]/50 border border-[#2a2a38]">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-[#e4e4e7]">YouTube Summary</span>
                    </div>
                    <p className="text-xs text-[#6b6560]">Extract key points from videos</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0a0a0f]/50 border border-[#2a2a38]">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-[#e4e4e7]">Smart Search</span>
                    </div>
                    <p className="text-xs text-[#6b6560]">Search notes with AI</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0a0a0f]/50 border border-[#2a2a38]">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-[#e4e4e7]">Image to Text</span>
                    </div>
                    <p className="text-xs text-[#6b6560]">Extract text from images</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0a0a0f]/50 border border-[#2a2a38]">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-[#e4e4e7]">Voice Notes</span>
                    </div>
                    <p className="text-xs text-[#6b6560]">Record and transcribe</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Storage & Data */}
            <section className="rounded-2xl bg-gradient-to-br from-[#111118] to-[#0d0d14] border border-[#1e1e28] overflow-hidden">
              <div className="p-6 border-b border-[#1e1e28] bg-gradient-to-r from-[#8b5cf6]/5 to-transparent">
                <h3 className="text-lg font-medium text-[#e4e4e7] tracking-wide flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  Storage & Data
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#e4e4e7] font-medium">Storage Used</p>
                    <p className="text-sm text-[#6b6560]">Your current data usage</p>
                  </div>
                  <span className="text-[#8b5cf6] font-medium">24.5 MB / 5 GB</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#1e1e28] overflow-hidden">
                  <div className="h-full w-[5%] rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa]" />
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-4 rounded-xl bg-[#0a0a0f]/50 border border-[#2a2a38]">
                    <p className="text-2xl font-light text-[#e4e4e7]">12</p>
                    <p className="text-xs text-[#6b6560] uppercase tracking-wider">Notes</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-[#0a0a0f]/50 border border-[#2a2a38]">
                    <p className="text-2xl font-light text-[#e4e4e7]">8</p>
                    <p className="text-xs text-[#6b6560] uppercase tracking-wider">Summaries</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-[#0a0a0f]/50 border border-[#2a2a38]">
                    <p className="text-2xl font-light text-[#e4e4e7]">3</p>
                    <p className="text-xs text-[#6b6560] uppercase tracking-wider">Collections</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-[#0a0a0f] font-semibold tracking-wide uppercase hover:shadow-lg hover:shadow-[#8b5cf6]/30 transition-all duration-300 hover:-translate-y-0.5">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
