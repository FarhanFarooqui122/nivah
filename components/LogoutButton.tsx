"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
    >
      Sign Out
    </button>
  );
}
