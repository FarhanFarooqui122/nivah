"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signOut } = useClerk();

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/user/delete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");

      await signOut();
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setDeleting(false);
    }
  };

  if (confirming) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-300">
          This will permanently delete your account and all associated data. This action cannot be undone.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Yes, delete my account"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
    >
      Delete Account
    </button>
  );
}
