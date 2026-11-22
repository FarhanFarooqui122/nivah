"use client";

import { cn, formatBytes } from "@/lib/utils";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color: "green" | "blue" | "purple" | "orange" | "red";
  href?: string;
  index?: number;
}

const ICON_TONES = {
  green: "bg-emerald-400 text-emerald-950",
  blue: "bg-sky-400 text-sky-950",
  purple: "bg-purple-500 text-white",
  orange: "bg-amber-400 text-amber-950",
  red: "bg-red-500 text-white",
} as const;

export function StatCard({ title, value, icon, trend, color, href, index = 0 }: StatCardProps) {
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: "easeOut" }}
      whileHover={{ x: -2, y: -2 }}
      className="flex h-full flex-col justify-between border-2 border-[var(--color-border)] bg-zinc-900 p-5 shadow-[4px_4px_0_0_var(--color-primary-vivid)] transition-shadow hover:shadow-[7px_7px_0_0_var(--color-primary-vivid)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker">{title}</p>
          <p className="font-display mt-4 text-4xl leading-none tabular-nums text-white">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--color-border)]",
            ICON_TONES[color],
          )}
        >
          {icon}
        </span>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-widest">
          <span className={cn(trend.value >= 0 ? "text-emerald-400" : "text-red-400")}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-zinc-500">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="block h-full group">
        {cardContent}
      </a>
    );
  }

  return cardContent;
}

interface StorageUsageProps {
  used: number;
  total: number;
}

export function StorageUsage({ used, total }: StorageUsageProps) {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const formattedUsed = formatBytes(used);
  const formattedTotal = formatBytes(total);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="border-2 border-[var(--color-border)] bg-zinc-900 p-6 shadow-[5px_5px_0_0_var(--color-primary-vivid)]"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="kicker mb-1">Capacity</p>
          <h3 className="font-display text-lg uppercase text-white">Storage Usage</h3>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          {formattedUsed} / {formattedTotal}
        </span>
      </div>
      <div className="h-4 overflow-hidden border-2 border-[var(--color-border)] bg-zinc-950">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
          className="h-full bg-primary-vivid"
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">
        <span>{Math.round(percentage)}% used</span>
        <span>{100 - Math.round(percentage)}% free</span>
      </div>
    </motion.div>
  );
}

interface AIConnectionCardProps {
  name: string;
  icon: ReactNode;
  status: "connected" | "disconnected" | "pending";
  description: string;
  onConnect?: () => void;
  index?: number;
}

export function AIConnectionCard({ name, icon, status, description, onConnect, index = 0 }: AIConnectionCardProps) {
  const statusConfig = {
    connected: { badge: "bg-emerald-400 text-emerald-950", label: "Connected" },
    disconnected: { badge: "bg-zinc-800 text-zinc-400", label: "Not Connected" },
    pending: { badge: "bg-amber-400 text-amber-950", label: "Pending" },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: "easeOut" }}
      whileHover={{ x: -2, y: -2 }}
      className="border-2 border-[var(--color-border)] bg-zinc-900 p-5 shadow-[4px_4px_0_0_var(--color-primary-vivid)] transition-shadow hover:shadow-[7px_7px_0_0_var(--color-primary-vivid)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-950">
            {icon}
          </div>
          <div className="min-w-0">
            <h4 className="font-display truncate text-base uppercase text-white">{name}</h4>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">{description}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={cn(
              "border-2 border-[var(--color-border)] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest",
              config.badge,
            )}
          >
            {config.label}
          </span>
          {status !== "connected" && onConnect && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConnect}
              className="btn-primary cursor-pointer px-3 py-1.5 text-xs select-none"
            >
              Connect
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
