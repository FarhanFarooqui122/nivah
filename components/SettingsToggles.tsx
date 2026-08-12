"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme-context";

interface SettingsTogglesProps {
  initialEmailNotifications: boolean;
  initialAutoSyncAiMemory: boolean;
}

export function SettingsToggles({
  initialEmailNotifications,
  initialAutoSyncAiMemory,
}: SettingsTogglesProps) {
  const { theme, toggleTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(initialEmailNotifications);
  const [autoSyncAiMemory, setAutoSyncAiMemory] = useState(initialAutoSyncAiMemory);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingSync, setSavingSync] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updatePreference = async (field: string, value: boolean): Promise<boolean> => {
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  };

  const handleEmailToggle = async () => {
    setSavingEmail(true);
    setSaveError(null);
    const newVal = !emailNotifications;
    setEmailNotifications(newVal);
    const ok = await updatePreference("emailNotifications", newVal);
    if (!ok) {
      setEmailNotifications(!newVal);
      setSaveError("Failed to save email notification preference");
    }
    setSavingEmail(false);
  };

  const handleSyncToggle = async () => {
    setSavingSync(true);
    setSaveError(null);
    const newVal = !autoSyncAiMemory;
    setAutoSyncAiMemory(newVal);
    const ok = await updatePreference("autoSyncAiMemory", newVal);
    if (!ok) {
      setAutoSyncAiMemory(!newVal);
      setSaveError("Failed to save auto-sync preference");
    }
    setSavingSync(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-white font-medium">Dark Mode</p>
          <p className="text-sm text-zinc-500">Switch between dark and light themes</p>
        </div>
        <button
          onClick={toggleTheme}
          className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
            theme === "dark" ? "bg-purple-600" : "bg-zinc-700"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full transition-all ${
              theme === "dark" ? "bg-white ml-auto" : "bg-zinc-400"
            }`}
          />
        </button>
      </div>

      {saveError && (
        <div className="border border-red-500/30 rounded-xl p-3 bg-red-500/5">
          <p className="text-red-400 text-sm">{saveError}</p>
        </div>
      )}

      <div className="flex items-center justify-between py-3 border-t border-zinc-800">
        <div>
          <p className="text-white font-medium">Email Notifications</p>
          <p className="text-sm text-zinc-500">Receive updates about your documents</p>
        </div>
        <button
          onClick={handleEmailToggle}
          disabled={savingEmail}
          className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
            emailNotifications ? "bg-purple-600" : "bg-zinc-700"
          } ${savingEmail ? "opacity-50" : ""}`}
        >
          <div
            className={`w-4 h-4 rounded-full transition-all ${
              emailNotifications ? "bg-white ml-auto" : "bg-zinc-400"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between py-3 border-t border-zinc-800">
        <div>
          <p className="text-white font-medium">Auto-sync AI Memory</p>
          <p className="text-sm text-zinc-500">Automatically sync connected AIs</p>
        </div>
        <button
          onClick={handleSyncToggle}
          disabled={savingSync}
          className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
            autoSyncAiMemory ? "bg-purple-600" : "bg-zinc-700"
          } ${savingSync ? "opacity-50" : ""}`}
        >
          <div
            className={`w-4 h-4 rounded-full transition-all ${
              autoSyncAiMemory ? "bg-white ml-auto" : "bg-zinc-400"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
