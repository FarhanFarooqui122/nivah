"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  Database,
  Zap,
  Shield,
  Search,
  X,
  MessageCircle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/sidebar-context";
import { motion } from "framer-motion";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Search", href: "/dashboard/search", icon: Search },
  { name: "Semantic Search", href: "/dashboard/semantic-search", icon: Search },
  { name: "Ask Nivah", href: "/dashboard/ask", icon: MessageCircle },
  { name: "Documents", href: "/dashboard/documents", icon: FolderOpen },
  { name: "Workspaces", href: "/dashboard/workspaces", icon: Layers },
  { name: "Upload", href: "/dashboard/upload", icon: Upload },
  { name: "AI Connections", href: "/dashboard/ai-connections", icon: Bot },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const navItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const },
  }),
};

export function Sidebar() {
  const { mobileOpen, collapsed, closeMobile, toggleCollapsed } = useSidebar();
  const pathname = usePathname();
  const [workspaceList, setWorkspaceList] = useState<{ id: string; name: string }[]>([]);
  const [recentChats, setRecentChats] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((res) => res.json())
      .then((data) => setWorkspaceList(data.workspaces || []))
      .catch(() => {});
    fetch("/api/chat/sessions")
      .then((res) => res.json())
      .then((data) => setRecentChats((data.sessions || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  const inner = (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-16 items-center justify-between px-4 border-b border-zinc-800"
      >
        {!collapsed && (
          <Link href="/dashboard" onClick={closeMobile} className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(34,197,94,0.3)" }}
              className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center"
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-white">Nivah</span>
          </Link>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={closeMobile}
            className="lg:hidden p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer select-none"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleCollapsed}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer select-none"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </motion.button>
        </div>
      </motion.div>

      <nav className="flex-1 py-4 px-2 overflow-y-auto" aria-label="Main navigation">
        <ul className="space-y-1" role="list">
          {navigation.map((item, i) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <motion.li
                key={item.name}
                custom={i}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
              >
                <Link
                  href={item.href}
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    "group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-white border border-green-500/30 shadow-glow-green"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                    collapsed && "justify-center"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center gap-3"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="font-medium">{item.name}</span>}
                  </motion.div>
                  {isActive && !collapsed && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-500 rounded-r-full shadow-glow-green"
                    />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>

        {!collapsed && workspaceList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6 pt-4 border-t border-zinc-800"
          >
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Workspaces
              </p>
              <Link href="/dashboard/workspaces" onClick={closeMobile} className="text-xs text-green-400 hover:text-green-300 transition-colors">
                Manage
              </Link>
            </div>
            <ul className="space-y-0.5" role="list">
              {workspaceList.slice(0, 5).map((ws) => {
                const isActive = pathname === `/dashboard/workspaces/${ws.id}`;
                return (
                  <motion.li
                    key={ws.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Link
                      href={`/dashboard/workspaces/${ws.id}`}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-white border border-green-500/30"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      )}
                    >
                      <Layers className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{ws.name}</span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}

        {!collapsed && recentChats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mt-6 pt-4 border-t border-zinc-800"
          >
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Recent Chats
              </p>
              <Link href="/dashboard/ask" onClick={closeMobile} className="text-xs text-green-400 hover:text-green-300 transition-colors">
                View all
              </Link>
            </div>
            <ul className="space-y-0.5" role="list">
              {recentChats.map((chat) => {
                const isActive = pathname === `/dashboard/ask?session=${chat.id}`;
                return (
                  <motion.li
                    key={chat.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Link
                      href={`/dashboard/ask?session=${chat.id}`}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-white border border-green-500/30"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      )}
                    >
                      <MessageCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{chat.title}</span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}

        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="mt-6 pt-4 border-t border-zinc-800"
          >
            <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Coming Soon
            </p>
            <ul className="space-y-1" role="list">
              {[
                { name: "Cross-AI Memory", icon: Database, href: "/dashboard/cross-ai", comingSoon: true },
                { name: "Team Workspaces", icon: FolderGit2, href: "/dashboard/teams", comingSoon: true },
                { name: "Enterprise Security", icon: Shield, href: "/dashboard/security", comingSoon: true },
              ].map((item) => (
                <motion.li
                  key={item.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
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
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-8 pt-6 border-t border-zinc-800 px-3"
          >
            <motion.div
              animate={{ boxShadow: ["0 0 20px rgba(34,197,94,0.1)", "0 0 40px rgba(34,197,94,0.2)", "0 0 20px rgba(34,197,94,0.1)"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="bg-gradient-to-r from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Nivah Pro</p>
                  <p className="text-xs text-zinc-400">Unlock unlimited storage & AI</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(34,197,94,0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer select-none"
              >
                Upgrade to Pro
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </nav>

      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="p-4 border-t border-zinc-800"
        >
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-400">Nivah AI</p>
              <p className="text-xs text-zinc-500">Your memory layer</p>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex bg-zinc-900 border-r border-zinc-800 flex-col overflow-hidden"
      >
        {inner}
      </motion.aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={closeMobile}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative bg-zinc-900 border-r border-zinc-800 w-64 flex flex-col"
          >
            {inner}
          </motion.aside>
        </div>
      )}
    </>
  );
}
