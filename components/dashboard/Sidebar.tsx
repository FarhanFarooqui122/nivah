"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Bot,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  Database,
  Zap,
  Shield,
  Search,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Search", href: "/dashboard/search", icon: Search },
  { name: "Documents", href: "/dashboard/documents", icon: FolderOpen },
  { name: "Upload", href: "/dashboard/upload", icon: Upload },
  { name: "AI Connections", href: "/dashboard/ai-connections", icon: Bot },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-800">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Nivah</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 overflow-y-auto" aria-label="Main navigation">
        <ul className="space-y-1" role="list">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    "group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-white border border-green-500/30"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                    collapsed && "justify-center"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="font-medium">{item.name}</span>}
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-500 rounded-r-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {!collapsed && (
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Coming Soon
            </p>
            <ul className="space-y-1" role="list">
              {[
                { name: "Semantic Search", icon: Search, href: "/dashboard/search", comingSoon: true },
                { name: "AI Workspace Sync", icon: Zap, href: "/dashboard/ai-sync", comingSoon: true },
                { name: "Cross-AI Memory", icon: Database, href: "/dashboard/cross-ai", comingSoon: true },
                { name: "Team Workspaces", icon: FolderGit2, href: "/dashboard/teams", comingSoon: true },
                { name: "Enterprise Security", icon: Shield, href: "/dashboard/security", comingSoon: true },
              ].map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors group relative"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span className="font-medium text-sm truncate">{item.name}</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded-full">
                      Soon
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!collapsed && (
          <div className="mt-8 pt-6 border-t border-zinc-800 px-3">
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Nivah Pro</p>
                  <p className="text-xs text-zinc-400">Unlock unlimited storage & AI</p>
                </div>
              </div>
              <button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-400">Nivah AI</p>
              <p className="text-xs text-zinc-500">Your memory layer</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}