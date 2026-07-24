"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-zinc-800/50 animate-pulse",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 p-3">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-8 w-8 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-5 w-16 rounded-md" />
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

export function SkeletonSidebarItem() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
