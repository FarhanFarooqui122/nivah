"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, FolderOpen, Search, Upload, ExternalLink } from "lucide-react";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { formatBytes } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  charCount: number;
  wordCount: number;
  chunkCount: number;
  embeddedCount: number;
  createdAt: Date | string;
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export function WorkspaceDetailClient({
  workspace,
  documents,
}: {
  workspace: Workspace;
  documents: Document[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return documents;
    const q = search.toLowerCase();
    return documents.filter(
      (doc) => doc.title.toLowerCase().includes(q) || doc.fileName.toLowerCase().includes(q)
    );
  }, [documents, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/workspaces"
          className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-white">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-zinc-400 mt-1">{workspace.description}</p>
          )}
          <p className="text-sm text-zinc-500 mt-1">
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/upload"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload
        </Link>
      </div>

      {documents.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border border-zinc-800 rounded-2xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">
            {search ? "No documents match your search" : "No documents in this workspace"}
          </p>
          {!search && (
            <Link
              href="/dashboard/upload"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload a document
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_120px_120px_100px] gap-4 px-6 py-3 bg-zinc-900/50 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <span>Name</span>
            <span>Type</span>
            <span>Size</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {filtered.map((doc) => (
              <div key={doc.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_100px] gap-4 px-6 py-4 items-center hover:bg-zinc-900/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0 text-zinc-400">
                    <FileTypeIcon fileType={doc.fileType} className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/dashboard/documents/${doc.id}`} className="font-medium text-white truncate hover:text-green-400 transition-colors flex items-center gap-2">
                      {doc.title}
                      <ExternalLink className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                    </Link>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {doc.chunkCount} chunks · {doc.embeddedCount}/{doc.chunkCount} embedded
                      {doc.embeddedCount < doc.chunkCount && (
                        <span className="text-yellow-500 ml-2">Needs re-index</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="hidden md:block text-sm text-zinc-400">{doc.fileType.split("/").pop()?.toUpperCase() || "FILE"}</span>
                <span className="hidden md:block text-sm text-zinc-400">{formatBytes(doc.fileSize)}</span>
                <div className="hidden md:flex items-center gap-2">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:text-green-300 transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
