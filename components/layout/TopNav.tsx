import { AccountDropdown } from "./AccountDropdown";

export function TopNav({ title, email }: { title: string; email?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#1e1e28]/50 bg-[#0a0a0f]/95 backdrop-blur-xl px-8">
      <div className="flex items-center gap-4">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#8b5cf6] via-[#a78bfa] to-[#7c3aed]" />
        <h1 className="text-2xl font-light tracking-wide text-[#e4e4e7]">{title}</h1>
      </div>
      
      {/* Right Side - Account & Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Actions */}
        <button className="group p-2.5 rounded-xl bg-[#111118]/60 border border-[#2a2a38] hover:border-[#8b5cf6]/30 transition-all duration-300">
          <svg className="w-5 h-5 text-[#6b6560] group-hover:text-[#8b5cf6] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        
        <button className="group p-2.5 rounded-xl bg-[#111118]/60 border border-[#2a2a38] hover:border-[#8b5cf6]/30 transition-all duration-300 relative">
          <svg className="w-5 h-5 text-[#6b6560] group-hover:text-[#8b5cf6] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#8b5cf6] animate-pulse" />
        </button>
        
        {/* Account Dropdown */}
        {email && <AccountDropdown email={email} />}
      </div>
    </header>
  );
}
