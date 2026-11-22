"use client";

import { useState, useCallback, useRef, useEffect, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, FileIcon, FilterIcon } from "@/components/Icons";
import { PageHeader } from "@/components/dashboard/PageHeader";

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

interface WorkspaceOption {
  id: string;
  name: string;
}

export function SemanticSearchClient({ documents, workspaces = [] }: { documents: DocumentOption[]; workspaces?: WorkspaceOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentFilter, setDocumentFilter] = useState(searchParams.get("documentId") || "");
  const [workspaceFilter, setWorkspaceFilter] = useState(searchParams.get("workspaceId") || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requestSeq = useRef(0);
  const lastWrittenUrlRef = useRef("");

  const doSearch = useCallback(async (q: string, docId?: string, wsId?: string) => {
    const seq = ++requestSeq.current;
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { q: trimmed };
      if (docId) body.documentId = docId;
      if (wsId) body.workspaceId = wsId;

      const res = await fetch("/api/documents/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (seq !== requestSeq.current) return;

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Search failed: ${res.status}`);
      }

      const data = await res.json();
      setResults(data.results || []);
      setHasSearched(true);
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  const updateUrl = useCallback((q: string, docId: string, wsId: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (docId) params.set("documentId", docId);
    if (wsId) params.set("workspaceId", wsId);
    const str = params.toString();
    lastWrittenUrlRef.current = `${q.trim()}|${docId}|${wsId}`;
    router.replace(`/dashboard/semantic-search${str ? `?${str}` : ""}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const docId = searchParams.get("documentId") || "";
    const wsId = searchParams.get("workspaceId") || "";
    const urlKey = `${q}|${docId}|${wsId}`;
    if (urlKey === lastWrittenUrlRef.current) return;
    lastWrittenUrlRef.current = urlKey;
    setQuery(q);
    setDocumentFilter(docId);
    setWorkspaceFilter(wsId);
    if (q) {
      startTransition(() => {
        doSearch(q, docId || undefined, wsId || undefined);
      });
    } else {
      startTransition(() => {
        setResults([]);
        setHasSearched(false);
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doSearch(value, documentFilter || undefined, workspaceFilter || undefined);
        updateUrl(value, documentFilter, workspaceFilter);
      }, 300);
    },
    [doSearch, documentFilter, workspaceFilter, updateUrl]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(query, documentFilter || undefined, workspaceFilter || undefined);
      updateUrl(query, documentFilter, workspaceFilter);
    },
    [query, doSearch, documentFilter, workspaceFilter, updateUrl]
  );

  const handleDocFilterChange = (docId: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDocumentFilter(docId);
    if (query.trim()) {
      doSearch(query, docId || undefined, workspaceFilter || undefined);
      updateUrl(query, docId, workspaceFilter);
    }
  };

  const handleWorkspaceFilterChange = (wsId: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDocumentFilter("");
    setWorkspaceFilter(wsId);
    if (query.trim()) {
      doSearch(query, "", wsId || undefined);
      updateUrl(query, "", wsId);
    }
  };

  const retry = () => {
    doSearch(query, documentFilter || undefined, workspaceFilter || undefined);
  };

  const snippet = (text: string, maxLen = 250): string => {
    return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
  };

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  const scoreColor = (score: number): string => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-amber-600 dark:text-amber-400";
    return "text-zinc-400";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Retrieval"
        title="Semantic search"
        description="Find documents by meaning, not just keywords. Every result is ranked by embedding similarity."
        actions={
          <>
            {workspaces.length > 0 && (
              <select
                value={workspaceFilter}
                onChange={(e) => handleWorkspaceFilterChange(e.target.value)}
                className="brutal-input cursor-pointer px-3 py-2.5 text-sm text-white"
              >
                <option value="">All Workspaces</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            )}
            <div className="relative">
              <FilterIcon className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-zinc-500" />
              <select
                value={documentFilter}
                onChange={(e) => handleDocFilterChange(e.target.value)}
                className="brutal-input cursor-pointer appearance-none py-2.5 pl-9 pr-4 text-sm text-white"
              >
                <option value="">All documents</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.title}</option>
                ))}
              </select>
            </div>
          </>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="relative border-2 border-[var(--color-border)] bg-zinc-900 shadow-[6px_6px_0_0_var(--color-primary-vivid)] transition-colors focus-within:border-purple-500"
      >
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 w-5 h-5 -translate-y-1/2 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search by meaning... (press / to focus)"
          className="w-full bg-transparent py-4 pl-12 pr-32 text-base text-white placeholder-zinc-500 focus:outline-none sm:text-lg"
          aria-label="Semantic search query"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-xs"
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
        <div className="flex items-center justify-center border-2 border-dashed border-[var(--color-border)] py-16">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 animate-spin text-purple-500" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
            <p className="kicker mt-4">Generating embedding and searching...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="border-2 border-red-500 bg-red-500/10 p-6 text-center">
          <p className="font-semibold text-red-400">{error}</p>
          <button
            onClick={retry}
            className="btn-primary mt-3 px-4 py-2 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-900">
            <SearchIcon className="w-6 h-6 text-zinc-500" />
          </div>
          <p className="font-display text-xl uppercase text-white">
            No semantic matches
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Nothing close to &ldquo;{query}&rdquo;. Try rewording your query or upload more documents.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="kicker">
            {results.length} semantic match{results.length !== 1 ? "es" : ""} for &ldquo;{query}&rdquo;
          </p>
          <div className="space-y-3">
            {results.map((result) => (
              <a
                key={result.id}
                href={`/dashboard/documents/${result.documentId}`}
                className="group block border-2 border-[var(--color-border)] bg-zinc-900 p-5 shadow-[4px_4px_0_0_var(--color-primary-vivid)] transition-all hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-primary-vivid)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-950 text-purple-400 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                    <FileIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display truncate text-base uppercase text-white transition-colors group-hover:text-purple-400">
                        {result.title}
                      </h3>
                      <span className={`flex-shrink-0 border-2 border-[var(--color-border)] bg-zinc-950 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest ${scoreColor(result.score)}`}>
                        {formatScore(result.score)} Match
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                      {snippet(result.content)}
                    </p>
                    <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-zinc-500">
                      Chunk {result.chunkIndex + 1}
                    </p>
                  </div>
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-purple-400"
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
        <div className="border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-900 shadow-[4px_4px_0_0_var(--color-primary-vivid)]">
            <SearchIcon className="w-7 h-7 text-purple-400" />
          </div>
          <p className="font-display text-xl uppercase text-white">
            Search your documents by meaning
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Uses AI embeddings to find semantically similar content. Press{" "}
            <kbd className="border-2 border-[var(--color-border)] bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-300">/</kbd>{" "}
            to focus search.
          </p>
        </div>
      )}
    </div>
  );
}
