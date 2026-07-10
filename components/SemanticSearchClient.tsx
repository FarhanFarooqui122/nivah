"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, FileIcon, FilterIcon } from "@/components/Icons";

interface SemanticResult {
  id: string;
  documentId: string;
  title: string;
  content: string;
  chunkIndex: number;
  score: number;
}

interface DocumentOption {
  id: string;
  title: string;
}

export function SemanticSearchClient({ documents }: { documents: DocumentOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentFilter, setDocumentFilter] = useState(searchParams.get("documentId") || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const q = searchParams.get("q");
    const docId = searchParams.get("documentId");
    if (q) {
      setQuery(q);
      if (docId) setDocumentFilter(docId);
      doSearch(q, docId || undefined);
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const updateUrl = (q: string, docId: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (docId) params.set("documentId", docId);
    const str = params.toString();
    router.replace(`/dashboard/semantic-search${str ? `?${str}` : ""}`, { scroll: false });
  };

  const doSearch = useCallback(async (q: string, docId?: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { q: trimmed };
      if (docId) body.documentId = docId;

      const res = await fetch("/api/documents/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Search failed: ${res.status}`);
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
      debounceRef.current = setTimeout(() => {
        doSearch(value, documentFilter || undefined);
        updateUrl(value, documentFilter);
      }, 300);
    },
    [doSearch, documentFilter]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(query, documentFilter || undefined);
      updateUrl(query, documentFilter);
    },
    [query, doSearch, documentFilter]
  );

  const handleDocFilterChange = (docId: string) => {
    setDocumentFilter(docId);
    if (query.trim()) {
      doSearch(query, docId || undefined);
      updateUrl(query, docId);
    }
  };

  const retry = () => {
    doSearch(query, documentFilter || undefined);
  };

  const snippet = (text: string, maxLen = 250): string => {
    return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
  };

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  const scoreColor = (score: number): string => {
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-zinc-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Semantic Search</h1>
          <p className="text-zinc-400 mt-1">
            Find documents by meaning, not just keywords
          </p>
        </div>
        <div className="relative">
          <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <select
            value={documentFilter}
            onChange={(e) => handleDocFilterChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:border-green-500 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All documents</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.title}</option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search by meaning... (press / to focus)"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl pl-12 pr-14 py-4 text-white text-lg placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
          aria-label="Semantic search query"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-green-600 hover:bg-green-700 text-white disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
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
          <div className="text-center">
            <svg className="w-8 h-8 animate-spin text-green-500 mx-auto" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
            <p className="text-zinc-500 mt-4 text-sm">Generating embedding and searching...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-red-500/30 rounded-2xl p-6 text-center bg-red-500/5">
          <p className="text-red-400">{error}</p>
          <button
            onClick={retry}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="border border-zinc-800 rounded-2xl p-12 text-center">
          <SearchIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium text-lg">
            No semantic matches for &ldquo;{query}&rdquo;
          </p>
          <p className="text-zinc-600 mt-2">
            Try rewording your query or upload more documents
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">
            {results.length} semantic match{results.length !== 1 ? "es" : ""} for &ldquo;{query}&rdquo;
          </p>
          <div className="space-y-3">
            {results.map((result) => (
              <a
                key={result.id}
                href={`/dashboard/documents/${result.documentId}`}
                className="block p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-400 group-hover:border-zinc-600 transition-colors">
                    <FileIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                        {result.title}
                      </h3>
                      <span className={`flex-shrink-0 text-sm font-mono font-medium ${scoreColor(result.score)}`}>
                        {formatScore(result.score)} Match
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-2 line-clamp-3">
                      {snippet(result.content)}
                    </p>
                    <p className="text-xs text-zinc-600 mt-2">
                      Chunk {result.chunkIndex + 1}
                    </p>
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
            Search your documents by meaning
          </p>
          <p className="text-zinc-600 mt-2 text-sm">
            Uses AI embeddings to find semantically similar content. Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs">/</kbd> to focus search.
          </p>
        </div>
      )}
    </div>
  );
}
