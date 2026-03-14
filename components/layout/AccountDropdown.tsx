"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AccountDropdown({ email }: { email: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#111118]/60 border border-[#2a2a38] hover:border-[var(--color-accent)/30] transition-all duration-300 group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-accent)] via-[#60a5fa] to-[#1d4ed8] flex items-center justify-center text-[#0a0a0f] font-bold text-sm shadow-lg shadow-[var(--color-accent)/20]">
          {email.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs text-[#a09a90] tracking-wide">Account</p>
          <p className="text-sm text-[#e4e4e7] font-light truncate max-w-[120px]">{email.split('@')[0]}</p>
        </div>
        <svg 
          className={`w-4 h-4 text-[var(--color-accent)/60] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-gradient-to-b from-[#111118] to-[#0d0d14] border border-[#2a2a38] shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* Header */}
          <div className="p-4 border-b border-[#2a2a38]/50 bg-gradient-to-r from-[var(--color-accent)/5] to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-accent)] via-[#60a5fa] to-[#1d4ed8] flex items-center justify-center text-[#0a0a0f] font-bold text-lg shadow-lg shadow-[var(--color-accent)/30]">
                {email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#e4e4e7]">{email.split('@')[0]}</p>
                <p className="text-xs text-[#6b6560] truncate">{email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09a90] hover:text-[#e4e4e7] hover:bg-[#1e1e28]/50 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-[#6b6560] group-hover:text-[var(--color-accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm tracking-wide">Settings</span>
            </Link>

            <Link
              href="/settings#appearance"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09a90] hover:text-[#e4e4e7] hover:bg-[#1e1e28]/50 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-[#6b6560] group-hover:text-[#2563eb] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span className="text-sm tracking-wide">Appearance</span>
            </Link>

            <div className="my-2 mx-4 h-px bg-gradient-to-r from-transparent via-[#2a2a38] to-transparent" />

            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09a90] hover:text-[#e4e4e7] hover:bg-[#1e1e28]/50 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-[#6b6560] group-hover:text-[#2563eb] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm tracking-wide">Help & Support</span>
            </Link>
          </div>

          {/* Sign Out */}
          <div className="p-2 border-t border-[#2a2a38]/50">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09a90] hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-[#6b6560] group-hover:text-rose-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm tracking-wide">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
