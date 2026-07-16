"use client";

import { useUser } from "@clerk/nextjs";
import { Settings, Mail, Calendar, FileText, MessageCircle, HardDrive, Cpu } from "lucide-react";
import Link from "next/link";
import { formatBytes } from "@/lib/utils";

interface ProfileStats {
  documents: number;
  chunks: number;
  chatSessions: number;
  totalStorage: number;
  joinedAt: string;
}

export function ProfileClient({ stats }: { stats: ProfileStats }) {
  const { user } = useUser();

  const joinDate = new Date(stats.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-zinc-400 mt-1">Your account overview</p>
      </div>

      <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
            {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{user?.fullName || "User"}</h2>
            <p className="text-zinc-400 flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {user?.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-zinc-500 text-sm flex items-center gap-2 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              Joined {joinDate}
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <FileText className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-white">{stats.documents}</p>
          <p className="text-xs text-zinc-500 mt-1">Documents</p>
        </div>
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <Cpu className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{stats.chunks.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1">Chunks</p>
        </div>
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <MessageCircle className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-white">{stats.chatSessions}</p>
          <p className="text-xs text-zinc-500 mt-1">Chat Sessions</p>
        </div>
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <HardDrive className="w-5 h-5 text-yellow-400 mb-2" />
          <p className="text-2xl font-bold text-white">{formatBytes(stats.totalStorage, 1)}</p>
          <p className="text-xs text-zinc-500 mt-1">Storage Used</p>
        </div>
      </div>
    </div>
  );
}
