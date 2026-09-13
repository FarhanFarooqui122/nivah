import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { formatBytes } from "@/lib/utils";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { LogoutButton } from "@/components/LogoutButton";
import { SettingsToggles } from "@/components/SettingsToggles";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  const email = clerkUser?.emailAddresses[0]?.emailAddress || user?.email || "";

  const plan = user?.plan === "pro" ? PLANS.PRO : PLANS.FREE;
  const storage = await prisma.document.aggregate({
    _sum: { fileSize: true },
    where: { userId: user?.id ?? "" },
  });
  const usedBytes = storage._sum.fileSize ?? 0;
  const usedPercent = Math.min(100, Math.round((usedBytes / plan.storageLimit) * 100));

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your account and preferences</p>
      </div>

      <section className="border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white">
              {email[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-lg font-medium text-white">
                {clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ""}` : "User"}
              </p>
              <p className="text-zinc-400">{email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">User ID</label>
              <input
                type="text"
                value={user?.id || ""}
                readOnly
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-500"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
        <SettingsToggles
          initialEmailNotifications={user?.emailNotifications ?? true}
          initialAutoSyncAiMemory={user?.autoSyncAiMemory ?? true}
        />
      </section>

      <section className="border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Storage</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Current Plan</span>
            <span className="text-white font-medium">{plan.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Storage Used</span>
            <span className="text-white font-medium">
              {formatBytes(usedBytes)} of {plan.storageLabel}
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Storage Limit</span>
            <span className="text-white font-medium">{plan.storageLabel}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">AI Connections</span>
            <span className="text-white font-medium">{plan.maxAiConnections} max</span>
          </div>
          {plan === PLANS.FREE && (
            <button className="mt-4 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2.5 rounded-xl transition-all">
              Upgrade to {PLANS.PRO.name} — ${PLANS.PRO.price}/mo
            </button>
          )}
        </div>
      </section>

      <section className="border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Session</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Sign out of your account on this device.
        </p>
        <LogoutButton />
      </section>

      <section className="border border-red-500/20 rounded-2xl p-6 bg-red-500/5">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}