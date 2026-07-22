"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, X, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) fetchNotifications();
      return next;
    });
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const markAllRead = async () => {
    await Promise.all(
      notifications.filter((n) => !n.read).map((n) => markAsRead(n.id))
    );
  };

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const timeStrings = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of notifications) {
      const diff = now - new Date(n.createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      let label: string;
      if (mins < 1) label = "just now";
      else if (mins < 60) label = `${mins}m ago`;
      else {
        const hours = Math.floor(mins / 60);
        if (hours < 24) label = `${hours}h ago`;
        else {
          const days = Math.floor(hours / 24);
          label = `${days}d ago`;
        }
      }
      map[n.id] = label;
    }
    return map;
  }, [notifications, now]);

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <p className="text-sm font-semibold text-white">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="w-8 h-8 text-zinc-600 mb-2" />
                  <p className="text-sm text-zinc-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors ${
                      !n.read ? "bg-green-500/5" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      {n.link ? (
                        <Link href={n.link} onClick={() => { setOpen(false); markAsRead(n.id); }}>
                          <p className="text-sm font-medium text-white truncate">{n.title}</p>
                          {n.message && (
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                          )}
                        </Link>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-white">{n.title}</p>
                          {n.message && (
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                          )}
                        </>
                      )}
                      <p className="text-xs text-zinc-600 mt-1">{timeStrings[n.id]}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="p-1 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors flex-shrink-0"
                        aria-label="Mark as read"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
