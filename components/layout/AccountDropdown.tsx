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
        className="group flex items-center gap-3 rounded-xl border border-[#3a2617] bg-[#16100c]/75 px-4 py-2 transition-all duration-300 hover:border-[#c9a46c]/35"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#e7cfa1] to-[#c9a46c] text-[#140c08] font-bold text-sm shadow-lg shadow-black/20">
          {email.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs tracking-wide text-[#9c7a51]">Account</p>
          <p className="max-w-[120px] truncate text-sm font-light text-[#f5e6d3]">{email.split('@')[0]}</p>
        </div>
        <svg 
          className={`h-4 w-4 text-[#b79363] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-[#3a2617] bg-gradient-to-b from-[#17100c] to-[#0e0806] shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="border-b border-[#3a2617]/70 bg-gradient-to-r from-[#2a1a12]/65 to-transparent p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#e7cfa1] to-[#c9a46c] text-lg font-bold text-[#140c08] shadow-lg shadow-black/25">
                {email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f5e6d3]">{email.split('@')[0]}</p>
                <p className="truncate text-xs text-[#a88a62]">{email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 rounded-xl px-4 py-3 text-[#c8b6a0] transition-all duration-200 hover:bg-[#1f140f]/60 hover:text-[#f5e6d3]"
            >
              <svg className="h-5 w-5 text-[#9c7a51] transition-colors group-hover:text-[#e7cfa1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm tracking-wide">Settings</span>
            </Link>

            <Link
              href="/settings#appearance"
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 rounded-xl px-4 py-3 text-[#c8b6a0] transition-all duration-200 hover:bg-[#1f140f]/60 hover:text-[#f5e6d3]"
            >
              <svg className="h-5 w-5 text-[#9c7a51] transition-colors group-hover:text-[#e7cfa1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span className="text-sm tracking-wide">Appearance</span>
            </Link>

            <div className="my-2 mx-4 h-px bg-gradient-to-r from-transparent via-[#3a2617] to-transparent" />

            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 rounded-xl px-4 py-3 text-[#c8b6a0] transition-all duration-200 hover:bg-[#1f140f]/60 hover:text-[#f5e6d3]"
            >
              <svg className="h-5 w-5 text-[#9c7a51] transition-colors group-hover:text-[#e7cfa1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm tracking-wide">Help & Support</span>
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-[#3a2617]/70 p-2">
            <button
              onClick={handleSignOut}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[#c8b6a0] transition-all duration-200 hover:bg-[#24120d] hover:text-[#f0d2ae]"
            >
              <svg className="h-5 w-5 text-[#9c7a51] transition-colors group-hover:text-[#e7cfa1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
