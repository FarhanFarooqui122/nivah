"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { SearchIcon } from "@/components/Icons";

interface DocumentResult {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  textContent: string | null;
  createdAt: string;
}

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocumentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/documents/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }

      const data = await res.json();
      setResults(data.results || []);
      setHasSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(value), 300);
    },
    [doSearch]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(query);
    },
    [query, doSearch]
  );

  const snippet = (text: string | null, maxLen = 200): string => {
    if (!text) return "";
    return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Search</h1>
        <p className="text-zinc-400 mt-1">
          Search across your document titles and content
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search documents..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl pl-12 pr-14 py-4 text-white text-lg placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
          aria-label="Search query"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
            loading || !query.trim()
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          )}
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
          ) : (
            "Search"
          )}
        </button>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="w-8 h-8 animate-spin text-green-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
          </svg>
        </div>
      )}

      {error && (
        <div className="border border-red-500/30 rounded-2xl p-6 text-center bg-red-500/5">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="border border-zinc-800 rounded-2xl p-12 text-center">
          <SearchIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium text-lg">
            No documents found for &ldquo;{query}&rdquo;
          </p>
          <p className="text-zinc-600 mt-2">
            Try a different search term or upload a document
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          <div className="space-y-3">
            {results.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-400 group-hover:border-zinc-600 transition-colors">
                    <FileTypeIcon fileType={doc.fileType} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{doc.title}</h3>
                    {doc.textContent && (
                      <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                        {snippet(doc.textContent, 200)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                      <span className="uppercase">
                        {doc.fileType.split("/").pop()?.toUpperCase() || "FILE"}
                      </span>
                      <span>•</span>
                      <span>{formatBytes(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {!loading && !hasSearched && !query && (
        <div className="border border-zinc-800 rounded-2xl p-12 text-center">
          <SearchIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-lg">
            Type a query above to search your documents
          </p>
          <p className="text-zinc-600 mt-2 text-sm">
            Searches across titles and document content
          </p>
        </div>
      )}
    </div>
  );
}