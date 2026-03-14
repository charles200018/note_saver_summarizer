"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { smartSearch } from "@/actions/notes";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  created_at: string;
}

export default function SmartSearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      try {
        const result = await smartSearch(query);
        setResults(result.results);
        setAnswer(result.answer);
        setHasSearched(true);
      } catch (error) {
        console.error("Search error:", error);
        setAnswer("An error occurred while searching. Please try again.");
        setResults([]);
        setHasSearched(true);
      }
    });
  };

  const suggestions = [
    "Notes from this week",
    "Ideas about productivity",
    "Meeting notes with action items",
    "All my project notes"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <div className="p-8">
      <div className="mb-10">
        <h2 className="text-3xl font-light text-[#e4e4e7] tracking-wide mb-3">Smart Search</h2>
        <p className="text-[#808080] font-light max-w-2xl">
          Find anything in your notes using natural language. AI understands context and meaning, not just keywords.
        </p>
      </div>

      <div className="max-w-3xl">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="premium-feature-card p-6 mb-8">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {isPending ? (
                <div className="w-6 h-6 border-2 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6 text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              )}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything... e.g., 'What did I learn about AI last week?'"
              className="w-full py-4 pl-14 pr-24 rounded-xl bg-[#0a0a10] border border-[#2a2a38] text-[#e4e4e7] placeholder-[#404050] focus:border-[#1d4ed8]/50 focus:outline-none transition-all duration-300 text-lg font-light"
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={isPending || !query.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1d4ed8] to-[#0f766e] text-[#08080c] font-semibold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#1d4ed8]/30 transition-all duration-300"
            >
              Search
            </button>
          </div>
        </form>

        {/* Suggestions */}
        {!hasSearched && (
          <div className="mb-10">
            <p className="text-sm text-[#606060] mb-4 tracking-wide uppercase">Try asking</p>
            <div className="flex flex-wrap gap-3">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 rounded-lg bg-[#0e0e14] border border-[#1a1a24] text-[#808080] text-sm font-light hover:border-[#1d4ed8]/30 hover:text-[#e4e4e7] transition-all duration-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Answer */}
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-xl bg-gradient-to-r from-[#1d4ed8]/10 to-transparent border border-[#1d4ed8]/20"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1d4ed8] to-[#0f766e] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#08080c]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-[#1d4ed8] uppercase tracking-wider mb-2">AI Answer</p>
                <p className="text-[#e4e4e7] font-light leading-relaxed">{answer}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Results */}
        {hasSearched && results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-[#606060] tracking-wide uppercase">
              Found {results.length} note{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((note, idx) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  href={`/notes/${note.id}`}
                  className="block p-5 rounded-xl bg-[#0e0e14] border border-[#1a1a24] hover:border-[#1d4ed8]/30 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-[#e4e4e7] group-hover:text-[#1d4ed8] transition-colors truncate">
                        {note.title}
                      </h3>
                      <p className="text-sm text-[#606060] mt-1 line-clamp-2">
                        {note.content?.slice(0, 150)}...
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {note.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded-full bg-[#1a1a24] text-[#808080] border border-[#2a2a38]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 text-[#404050] group-hover:text-[#1d4ed8] transition-colors flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Results */}
        {hasSearched && results.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4 inline-flex rounded-full bg-gradient-to-b from-[#1a1a24] to-[#0e0e14] p-6 border border-[#2a2a38]">
              <svg className="w-10 h-10 text-[#404050]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-light text-[#606060] mb-2">No matching notes</h4>
            <p className="text-sm text-[#404050]">Try a different search query</p>
          </div>
        )}

        {/* Features */}
        {!hasSearched && (
          <div className="grid md:grid-cols-2 gap-5 mt-10">
            <div className="premium-feature-card p-6">
              <svg className="w-8 h-8 text-[#1d4ed8] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-light text-[#e4e4e7] mb-2">Semantic Understanding</h3>
              <p className="text-sm text-[#606060] font-light leading-relaxed">
                Find notes by meaning, not just exact matches. Search for concepts and get relevant results.
              </p>
            </div>

            <div className="premium-feature-card p-6">
              <svg className="w-8 h-8 text-[#1d4ed8] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <h3 className="text-lg font-light text-[#e4e4e7] mb-2">Question Answering</h3>
              <p className="text-sm text-[#606060] font-light leading-relaxed">
                Ask questions about your notes and get direct answers synthesized from your content.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
