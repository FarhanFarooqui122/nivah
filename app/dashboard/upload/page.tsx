"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { UploadIcon, FileIcon, PdfIcon, ImageIcon, SpreadsheetIcon, DocumentIcon } from "@/components/Icons";

const ACCEPTED_STRINGS = ".pdf,.docx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp";

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
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
        if (selectedWorkspace) formData.append("workspaceId", selectedWorkspace);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
          }
        });

        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
          } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
          }
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.open("POST", "/api/documents/upload");
          xhr.send(formData);
        });

        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
      }

      setFiles([]);
      router.refresh();
      router.push("/dashboard/documents");
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Upload Document</h1>
        <p className="text-zinc-400 mt-1">
          Support for PDF, DOCX, TXT, MD, CSV, JSON, and images
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 transition-all text-center",
          dragging ? "border-green-500 bg-green-500/10" : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"
        )}
      >
        <input type="file" multiple accept={ACCEPTED_STRINGS} onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="pointer-events-none">
          <div className="flex items-center justify-center mb-4">
            <UploadIcon className={cn("w-12 h-12 transition-colors", dragging ? "text-green-400" : "text-zinc-500")} />
          </div>
          <p className="text-lg font-medium text-white">{dragging ? "Drop files here" : "Drag & drop files here"}</p>
          <p className="text-zinc-500 mt-2">or click to browse</p>
          <p className="text-zinc-600 text-sm mt-4">PDF, DOCX, TXT, MD, CSV, JSON, PNG, JPG, WEBP — up to 50MB</p>
        </div>
      </div>

      {workspaces.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-zinc-400">Assign to workspace:</label>
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-green-500 focus:outline-none"
          >
            <option value="">No workspace</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      )}

      {files.length > 0 && (
        <div className="border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{files.length} file{files.length !== 1 ? "s" : ""} selected</h2>
            <button onClick={() => setFiles([])} className="text-sm text-zinc-400 hover:text-white transition-colors">Clear all</button>
          </div>

          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-400">
                  <FileTypeIcon fileType={file.type || file.name.split(".").pop() || ""} className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress[file.name]}%` }} />
                    </div>
                  )}
                </div>
                {!uploading && (
                  <button onClick={() => removeFile(index)} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors" aria-label="Remove file">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className={cn("mt-4 w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2", uploading ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white")}
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

      <div className="border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Accepted File Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { type: "PDF", icon: <PdfIcon className="w-5 h-5" />, desc: "Documents" },
            { type: "DOCX", icon: <DocumentIcon className="w-5 h-5" />, desc: "Word files" },
            { type: "TXT / MD", icon: <FileIcon className="w-5 h-5" />, desc: "Text files" },
            { type: "CSV / JSON", icon: <SpreadsheetIcon className="w-5 h-5" />, desc: "Data files" },
            { type: "PNG / JPG", icon: <ImageIcon className="w-5 h-5" />, desc: "Images" },
            { type: "WEBP", icon: <ImageIcon className="w-5 h-5" />, desc: "Web images" },
          ].map((item) => (
            <div key={item.type} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
              <div className="flex items-center justify-center text-zinc-400 mb-1">{item.icon}</div>
              <p className="font-medium text-white text-sm mt-1">{item.type}</p>
              <p className="text-xs text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}