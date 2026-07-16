"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeftIcon, RefreshIcon } from "@/components/Icons";

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
  const [summary, setSummary] = useState<string | null>(document.summary);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((res) => res.json())
      .then((data) => setWorkspaces(data.workspaces || []))
      .catch(() => {});
  }, []);

  const saveWorkspace = async (workspaceId: string) => {
    setSavingWorkspace(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspaceId || null }),
      });
      if (res.ok) {
        setSelectedWorkspace(workspaceId);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update workspace:", error);
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
          className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
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
              className="text-2xl font-bold text-white bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-1 w-full outline-none focus:border-green-500"
            />
          ) : (
            <h1
              className="text-2xl font-bold text-white truncate cursor-pointer hover:text-green-400 transition-colors"
              onClick={() => { setTitleDraft(document.title); setEditing(true); }}
              title="Click to rename"
            >
              {document.title}
            </h1>
          )}
          <p className="text-sm text-zinc-400 mt-1">{document.fileName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Type</p>
          <p className="text-white font-medium mt-1">{document.fileType.split("/").pop()?.toUpperCase() || "FILE"}</p>
        </div>
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Size</p>
          <p className="text-white font-medium mt-1">{formatBytes(document.fileSize)}</p>
        </div>
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Chunks</p>
          <p className="text-white font-medium mt-1">{chunkCount}</p>
        </div>
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Embedded</p>
          <p className="flex items-center gap-2 mt-1">
            <span className="text-white font-medium">{embeddedCount}/{chunkCount}</span>
            {embeddedCount < chunkCount && (
              <span className="text-xs text-yellow-400">Needs re-index</span>
            )}
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Workspace</p>
          <div className="mt-1">
            {workspaces.length > 0 && (
              <select
                value={selectedWorkspace}
                onChange={(e) => saveWorkspace(e.target.value)}
                disabled={savingWorkspace}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-white text-sm w-full focus:border-green-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">None</option>
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            )}
            {workspaces.length === 0 && (
              <p className="text-white font-medium text-sm">None</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors text-sm"
        >
          Download file
        </a>
        <button
          onClick={handleSummarize}
          disabled={summarizing || !document.textContent}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshIcon className={`w-4 h-4 ${summarizing ? "animate-spin" : ""}`} />
          {summarizing ? "Generating..." : summary ? "Regenerate Summary" : "Generate Summary"}
        </button>
        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshIcon className={`w-4 h-4 ${reindexing ? "animate-spin" : ""}`} />
          {reindexing ? "Re-indexing..." : "Re-index"}
        </button>
      </div>

      {summaryError && (
        <div className="border border-red-500/30 rounded-2xl p-4 bg-red-500/5">
          <p className="text-red-400 text-sm">{summaryError}</p>
        </div>
      )}

      {summary && (
        <div className="p-5 rounded-2xl border border-green-500/30 bg-green-500/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              AI Summary
            </h2>
          </div>
          <p className="text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {reindexMsg && (
        <div className={`p-4 rounded-2xl border ${reindexMsg.includes("failed") ? "border-red-500/30 bg-red-500/5" : "border-green-500/30 bg-green-500/5"}`}>
          <p className={reindexMsg.includes("failed") ? "text-red-400" : "text-green-400"}>{reindexMsg}</p>
        </div>
      )}

      {document.textContent && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Content Preview</h2>
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
              {document.textContent.slice(0, 5000)}
              {document.textContent.length > 5000 && (
                <span className="text-zinc-500">... (truncated)</span>
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
