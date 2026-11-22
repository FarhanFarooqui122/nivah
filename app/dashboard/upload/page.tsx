"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/upload-limits";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { UploadIcon, FileIcon, PdfIcon, ImageIcon, SpreadsheetIcon, DocumentIcon } from "@/components/Icons";
import { PageHeader } from "@/components/dashboard/PageHeader";

const ACCEPTED_STRINGS = ".pdf,.docx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp";

function splitBySize(files: File[]) {
  const accepted = files.filter((f) => f.size <= MAX_FILE_SIZE);
  const rejected = files.filter((f) => f.size > MAX_FILE_SIZE);
  return { accepted, rejected };
}

interface Workspace {
  id: string;
  name: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((res) => res.json())
      .then((data) => setWorkspaces(data.workspaces || []))
      .catch(() => {});
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    setUploadError(null);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const { accepted, rejected } = splitBySize(droppedFiles);
    if (rejected.length > 0) {
      setUploadError(rejected.map((f) => `"${f.name}" is too large (max ${MAX_FILE_SIZE_MB}MB)`).join(" "));
    }
    if (accepted.length > 0) setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadError(null);
      const selected = Array.from(e.target.files!);
      const { accepted, rejected } = splitBySize(selected);
      if (rejected.length > 0) {
        setUploadError(rejected.map((f) => `"${f.name}" is too large (max ${MAX_FILE_SIZE_MB}MB)`).join(" "));
      }
      if (accepted.length > 0) setFiles((prev) => [...prev, ...accepted]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress((prev) => ({ ...prev, [i]: 0 }));

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
        if (selectedWorkspace) formData.append("workspaceId", selectedWorkspace);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress((prev) => ({ ...prev, [i]: percent }));
          }
        });

        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              let message = `Upload failed: ${xhr.status}`;
              try {
                const data = JSON.parse(xhr.responseText);
                if (data?.error) message = data.error;
              } catch {}
              reject(new Error(message));
            }
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.open("POST", "/api/documents/upload");
          xhr.send(formData);
        });

        setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
      }

      setFiles([]);
      router.refresh();
      router.push("/dashboard/documents");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        kicker="Ingest"
        title="Upload"
        description="Add PDFs, DOCX, text, data and images. Nivah extracts the text, chunks it and indexes it for semantic search."
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed p-10 text-center transition-all sm:p-12",
          dragging ? "border-purple-500 bg-purple-500/10 shadow-[6px_6px_0_0_var(--color-primary-vivid)]" : "border-[var(--color-border)] bg-zinc-900/40 hover:bg-zinc-900/70"
        )}
      >
        <input type="file" multiple accept={ACCEPTED_STRINGS} onChange={handleFileSelect} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        <div className="pointer-events-none">
          <div className="mb-5 flex justify-center">
            <div className={cn("flex h-14 w-14 items-center justify-center border-2 border-[var(--color-border)] transition-colors", dragging ? "bg-purple-500 text-white" : "bg-zinc-950 text-purple-400")}>
              <UploadIcon className="w-7 h-7" />
            </div>
          </div>
          <p className="font-display text-2xl uppercase text-white">{dragging ? "Drop files here" : "Drag & drop files"}</p>
          <p className="mt-1 text-sm text-zinc-400">or click anywhere in this panel to browse</p>
          <p className="kicker mt-5">PDF · DOCX · TXT · MD · CSV · JSON · PNG · JPG · WEBP — up to {MAX_FILE_SIZE_MB}MB</p>
        </div>
      </div>

      {workspaces.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="kicker">Assign workspace</label>
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="brutal-input px-3 py-2 text-sm text-white"
          >
            <option value="">No workspace</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      )}

      {uploadError && (
        <div className="border-2 border-red-500 bg-red-500/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-400">
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {uploadError}
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="brutal-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base uppercase text-white">{files.length} file{files.length !== 1 ? "s" : ""} selected</h2>
            <button onClick={() => setFiles([])} className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:text-white">Clear all</button>
          </div>

          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-4 border-2 border-[var(--color-border)] bg-zinc-950 p-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-900 text-zinc-400">
                  <FileTypeIcon fileType={file.type || file.name.split(".").pop() || ""} className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{file.name}</p>
                  <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  {uploadProgress[index] !== undefined && (
                    <div className="mt-2 h-2 overflow-hidden border-2 border-[var(--color-border)] bg-zinc-900">
                      <div className="h-full bg-primary-vivid transition-all duration-300" style={{ width: `${uploadProgress[index]}%` }} />
                    </div>
                  )}
                </div>
                {!uploading && (
                  <button onClick={() => removeFile(index)} className="border-2 border-transparent p-1.5 text-zinc-400 transition-colors hover:border-red-500 hover:bg-red-500/10 hover:text-red-400" aria-label="Remove file">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className={cn("mt-4 flex w-full items-center justify-center gap-2 py-3 text-sm", uploading ? "cursor-not-allowed border-2 border-[var(--color-border)] bg-zinc-800 text-zinc-500" : "btn-primary")}
          >
            {uploading ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="w-5 h-5" />
                Upload {files.length} file{files.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      )}

      <div className="brutal-card p-6">
        <h2 className="mb-4 font-display text-base uppercase text-white">Accepted File Types</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { type: "PDF", icon: <PdfIcon className="w-5 h-5" />, desc: "Documents" },
            { type: "DOCX", icon: <DocumentIcon className="w-5 h-5" />, desc: "Word files" },
            { type: "TXT / MD", icon: <FileIcon className="w-5 h-5" />, desc: "Text files" },
            { type: "CSV / JSON", icon: <SpreadsheetIcon className="w-5 h-5" />, desc: "Data files" },
            { type: "PNG / JPG", icon: <ImageIcon className="w-5 h-5" />, desc: "Images" },
            { type: "WEBP", icon: <ImageIcon className="w-5 h-5" />, desc: "Web images" },
          ].map((item) => (
            <div key={item.type} className="border-2 border-[var(--color-border)] bg-zinc-950 p-3 text-center shadow-[2px_2px_0_0_var(--color-primary-vivid)]">
              <div className="mb-1 flex items-center justify-center text-purple-400">{item.icon}</div>
              <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-widest text-white">{item.type}</p>
              <p className="text-xs text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}