import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth/AuthButton";
import { SidebarNav } from "./SidebarNav";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/notes", label: "Notes", icon: "file-text" },
  { href: "/youtube", label: "YouTube", icon: "play-circle" },
  { href: "/folders", label: "Collections", icon: "folder" },
];

const premiumFeatures = [
  { href: "/image-to-text", label: "Image to Text", icon: "camera" },
  { href: "/voice-notes", label: "Voice Notes", icon: "mic" },
  { href: "/templates", label: "Templates", icon: "template" },
  { href: "/smart-search", label: "Smart Search", icon: "sparkles" },
];

const icons: Record<string, React.ReactNode> = {
  "grid": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  "file-text": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  "play-circle": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  "folder": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  "camera": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  "mic": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  "template": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  "sparkles": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
};

export async function Sidebar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[#2a1a12] bg-[linear-gradient(180deg,#140c08_0%,#0f0906_55%,#0b0604_100%)] lg:flex">
      {/* Logo Section */}
      <div className="flex h-20 items-center gap-3 border-b border-[#2a1a12]/80 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c9a46c]/45 bg-gradient-to-br from-[#2e1d13] to-[#140c08] shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
          {/* Diamond/Gem Icon */}
          <svg className="h-5 w-5 text-[#e7cfa1]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 9l10 13 10-13L12 2zm0 3.84L18.26 9 12 17.65 5.74 9 12 5.84z"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-[family-name:var(--font-serif)] text-lg font-semibold tracking-[0.18em] text-[#f1dab2]">AURELIUS</span>
          <span className="text-[10px] uppercase tracking-[0.32em] text-[#9c7a51]">Premium Notes</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        <SidebarNav items={mainNavItems} icons={icons} title="Main" />
        
        {/* Tools Section */}
        <div className="pt-6">
          <SidebarNav items={premiumFeatures} icons={icons} title="Tools" />
        </div>
      </nav>

      {/* Divider */}
      <div className="mx-6 luxury-divider" />

      {/* User Section */}
      <div className="p-4">
        <AuthButton email={user.email ?? ""} />
      </div>
    </aside>
  );
}
