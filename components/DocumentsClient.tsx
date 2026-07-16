"use client";

import { useState, useMemo, useEffect } from "react";
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
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [aiAction, setAiAction] = useState<string>("");
  const [aiRunning, setAiRunning] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

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
  }, [documents, search, sortBy, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [search, filterType, filterWorkspace]);

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
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
    }
    setDeleting(null);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedDocs.size} document(s)?`)) return;
    for (const id of selectedDocs) {
      await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    }
    setSelectedDocs(new Set());
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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {workspaces.length > 0 && (
            <select value={filterWorkspace} onChange={(e) => setFilterWorkspace(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-green-500 focus:outline-none">
              <option value="all">All Workspaces</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-green-500 focus:outline-none">
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "date" | "name" | "size")} className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-green-500 focus:outline-none">
            <option value="date">Newest</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
        </div>
      </div>

      {selectedDocs.size > 0 && !aiResult && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-900/20 border border-green-500/30 rounded-xl flex-wrap">
          <span className="text-sm text-green-400">{selectedDocs.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={aiAction}
              onChange={(e) => handleAiAction(e.target.value)}
              disabled={aiRunning}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-white text-sm focus:border-green-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">AI Actions</option>
              <option value="summarize">Summarize</option>
              <option value="compare">Compare</option>
              <option value="extract-key-points">Extract Key Points</option>
              <option value="study-notes">Study Notes</option>
              <option value="faq">Generate FAQ</option>
            </select>
          </div>
          <button onClick={handleBulkDelete} className="text-sm text-red-400 hover:text-red-300 transition-colors">Delete selected</button>
          <button onClick={() => setSelectedDocs(new Set())} className="text-sm text-zinc-400 hover:text-white transition-colors">Clear</button>
        </div>
      )}

      {aiRunning && (
        <div className="border border-green-500/30 rounded-2xl p-8 text-center bg-green-900/10">
          <svg className="w-8 h-8 animate-spin text-green-500 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
          </svg>
          <p className="text-zinc-400 mt-3 text-sm">Generating AI output...</p>
        </div>
      )}

      {aiError && (
        <div className="border border-red-500/30 rounded-2xl p-4 bg-red-500/5">
          <p className="text-red-400 text-sm">{aiError}</p>
          <button onClick={() => { setAiError(null); setAiResult(null); }} className="mt-2 text-sm text-zinc-400 hover:text-white transition-colors">Dismiss</button>
        </div>
      )}

      {aiResult && (
        <div className="border border-green-500/30 rounded-2xl bg-green-900/10 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-green-500/20">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1010 10 10 10 0 00-10-10z" />
                <path d="M12 6v6l4 2" />
              </svg>
              AI Result
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(aiResult); }}
                className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
              >
                Copy
              </button>
              <button
                onClick={() => { setAiResult(null); setAiError(null); setAiAction(""); }}
                className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="p-5 max-h-96 overflow-y-auto">
            <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{aiResult}</pre>
          </div>
        </div>
      )}

      {paginated.length === 0 && filtered.length > 0 ? (
        <div className="border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-400 font-medium">No documents on this page</p>
          <button onClick={() => setPage(0)} className="mt-4 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors">
            Go to first page
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-zinc-800 rounded-2xl p-12 text-center">
          {search ? (
            <SearchIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          ) : (
            <FolderIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          )}
          <p className="text-zinc-400 font-medium">
            {search ? "No documents match your search" : "No documents uploaded yet"}
          </p>
          {!search && (
            <Link href="/dashboard/upload" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors">
              <UploadIcon className="w-4 h-4" />
              Upload your first document
            </Link>
          )}
        </div>
      ) : (
        <>
        <div className="border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[40px_1fr_200px_120px_100px] gap-4 px-6 py-3 bg-zinc-900/50 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <div><input type="checkbox" checked={selectedDocs.size === filtered.length && filtered.length > 0} onChange={selectAll} className="rounded border-zinc-600 accent-green-600" /></div>
            <span>Name</span>
            <span>Type</span>
            <span>Size</span>
            <span>Date</span>
          </div>

          <div className="divide-y divide-zinc-800">
            {paginated.map((doc) => (
              <div key={doc.id} className={cn("grid grid-cols-[40px_1fr] md:grid-cols-[40px_1fr_200px_120px_100px] gap-4 px-6 py-4 items-center hover:bg-zinc-900/50 transition-colors group", deleting === doc.id && "opacity-50")}>
                <div>
                  <input type="checkbox" checked={selectedDocs.has(doc.id)} onChange={() => toggleSelect(doc.id)} className="rounded border-zinc-600 accent-green-600" />
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0 text-zinc-400">
                    <FileTypeIcon fileType={doc.fileType} className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <a href={`/dashboard/documents/${doc.id}`} className="font-medium text-white truncate hover:text-green-400 transition-colors">
                      {doc.title}
                    </a>
                    <p className="text-xs text-zinc-500 truncate md:hidden">{formatBytes(doc.fileSize)} · {formatDate(doc.createdAt)}</p>
                    {doc.charCount != null && doc.charCount > 0 && (
                      <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-2">
                        <span>{doc.charCount.toLocaleString()} chars · {doc.wordCount?.toLocaleString()} words · {doc.chunkCount} chunks</span>
                        {doc.embeddedCount != null && doc.chunkCount != null && doc.embeddedCount < doc.chunkCount && (
                          <span className="text-yellow-500 text-[10px] font-medium">Needs re-index</span>
                        )}
                      </p>
                    )}
                    {doc.workspaceName && (
                      <p className="text-xs text-zinc-600 mt-0.5">Workspace: {doc.workspaceName}</p>
                    )}
                  </div>
                </div>

                <span className="hidden md:block text-sm text-zinc-400">{doc.fileType.split("/").pop()?.toUpperCase() || "FILE"}</span>
                <span className="hidden md:block text-sm text-zinc-400">{formatBytes(doc.fileSize)}</span>
                <span className="hidden md:block text-sm text-zinc-400">{formatDate(doc.createdAt)}</span>

                <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Download">
                    <DownloadIcon className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id} className="p-1.5 hover:bg-red-900/30 rounded-lg text-zinc-400 hover:text-red-400 transition-colors" title="Delete">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <span className="text-sm text-zinc-500">
              Page {page + 1} of {totalPages} ({filtered.length} documents)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                    i === page ? "bg-green-600 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {selectedDocs.size > 0 && !aiResult && (
        <div className="flex items-center justify-between px-4 py-3 bg-green-900/20 border border-green-500/30 rounded-xl">
          <span className="text-sm text-green-400">{selectedDocs.size} documents selected</span>
          <div className="flex items-center gap-3">
            {exportMsg && <span className="text-sm text-green-400">{exportMsg}</span>}
            <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              <CopyIcon className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export Context"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}