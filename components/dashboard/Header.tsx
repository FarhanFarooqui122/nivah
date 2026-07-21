"use client";

import { useState } from "react";
import { Menu, Moon, Sun, LogOut, User, Settings, Search, Command } from "lucide-react";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/sidebar-context";
import { useTheme } from "@/lib/theme-context";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user } = useUser();
  const { toggleMobile } = useSidebar();
  const { theme, toggleTheme, mounted } = useTheme();
  const pathname = usePathname();

  const pages = [
    { name: "Dashboard", href: "/dashboard", keywords: "home overview stats" },
    { name: "Documents", href: "/dashboard/documents", keywords: "files folders list" },
    { name: "Upload Document", href: "/dashboard/upload", keywords: "new file add pdf" },
    { name: "AI Connections", href: "/dashboard/ai-connections", keywords: "chatgpt claude ai" },
    { name: "Search", href: "/dashboard/search", keywords: "find query semantic" },
    { name: "Storage", href: "/dashboard/storage", keywords: "usage quota disk" },
    { name: "Settings", href: "/dashboard/settings", keywords: "preferences account" },
    { name: "Help & Docs", href: "/dashboard/help", keywords: "support guide" },
  ];

  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(searchOpen ? "" : "") ||
    page.keywords.toLowerCase().includes(searchOpen ? "" : "")
  );

  return (
    <header className="h-16 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 sticky top-0 z-40">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
            onClick={toggleMobile}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="search"
              placeholder="Search Nivah... (⌘K)"
              className="w-full h-10 pl-10 pr-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            />
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50">
                {filteredPages.map((page) => (
                  <Link
                    key={page.name}
                    href={page.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors",
                      pathname === page.href && "bg-green-500/10 text-green-400"
                    )}
                  >
                    <Command className="w-4 h-4 text-zinc-500" />
                    <span className="font-medium">{page.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationsDropdown />

          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U"}
              </div>
              <span className="hidden md:block text-sm font-medium text-white max-w-[150px] truncate">
                {user?.fullName || user?.emailAddresses[0]?.emailAddress || "User"}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50 py-1">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <p className="font-medium text-white truncate">{user?.fullName || "User"}</p>
                  <p className="text-xs text-zinc-400 truncate">{user?.emailAddresses[0]?.emailAddress}</p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <hr className="my-1 border-zinc-800" />
                <SignOutButton redirectUrl="/sign-in">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </SignOutButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}