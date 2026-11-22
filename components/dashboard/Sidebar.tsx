"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
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

  // The mobile drawer always renders expanded — a collapsed desktop sidebar
  // must not leak icon-only content into the drawer.
  const expanded = !collapsed || mobileOpen;

  const inner = (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-16 items-center justify-between border-b-2 border-[var(--color-border)] px-4"
      >
        {expanded && (
          <Link href="/dashboard" onClick={closeMobile} className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex h-9 w-9 items-center justify-center border-2 border-[var(--color-border)] bg-primary-vivid shadow-[3px_3px_0_0_var(--color-border)]"
            >
              <Zap className="h-5 w-5 text-on-brand" />
            </motion.div>
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl uppercase tracking-tight text-white">Nivah</span>
              <span className="mt-1 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-zinc-500">
                AI memory
              </span>
            </span>
          </Link>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={closeMobile}
            className="cursor-pointer border-2 border-transparent p-1.5 text-zinc-400 transition-colors select-none hover:border-[var(--color-border)] hover:bg-zinc-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleCollapsed}
            className="hidden cursor-pointer border-2 border-transparent p-1.5 text-zinc-400 transition-colors select-none hover:border-[var(--color-border)] hover:bg-zinc-800 hover:text-white lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </motion.button>
        </div>
      </motion.div>

      <nav className="flex-1 py-4 px-2 overflow-y-auto" aria-label="Main navigation">
        <ul className="space-y-1" role="list">
          {navigation.map((item, i) => {
            // Exact match for the dashboard root — every other route starts
            // with "/dashboard/", which would highlight both items.
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");
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
                    "relative flex items-center gap-3 border-2 px-3 py-2.5 transition-all duration-150",
                    isActive
                      ? "border-[var(--color-border)] bg-primary-vivid text-white shadow-[3px_3px_0_0_var(--color-border)]"
                      : "border-transparent text-zinc-400 hover:border-[var(--color-border)] hover:bg-zinc-800 hover:text-white hover:shadow-[3px_3px_0_0_var(--color-primary-vivid)]",
                    !expanded && "justify-center"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    className="flex items-center gap-3"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    {expanded && (
                      <span className="text-[0.8rem] font-semibold uppercase tracking-wide">
                        {item.name}
                      </span>
                    )}
                  </motion.div>
                  {isActive && expanded && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-zinc-950"
                    />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>

        {expanded && workspaceList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6 border-t-2 border-[var(--color-border)] pt-4"
          >
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="kicker">
                Workspaces
              </p>
              <Link href="/dashboard/workspaces" onClick={closeMobile} className="text-[0.65rem] font-bold uppercase tracking-widest text-purple-400 transition-colors hover:text-white">
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
                        "flex items-center gap-3 border-2 px-3 py-2 transition-all duration-150",
                        isActive
                          ? "border-[var(--color-border)] bg-primary-vivid text-white shadow-[2px_2px_0_0_var(--color-border)]"
                          : "border-transparent text-zinc-400 hover:border-[var(--color-border)] hover:bg-zinc-800 hover:text-white"
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

        {expanded && recentChats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mt-6 border-t-2 border-[var(--color-border)] pt-4"
          >
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="kicker">
                Recent Chats
              </p>
              <Link href="/dashboard/ask" onClick={closeMobile} className="text-[0.65rem] font-bold uppercase tracking-widest text-purple-400 transition-colors hover:text-white">
                View all
              </Link>
            </div>
            <ul className="space-y-0.5" role="list">
              {recentChats.map((chat) => {
                const isActive =
                  pathname === "/dashboard/ask" && searchParams.get("session") === chat.id;
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
                        "flex items-center gap-3 border-2 px-3 py-2 transition-all duration-150",
                        isActive
                          ? "border-[var(--color-border)] bg-primary-vivid text-white shadow-[2px_2px_0_0_var(--color-border)]"
                          : "border-transparent text-zinc-400 hover:border-[var(--color-border)] hover:bg-zinc-800 hover:text-white"
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

        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="mt-6 border-t-2 border-[var(--color-border)] pt-4"
          >
            <p className="kicker mb-3 px-3">
              Coming Soon
            </p>
            <ul className="space-y-1" role="list">
              {[
                { name: "Cross-AI Memory", icon: Database },
                { name: "Team Workspaces", icon: FolderGit2 },
                { name: "Enterprise Security", icon: Shield },
              ].map((item) => (
                <motion.li
                  key={item.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="group relative flex cursor-not-allowed items-center gap-3 border-2 border-transparent px-3 py-2.5 text-zinc-500 transition-colors hover:border-[var(--color-border)] hover:bg-zinc-800/50 hover:text-zinc-300" title="Coming soon">
                    <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span className="font-medium text-sm truncate">{item.name}</span>
                    <span className="ml-auto border-2 border-[var(--color-border)] px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-widest text-zinc-400">
                      Soon
                    </span>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-8 border-t-2 border-[var(--color-border)] px-3 pt-6"
          >
            <div className="border-2 border-[var(--color-border)] bg-zinc-950 p-4 shadow-[4px_4px_0_0_var(--color-primary-vivid)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border-2 border-[var(--color-border)] bg-primary-vivid">
                  <Shield className="w-5 h-5 text-on-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm uppercase text-white">Nivah Pro</p>
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-zinc-400">Unlimited storage & AI</p>
                </div>
              </div>
              <button
                disabled
                title="Coming soon"
                className="mt-3 w-full btn-primary text-sm py-2 cursor-not-allowed opacity-60"
              >
                Upgrade to Pro
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="border-t-2 border-[var(--color-border)] p-4"
        >
          <div className="flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-800">
              <Bot className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Nivah AI</p>
              <p className="text-[0.65rem] uppercase tracking-wider text-zinc-500">Your memory layer</p>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex bg-zinc-900 border-r-2 border-[var(--color-border)] flex-col overflow-hidden"
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
            className="relative bg-zinc-900 border-r-2 border-[var(--color-border)] w-72 flex flex-col"
          >
            {inner}
          </motion.aside>
        </div>
      )}
    </>
  );
}
