import Link from "next/link";
import { AccountDropdown } from "./AccountDropdown";

const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/notes", label: "Notes" },
  { href: "/youtube", label: "YouTube" },
  { href: "/folders", label: "Collections" },
];

export function TopNav({ title, email }: { title: string; email?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#232323]/60 bg-[#0b0b0b]/95 px-4 backdrop-blur-xl sm:h-20 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 sm:gap-4">
        <details className="relative lg:hidden">
          <summary className="list-none rounded-xl border border-[#2f2f2f] bg-[#131313]/70 p-2.5 text-[#a09a90] hover:border-[#2563eb]/30 hover:text-[#e4e4e7]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <div className="absolute left-0 top-12 z-50 min-w-44 rounded-xl border border-[#2f2f2f] bg-[#121212] p-2 shadow-2xl shadow-black/50">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-[#a09a90] hover:bg-[#1e1e28]/50 hover:text-[#e4e4e7]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </details>

        <div className="hidden h-8 w-1 rounded-full bg-gradient-to-b from-[#2563eb] via-[#60a5fa] to-[#1d4ed8] sm:block" />
        <h1 className="text-lg font-light tracking-wide text-[#e4e4e7] sm:text-2xl">{title}</h1>
      </div>
      
      {/* Right Side - Account & Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Actions */}
        <button className="group hidden rounded-xl border border-[#2f2f2f] bg-[#131313]/70 p-2.5 transition-all duration-300 hover:border-[#2563eb]/30 sm:block">
          <svg className="w-5 h-5 text-[#6b6560] group-hover:text-[#2563eb] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        
        <button className="group relative hidden rounded-xl border border-[#2f2f2f] bg-[#131313]/70 p-2.5 transition-all duration-300 hover:border-[#2563eb]/30 sm:block">
          <svg className="w-5 h-5 text-[#6b6560] group-hover:text-[#2563eb] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#2563eb] animate-pulse" />
        </button>
        
        {/* Account Dropdown */}
        {email && <AccountDropdown email={email} />}
      </div>
    </header>
  );
}
