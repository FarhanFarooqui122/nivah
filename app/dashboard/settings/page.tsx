import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  const email = clerkUser?.emailAddresses[0]?.emailAddress || user?.email || "";

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
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Dark Mode</p>
              <p className="text-sm text-zinc-500">Always on — we believe in dark energy</p>
            </div>
            <div className="w-12 h-6 bg-green-600 rounded-full p-1 cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full ml-auto" />
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-zinc-800">
            <div>
              <p className="text-white font-medium">Email Notifications</p>
              <p className="text-sm text-zinc-500">Receive updates about your documents</p>
            </div>
            <div className="w-12 h-6 bg-zinc-700 rounded-full p-1 cursor-pointer">
              <div className="w-4 h-4 bg-zinc-400 rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-zinc-800">
            <div>
              <p className="text-white font-medium">Auto-sync AI Memory</p>
              <p className="text-sm text-zinc-500">Automatically sync connected AIs</p>
            </div>
            <div className="w-12 h-6 bg-green-600 rounded-full p-1 cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full ml-auto" />
            </div>
          </div>
        </div>
      </section>

      <section className="border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Storage</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Current Plan</span>
            <span className="text-white font-medium">{PLANS.FREE.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Storage Limit</span>
            <span className="text-white font-medium">{PLANS.FREE.storageLabel}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">AI Connections</span>
            <span className="text-white font-medium">{PLANS.FREE.maxAiConnections} max</span>
          </div>
          <button className="mt-4 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2.5 rounded-xl transition-all">
            Upgrade to {PLANS.PRO.name} — ${PLANS.PRO.price}/mo
          </button>
        </div>
      </section>

      <section className="border border-red-500/20 rounded-2xl p-6 bg-red-500/5">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors">
          Delete Account
        </button>
      </section>
    </div>
  );
}