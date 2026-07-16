"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, Trash2, Edit3 } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  _count: { documents: number };
}

export function WorkspacesClient({ workspaces: initial }: { workspaces: Workspace[] }) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState(initial);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      if (res.ok) {
        const { workspace } = await res.json();
        setWorkspaces((prev) => [{ ...workspace, _count: { documents: 0 } }, ...prev]);
        setName("");
        setDescription("");
        setShowCreate(false);
      }
    } catch (error) {
      console.error("Failed to create workspace:", error);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this workspace? Documents in it will not be deleted.")) return;
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" });
      if (res.ok) {
        setWorkspaces((prev) => prev.filter((w) => w.id !== id));
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete workspace:", error);
    }
  };

  const startEdit = (w: Workspace) => {
    setEditing(w.id);
    setEditName(w.name);
    setEditDesc(w.description || "");
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
      });
      if (res.ok) {
        const { workspace } = await res.json();
        setWorkspaces((prev) => prev.map((w) => w.id === id ? { ...w, ...workspace } : w));
        setEditing(null);
      }
    } catch (error) {
      console.error("Failed to update workspace:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Workspaces</h1>
          <p className="text-zinc-400 mt-1">
            Organize your documents into projects
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Workspace
        </button>
      </div>

      {showCreate && (
        <div className="p-6 rounded-2xl border border-green-500/30 bg-green-900/10 space-y-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workspace name"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setName(""); setDescription(""); }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {workspaces.length === 0 ? (
        <div className="border border-zinc-800 rounded-2xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No workspaces yet</p>
          <p className="text-sm text-zinc-500 mt-1">Create a workspace to organize your documents</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="group border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors bg-zinc-900/50">
              {editing === workspace.id ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none"
                  />
                  <input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Description"
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={() => saveEdit(workspace.id)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Save
                    </button>
                    <button onClick={() => setEditing(null)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link href={`/dashboard/workspaces/${workspace.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{workspace.name}</h3>
                          {workspace.description && (
                            <p className="text-sm text-zinc-400 mt-0.5 line-clamp-1">{workspace.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
                    <span className="text-sm text-zinc-500">
                      {workspace._count.documents} document{workspace._count.documents !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(workspace); }}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(workspace.id); }}
                        className="p-1.5 hover:bg-red-900/30 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
