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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#2a1a12]/70 bg-[#0d0705]/92 px-4 backdrop-blur-xl sm:h-20 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 sm:gap-4">
        <details className="relative lg:hidden">
          <summary className="list-none rounded-xl border border-[#3a2617] bg-[#16100c]/75 p-2.5 text-[#c8b6a0] hover:border-[#c9a46c]/40 hover:text-[#f5e6d3]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <div className="absolute left-0 top-12 z-50 min-w-44 rounded-xl border border-[#3a2617] bg-[#140c08] p-2 shadow-2xl shadow-black/50">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-[#c8b6a0] hover:bg-[#1c120d] hover:text-[#f5e6d3]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </details>

        <div className="hidden h-8 w-px rounded-full bg-gradient-to-b from-[#e7cfa1] via-[#c9a46c] to-[#7b5a35] sm:block" />
        <h1 className="font-[family-name:var(--font-serif)] text-xl font-medium tracking-[0.08em] text-[#f5e6d3] sm:text-3xl">{title}</h1>
      </div>
      
      {/* Right Side - Account & Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Actions */}
        <button className="group hidden rounded-xl border border-[#3a2617] bg-[#16100c]/75 p-2.5 transition-all duration-300 hover:border-[#c9a46c]/35 sm:block">
          <svg className="h-5 w-5 text-[#9f7b4d] transition-colors group-hover:text-[#e7cfa1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        
        <button className="group relative hidden rounded-xl border border-[#3a2617] bg-[#16100c]/75 p-2.5 transition-all duration-300 hover:border-[#c9a46c]/35 sm:block">
          <svg className="h-5 w-5 text-[#9f7b4d] transition-colors group-hover:text-[#e7cfa1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#c9a46c] animate-pulse" />
        </button>
        
        {/* Account Dropdown */}
        {email && <AccountDropdown email={email} />}
      </div>
    </header>
  );
}
