"use client";

import { cn } from "@/lib/utils";

export function Loading() {
  return (
    <div className={cn(
      "flex min-h-screen items-center justify-center border-2 border-[var(--color-border)] bg-zinc-900 p-8",
      "animate-spin"
    )}>
    <svg className="mx-auto h-12 w-12 text-purple-500" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
    </svg>
    <p className="kicker mt-4">Loading...</p>
    </div>
  );
}