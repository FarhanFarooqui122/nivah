"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { ArrowLeftIcon, RefreshIcon, TrashIcon } from "@/components/Icons";
import { StudyModeClient } from "@/components/StudyModeClient";

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
  textContent: string | null;
  summary: string | null;
  createdAt: string;
  workspaceId?: string | null;
}

export function DocumentDetailClient({
  document,
  chunkCount,
  embeddedCount,
}: {
  document: Document;
  chunkCount: number;
  embeddedCount: number;
}) {
  const router = useRouter();
  const [reindexing, setReindexing] = useState(false);
  const [reindexMsg, setReindexMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(document.title);
  const [saving, setSaving] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>(document.workspaceId || "");
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(document.summary);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showStudy, setShowStudy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((res) => res.json())
      .then((data) => setWorkspaces(data.workspaces || []))
      .catch(() => {});
  }, []);

  const saveWorkspace = async (workspaceId: string) => {
    setSavingWorkspace(true);
    setWorkspaceError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspaceId || null }),
      });
      if (res.ok) {
        setSelectedWorkspace(workspaceId);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setWorkspaceError(data?.error || "Failed to save workspace");
      }
    } catch {
      setWorkspaceError("Failed to save workspace");
    }
    setSavingWorkspace(false);
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummaryError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/summarize`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        router.refresh();
      } else {
        setSummaryError(data.error || "Failed to generate summary");
      }
    } catch {
      setSummaryError("Failed to generate summary");
    }
    setSummarizing(false);
  };

  const saveTitle = async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === document.title) {
      setTitleDraft(document.title);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditing(false);
      router.refresh();
    } catch {
      setTitleDraft(document.title);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleReindex = async () => {
    if (!confirm("Re-index this document? This will delete and regenerate all chunks and embeddings.")) return;
    setReindexing(true);
    setReindexMsg(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/reindex`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setReindexMsg(`Re-indexed: ${data.chunkCount} chunks, ${data.embeddedCount} embedded`);
        router.refresh();
      } else {
        setReindexMsg(data.error || "Re-index failed");
      }
    } catch {
      setReindexMsg("Re-index failed");
    }
    setReindexing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${document.title}"? This permanently removes the file, chunks, and study content.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/documents");
      } else {
        const data = await res.json();
        alert(data.error || "Delete failed");
        setDeleting(false);
      }
    } catch {
      alert("Delete failed");
      setDeleting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/documents"
          className="border-2 border-[var(--color-border)] bg-zinc-900 p-2 text-zinc-400 shadow-[2px_2px_0_0_var(--color-primary-vivid)] transition-all hover:-translate-y-0.5 hover:text-white"
          aria-label="Back to documents"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") { setTitleDraft(document.title); setEditing(false); }
              }}
              disabled={saving}
              className="brutal-input w-full px-2 py-1 font-display text-2xl uppercase text-white outline-none"
            />
          ) : (
            <h1
              className="headline cursor-pointer truncate text-3xl text-white transition-colors hover:text-purple-400 sm:text-4xl"
              onClick={() => { setTitleDraft(document.title); setEditing(true); }}
              title="Click to rename"
            >
              {document.title}
            </h1>
          )}
          <p className="kicker mt-2 truncate">{document.fileName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="border-2 border-[var(--color-border)] bg-zinc-900 p-4 shadow-[2px_2px_0_0_var(--color-primary-vivid)]">
          <p className="kicker">Type</p>
          <p className="mt-2 font-display text-base text-white">{document.fileType.split("/").pop()?.toUpperCase() || "FILE"}</p>
        </div>
        <div className="border-2 border-[var(--color-border)] bg-zinc-900 p-4 shadow-[2px_2px_0_0_var(--color-primary-vivid)]">
          <p className="kicker">Size</p>
          <p className="mt-2 font-display text-base text-white">{formatBytes(document.fileSize)}</p>
        </div>
        <div className="border-2 border-[var(--color-border)] bg-zinc-900 p-4 shadow-[2px_2px_0_0_var(--color-primary-vivid)]">
          <p className="kicker">Chunks</p>
          <p className="mt-2 font-display text-base text-white">{chunkCount}</p>
        </div>
        <div className="border-2 border-[var(--color-border)] bg-zinc-900 p-4 shadow-[2px_2px_0_0_var(--color-primary-vivid)]">
          <p className="kicker">Embedded</p>
          <p className="mt-2 flex items-center gap-2">
            <span className="font-display text-base text-white">{embeddedCount}/{chunkCount}</span>
            {embeddedCount < chunkCount && (
              <span className="border-2 border-amber-400 px-1 py-0.5 text-[0.55rem] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Needs re-index</span>
            )}
          </p>
        </div>
        <div className="border-2 border-[var(--color-border)] bg-zinc-900 p-4 shadow-[2px_2px_0_0_var(--color-primary-vivid)]">
          <p className="kicker">Workspace</p>
          <div className="mt-2">
            {workspaces.length > 0 && (
              <select
                value={selectedWorkspace}
                onChange={(e) => saveWorkspace(e.target.value)}
                disabled={savingWorkspace}
                className="brutal-input w-full px-2 py-1 text-xs text-white disabled:opacity-50"
              >
                <option value="">None</option>
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            )}
            {workspaces.length === 0 && (
              <p className="text-sm font-semibold text-white">None</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`/api/documents/${document.id}/file`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary px-4 py-2 text-xs"
        >
          Download file
        </a>
        <button
          onClick={handleSummarize}
          disabled={summarizing || !document.textContent}
          className="btn-ghost flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-50"
        >
          <RefreshIcon className={`w-4 h-4 ${summarizing ? "animate-spin" : ""}`} />
          {summarizing ? "Generating..." : summary ? "Regenerate Summary" : "Generate Summary"}
        </button>
        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="btn-ghost flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-50"
        >
          <RefreshIcon className={`w-4 h-4 ${reindexing ? "animate-spin" : ""}`} />
          {reindexing ? "Re-indexing..." : "Re-index"}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 border-2 border-red-500 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
        >
          <TrashIcon className="w-4 h-4" />
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {workspaceError && (
        <div className="border-2 border-red-500 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-400">{workspaceError}</p>
        </div>
      )}

      {summaryError && (
        <div className="border-2 border-red-500 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-400">{summaryError}</p>
        </div>
      )}

      {summary && (
        <div className="border-2 border-[var(--color-border)] bg-zinc-900 p-5 shadow-[4px_4px_0_0_var(--color-primary-vivid)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display flex items-center gap-2 text-base uppercase text-white">
              <span className="flex h-8 w-8 items-center justify-center border-2 border-[var(--color-border)] bg-emerald-400 text-emerald-950">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </span>
              AI Summary
            </h2>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{summary}</p>
        </div>
      )}

      {reindexMsg && (
        <div className={`border-2 p-4 ${reindexMsg.includes("failed") ? "border-red-500 bg-red-500/10" : "border-emerald-500 bg-emerald-500/10"}`}>
          <p className={`text-sm font-semibold ${reindexMsg.includes("failed") ? "text-red-400" : "text-emerald-400"}`}>{reindexMsg}</p>
        </div>
      )}

      <div className="flex w-fit items-center gap-1 border-2 border-[var(--color-border)] bg-zinc-900 p-1">
        <button
          onClick={() => setShowStudy(false)}
          className={cn(
            "border-2 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all",
            !showStudy ? "border-[var(--color-border)] bg-primary-vivid text-white" : "border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white",
          )}
        >
          Content
        </button>
        <button
          onClick={() => setShowStudy(true)}
          className={cn(
            "border-2 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all",
            showStudy ? "border-[var(--color-border)] bg-primary-vivid text-white" : "border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white",
          )}
        >
          Study Mode
        </button>
      </div>

      {showStudy ? (
        <StudyModeClient documentId={document.id} />
      ) : document.textContent ? (
        <div>
          <h2 className="mb-3 font-display text-base uppercase text-white">Content Preview</h2>
          <div className="border-2 border-[var(--color-border)] bg-zinc-900 p-4">
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">
              {document.textContent.slice(0, 5000)}
              {document.textContent.length > 5000 && (
                <span className="text-zinc-500">... (truncated)</span>
              )}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
