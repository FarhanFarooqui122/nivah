"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { TrashIcon, DownloadIcon, UploadIcon, FolderIcon, SearchIcon, CopyIcon } from "@/components/Icons";

const PDF_TYPE = "application/pdf";
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TEXT_TYPES = ["text/plain", "text/markdown"];
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const FILTER_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "text", label: "TXT/MD" },
  { value: "image", label: "Images" },
] as const;

interface Workspace {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: Date | string;
  charCount?: number;
  wordCount?: number;
  chunkCount?: number;
  embeddedCount?: number;
  workspaceName?: string | null;
  workspaceId?: string | null;
}

const PAGE_SIZE = 20;

export function DocumentsClient({ documents, initialFilter, workspaces = [] }: { documents: Document[]; initialFilter?: string | null; workspaces?: Workspace[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [filterType, setFilterType] = useState<string>(
    initialFilter && FILTER_OPTIONS.some((o) => o.value === initialFilter) ? initialFilter : "all"
  );
  const [filterWorkspace, setFilterWorkspace] = useState<string>("all");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [aiAction, setAiAction] = useState<string>("");
  const [aiRunning, setAiRunning] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...documents];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((doc) => doc.title.toLowerCase().includes(q) || doc.fileName.toLowerCase().includes(q));
    }
    if (filterType !== "all") {
      result = result.filter((doc) => {
        switch (filterType) {
          case "pdf": return doc.fileType === PDF_TYPE;
          case "docx": return doc.fileType === DOCX_TYPE;
          case "text": return TEXT_TYPES.includes(doc.fileType);
          case "image": return IMAGE_TYPES.includes(doc.fileType);
          default: return true;
        }
      });
    }
    if (filterWorkspace !== "all") {
      result = result.filter((doc) => doc.workspaceId === filterWorkspace);
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.title.localeCompare(b.title);
        case "size": return b.fileSize - a.fileSize;
        case "date": default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return result;
  }, [documents, search, sortBy, filterType, filterWorkspace]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp for rendering so deletions that shrink the list never strand the
  // user on an empty page (page state is only reset on filter changes).
  const safePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedDocs);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedDocs(next);
  };

  const selectAll = () => {
    if (selectedDocs.size === filtered.length) setSelectedDocs(new Set());
    else setSelectedDocs(new Set(filtered.map((d) => d.id)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    setDeleting(id);
    setListError(null);
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedDocs((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        router.refresh();
      } else {
        setListError("Failed to delete document");
      }
    } catch {
      setListError("Failed to delete document");
    }
    setDeleting(null);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedDocs.size} document(s)?`)) return;
    if (bulkDeleting) return;
    setBulkDeleting(true);
    setListError(null);
    const failed: string[] = [];
    for (const id of selectedDocs) {
      try {
        const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
        if (!res.ok) failed.push(id);
      } catch {
        failed.push(id);
      }
    }
    if (failed.length > 0) {
      setListError(`${failed.length} document(s) failed to delete`);
    }
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      for (const id of prev) {
        if (!failed.includes(id)) next.delete(id);
      }
      return next;
    });
    setBulkDeleting(false);
    router.refresh();
  };

  const handleAiAction = async (action: string) => {
    setAiAction(action);
    setAiRunning(true);
    setAiResult(null);
    setAiError(null);
    try {
      const res = await fetch("/api/documents/ai-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, documentIds: Array.from(selectedDocs) }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiResult(data.output);
      } else {
        setAiError(data.error || "AI action failed");
      }
    } catch {
      setAiError("AI action failed");
    }
    setAiRunning(false);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportMsg(null);
    try {
      const res = await fetch("/api/documents/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: Array.from(selectedDocs) }),
      });
      if (!res.ok) {
        const err = await res.json();
        setExportMsg(err.error || "Export failed");
        return;
      }
      const { markdown } = await res.json();
      await navigator.clipboard.writeText(markdown);
      setExportMsg("Context copied to clipboard");
      setTimeout(() => setExportMsg(null), 3000);
    } catch {
      setExportMsg("Failed to copy to clipboard");
    }
    setExporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="brutal-input w-full py-2.5 pl-10 pr-4 text-white placeholder-zinc-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {workspaces.length > 0 && (
            <select value={filterWorkspace} onChange={(e) => { setFilterWorkspace(e.target.value); setPage(0); }} className="brutal-input px-3 py-2.5 text-sm text-white">
              <option value="all">All Workspaces</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(0); }} className="brutal-input px-3 py-2.5 text-sm text-white">
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as "date" | "name" | "size"); setPage(0); }} className="brutal-input px-3 py-2.5 text-sm text-white">
            <option value="date">Newest</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
        </div>
      </div>

      {selectedDocs.size > 0 && !aiResult && (
        <div className="flex flex-wrap items-center gap-3 border-2 border-[var(--color-border)] bg-purple-500/10 px-4 py-3 shadow-[3px_3px_0_0_var(--color-primary-vivid)]">
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">{selectedDocs.size} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={aiAction}
              onChange={(e) => handleAiAction(e.target.value)}
              disabled={aiRunning}
              className="brutal-input px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              <option value="">AI Actions</option>
              <option value="summarize">Summarize</option>
              <option value="compare">Compare</option>
              <option value="extract-key-points">Extract Key Points</option>
              <option value="study-notes">Study Notes</option>
              <option value="faq">Generate FAQ</option>
            </select>
          </div>
          <button onClick={handleBulkDelete} disabled={bulkDeleting} className="text-[0.7rem] font-bold uppercase tracking-widest text-red-400 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50">
            {bulkDeleting ? "Deleting..." : "Delete selected"}
          </button>
          <button onClick={() => setSelectedDocs(new Set())} className="text-[0.7rem] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:text-white">Clear</button>
        </div>
      )}

      {aiRunning && (
        <div className="border-2 border-[var(--color-border)] bg-zinc-900 p-8 text-center shadow-[4px_4px_0_0_var(--color-primary-vivid)]">
          <svg className="mx-auto h-8 w-8 animate-spin text-purple-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
          </svg>
          <p className="text-zinc-400 mt-3 text-sm">Generating AI output...</p>
        </div>
      )}

      {listError && (
        <div className="border-2 border-red-500 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-400">{listError}</p>
          <button onClick={() => setListError(null)} className="mt-2 text-[0.7rem] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:text-white">Dismiss</button>
        </div>
      )}

      {aiError && (
        <div className="border-2 border-red-500 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-400">{aiError}</p>
          <button onClick={() => { setAiError(null); setAiResult(null); setAiAction(""); }} className="mt-2 text-[0.7rem] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:text-white">Dismiss</button>
        </div>
      )}

      {aiResult && (
        <div className="overflow-hidden border-2 border-[var(--color-border)] bg-zinc-900 shadow-[5px_5px_0_0_var(--color-primary-vivid)]">
          <div className="flex items-center justify-between border-b-2 border-[var(--color-border)] px-5 py-3">
            <h3 className="font-display flex items-center gap-2 text-sm uppercase text-white">
              <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1010 10 10 10 0 00-10-10z" />
                <path d="M12 6v6l4 2" />
              </svg>
              AI Result
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(aiResult);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setCopied(false);
                  }
                }}
                className="border-2 border-transparent px-2 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:border-[var(--color-border)] hover:bg-zinc-800 hover:text-white"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => { setAiResult(null); setAiError(null); setAiAction(""); }}
                className="border-2 border-transparent px-2 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:border-[var(--color-border)] hover:bg-zinc-800 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto p-5">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">{aiResult}</pre>
          </div>
        </div>
      )}

      {paginated.length === 0 && filtered.length > 0 ? (
        <div className="border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <p className="font-semibold text-zinc-400">No documents on this page</p>
          <button onClick={() => setPage(0)} className="btn-ghost mt-4 px-5 py-2.5 text-xs">
            Go to first page
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-900">
            {search ? (
              <SearchIcon className="w-6 h-6 text-zinc-500" />
            ) : (
              <FolderIcon className="w-6 h-6 text-zinc-500" />
            )}
          </div>
          <p className="font-semibold text-zinc-400">
            {search ? "No documents match your search" : "No documents uploaded yet"}
          </p>
          {!search && (
            <Link href="/dashboard/upload" className="btn-primary mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs">
              <UploadIcon className="w-4 h-4" />
              Upload your first document
            </Link>
          )}
        </div>
      ) : (
        <>
        <div className="overflow-hidden border-2 border-[var(--color-border)] bg-zinc-900 shadow-[5px_5px_0_0_var(--color-primary-vivid)]">
          <div className="hidden grid-cols-[40px_1fr_180px_100px_110px_90px] gap-4 border-b-2 border-[var(--color-border)] bg-zinc-950 px-6 py-3 md:grid">
            <div><input type="checkbox" checked={selectedDocs.size === filtered.length && filtered.length > 0} onChange={selectAll} className="accent-purple-600" /></div>
            <span className="kicker">Name</span>
            <span className="kicker">Type</span>
            <span className="kicker">Size</span>
            <span className="kicker">Date</span>
            <span className="kicker">Actions</span>
          </div>

          <div className="divide-y-2 divide-zinc-800">
            {paginated.map((doc) => (
              <div key={doc.id} className={cn("group grid grid-cols-[40px_1fr] items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-800/40 md:grid-cols-[40px_1fr_180px_100px_110px_90px]", deleting === doc.id && "opacity-50")}>
                <div>
                  <input type="checkbox" checked={selectedDocs.has(doc.id)} onChange={() => toggleSelect(doc.id)} className="accent-purple-600" />
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-950 text-zinc-400">
                    <FileTypeIcon fileType={doc.fileType} className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <a href={`/dashboard/documents/${doc.id}`} className="block truncate font-semibold text-white transition-colors hover:text-purple-400">
                      {doc.title}
                    </a>
                    <p className="truncate text-xs text-zinc-500 md:hidden">{formatBytes(doc.fileSize)} · {formatDate(doc.createdAt)}</p>
                    {doc.charCount != null && doc.charCount > 0 && (
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                        <span>{doc.charCount.toLocaleString()} chars · {doc.wordCount != null ? `${doc.wordCount.toLocaleString()} words` : ""} · {doc.chunkCount ?? 0} chunks</span>
                        {doc.embeddedCount != null && doc.chunkCount != null && doc.embeddedCount < doc.chunkCount && (
                          <span className="border-2 border-amber-400 px-1 py-0.5 text-[0.55rem] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Needs re-index</span>
                        )}
                      </p>
                    )}
                    {doc.workspaceName && (
                      <p className="mt-0.5 text-xs text-zinc-500">Workspace: {doc.workspaceName}</p>
                    )}
                  </div>
                </div>

                <span className="hidden text-[0.7rem] font-bold uppercase tracking-widest text-zinc-400 md:block">{doc.fileType.split("/").pop()?.toUpperCase() || "FILE"}</span>
                <span className="hidden text-sm text-zinc-400 md:block">{formatBytes(doc.fileSize)}</span>
                <span className="hidden text-sm text-zinc-400 md:block">{formatDate(doc.createdAt)}</span>

                <div className="hidden items-center gap-1 transition-opacity md:flex md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                  <a href={`/api/documents/${doc.id}/file`} target="_blank" rel="noopener noreferrer" className="border-2 border-transparent p-1.5 text-zinc-400 transition-colors hover:border-[var(--color-border)] hover:bg-zinc-800 hover:text-white" title="Download">
                    <DownloadIcon className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id} className="border-2 border-transparent p-1.5 text-zinc-400 transition-colors hover:border-red-500 hover:bg-red-500/10 hover:text-red-400" title="Delete">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-2 border-[var(--color-border)] bg-zinc-900 px-4 py-3">
            <span className="text-[0.7rem] font-bold uppercase tracking-widest text-zinc-500">
              Page {safePage + 1} of {totalPages} ({filtered.length} documents)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
                className="btn-ghost px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={cn(
                    "h-8 w-8 border-2 text-xs font-bold transition-colors",
                    i === safePage ? "border-[var(--color-border)] bg-primary-vivid text-white" : "border-transparent bg-zinc-800 text-zinc-400 hover:border-[var(--color-border)] hover:text-white"
                  )
                }
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                disabled={safePage >= totalPages - 1}
                className="btn-ghost px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {selectedDocs.size > 0 && !aiResult && (
        <div className="flex items-center justify-between border-2 border-[var(--color-border)] bg-purple-500/10 px-4 py-3 shadow-[3px_3px_0_0_var(--color-primary-vivid)]">
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">{selectedDocs.size} documents selected</span>
          <div className="flex items-center gap-3">
            {exportMsg && <span className="text-sm text-purple-400">{exportMsg}</span>}
            <button onClick={handleExport} disabled={exporting} className="btn-primary gap-1.5 px-4 py-2 text-xs disabled:opacity-50">
              <CopyIcon className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export Context"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}