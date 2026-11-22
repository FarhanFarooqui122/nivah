"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, Moon, Sun, LogOut, User, Settings, Search, Command } from "lucide-react";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/sidebar-context";
import { useTheme } from "@/lib/theme-context";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isLoaded } = useUser();
  const { toggleMobile } = useSidebar();
  const { theme, toggleTheme, mounted } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        // Don't hijack browser/editor shortcuts while typing multiline or
        // rich text (e.g. the Ask Nivah composer), and ignore key repeats.
        const target = e.target as HTMLElement | null;
        if (
          e.repeat ||
          target?.closest('textarea, [contenteditable="true"], [data-clerk-modal]')
        ) {
          return;
        }
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close the user menu on outside click or Escape.
  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  const pages = [
    { name: "Dashboard", href: "/dashboard", keywords: "home overview stats" },
    { name: "Documents", href: "/dashboard/documents", keywords: "files folders list" },
    { name: "Upload Document", href: "/dashboard/upload", keywords: "new file add pdf" },
    { name: "AI Connections", href: "/dashboard/ai-connections", keywords: "chatgpt claude ai" },
    { name: "Search", href: "/dashboard/search", keywords: "find query semantic" },
    { name: "Semantic Search", href: "/dashboard/semantic-search", keywords: "embedding vector meaning" },
    { name: "Settings", href: "/dashboard/settings", keywords: "preferences account" },
    { name: "Profile", href: "/dashboard/profile", keywords: "account info" },
  ];

  const query = searchQuery.trim().toLowerCase();
  const filteredPages = pages.filter((page) =>
    !query ||
    page.name.toLowerCase().includes(query) ||
    page.keywords.toLowerCase().includes(query)
  );

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-16 bg-zinc-900 border-b-2 border-[var(--color-border)] sticky top-0 z-40"
    >
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="lg:hidden p-2 border-2 border-transparent hover:border-[var(--color-border)] hover:bg-zinc-800 text-zinc-400 cursor-pointer transition-colors"
            onClick={toggleMobile}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search Nivah... (⌘K)"
              className="w-full h-10 pl-10 pr-4 bg-zinc-950 border-2 border-[var(--color-border)] text-sm font-medium text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:shadow-[3px_3px_0_0_var(--color-primary-vivid)] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchOpen(false);
                  searchInputRef.current?.blur();
                }
              }}
            />
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border-2 border-[var(--color-border)] shadow-[6px_6px_0_0_var(--color-primary-vivid)] overflow-hidden z-50"
                >
                  {filteredPages.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-zinc-500">No pages match &ldquo;{searchQuery}&rdquo;</p>
                  ) : (
                    filteredPages.map((page) => (
                        <Link
                        key={page.name}
                        href={page.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 border-b-2 border-zinc-800 last:border-b-0 hover:bg-zinc-800 transition-colors",
                          pathname === page.href && "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        )}
                      >
                        <Command className="w-4 h-4 text-zinc-500" />
                        <span className="font-semibold text-sm uppercase tracking-wide">{page.name}</span>
                      </Link>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationsDropdown />

          {mounted && (
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 border-2 border-transparent hover:border-[var(--color-border)] hover:bg-zinc-800 text-zinc-400 transition-colors cursor-pointer select-none"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </motion.button>
          )}

          <div className="relative" ref={userMenuRef}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 border-2 border-transparent hover:border-[var(--color-border)] hover:bg-zinc-800 transition-colors cursor-pointer select-none"
              aria-label="User menu"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <motion.div
                className="w-9 h-9 bg-primary-vivid border-2 border-[var(--color-border)] shadow-[2px_2px_0_0_var(--color-border)] flex items-center justify-center text-on-brand text-sm font-bold"
              >
                {isLoaded ? (user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U") : ""}
              </motion.div>
              <span className="hidden md:block text-[0.7rem] font-bold uppercase tracking-wider text-white max-w-[150px] truncate">
                {isLoaded ? (user?.fullName || user?.emailAddresses[0]?.emailAddress || "User") : ""}
              </span>
            </motion.button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-60 bg-zinc-950 border-2 border-[var(--color-border)] shadow-[6px_6px_0_0_var(--color-primary-vivid)] overflow-hidden z-50 py-1"
                >
                  <div className="px-4 py-3 border-b-2 border-[var(--color-border)]">
                    <p className="font-bold text-white truncate">{user?.fullName || "User"}</p>
                    <p className="text-[0.7rem] text-zinc-400 truncate">{user?.emailAddresses[0]?.emailAddress || ""}</p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-wide text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-wide text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <hr className="my-1 border-zinc-800" />
                  <SignOutButton redirectUrl="/sign-in">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-wide text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors cursor-pointer select-none">
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </SignOutButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
