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

export function StatCard({ title, value, icon, trend, color, href, index = 0 }: StatCardProps) {
  const colorClasses = {
    green: "bg-green-500/20 border-green-500/30 text-green-400",
    blue: "bg-blue-500/20 border-blue-500/30 text-blue-400",
    purple: "bg-purple-500/20 border-purple-500/30 text-purple-400",
    orange: "bg-orange-500/20 border-orange-500/30 text-orange-400",
    red: "bg-red-500/20 border-red-500/30 text-red-400",
  };

  const iconBgClasses = {
    green: "bg-green-500/20",
    blue: "bg-blue-500/20",
    purple: "bg-purple-500/20",
    orange: "bg-orange-500/20",
    red: "bg-red-500/20",
  };

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(34,197,94,0.15)" }}
      className={cn("p-6 rounded-2xl border transition-all hover:border-opacity-50", colorClasses[color])}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className={cn(trend.value >= 0 ? "text-green-400" : "text-red-400")}>
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-zinc-500">{trend.label}</span>
            </div>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={cn("p-3 rounded-xl", iconBgClasses[color])}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="block group">
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
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Storage Usage</h3>
        <span className="text-sm text-zinc-400">{formattedUsed} / {formattedTotal}</span>
      </div>
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full relative overflow-hidden"
        >
          <div className="absolute inset-0 animate-shimmer" />
        </motion.div>
      </div>
      <div className="flex items-center justify-between mt-3 text-sm text-zinc-500">
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
    connected: { color: "text-green-400", bg: "bg-green-500/20 border-green-500/30", label: "Connected" },
    disconnected: { color: "text-zinc-500", bg: "bg-zinc-800 border-zinc-700", label: "Not Connected" },
    pending: { color: "text-yellow-400", bg: "bg-yellow-500/20 border-yellow-500/30", label: "Pending" },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn("p-5 rounded-2xl border transition-all", config.bg)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-3 rounded-xl bg-zinc-900 border border-zinc-700"
          >
            {icon}
          </motion.div>
          <div>
            <h4 className="font-semibold text-white">{name}</h4>
            <p className="text-sm text-zinc-400 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("px-3 py-1 rounded-full text-xs font-medium", config.color, config.bg)}>
            {config.label}
          </span>
          {status !== "connected" && onConnect && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onConnect}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer select-none"
            >
              Connect
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
