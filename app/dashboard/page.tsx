import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatCard, StorageUsage, AIConnectionCard } from "@/components/DashboardComponents";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import {
  FileIcon, FolderIcon, StorageIcon, BotIcon, DatabaseIcon,
  UploadIcon, SettingsIcon,
  ChatGPTLogo, ClaudeLogo, GeminiLogo, NivahLogo,
} from "@/components/Icons";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) return <div>No email found</div>;

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    user = await prisma.user.create({
      data: { clerkId: userId, email },
    });
  }

  const [documents, totalFileSize] = await Promise.all([
    prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.document.aggregate({
      where: { userId: user.id },
      _sum: { fileSize: true },
    }),
  ]);

  const docCount = await prisma.document.count({ where: { userId: user.id } });
  const usedStorage = totalFileSize._sum.fileSize ?? 0;
  const storageLimit = 500 * 1024 * 1024;
  const recentDocs = documents.slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1">
          Welcome back, {clerkUser?.firstName || email.split("@")[0]}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Documents" value={docCount} icon={<FileIcon className="w-6 h-6" />} color="green" href="/dashboard/documents" />
        <StatCard title="Storage Used" value={formatBytes(usedStorage)} icon={<DatabaseIcon className="w-6 h-6" />} color="blue" />
        <StatCard title="AI Connections" value={0} icon={<BotIcon className="w-6 h-6" />} color="purple" href="/dashboard/ai-connections" />
        <StatCard title="Free Space" value={formatBytes(storageLimit - usedStorage)} icon={<StorageIcon className="w-6 h-6" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Recent Documents</h2>
              <Link href="/dashboard/documents" className="text-sm text-green-400 hover:text-green-300 transition-colors">
                View all →
              </Link>
            </div>

            {recentDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderIcon className="w-12 h-12 text-zinc-600 mb-4" />
                <p className="text-zinc-400 font-medium">No documents yet</p>
                <p className="text-zinc-600 text-sm mt-1">Upload your first document to get started</p>
                <Link href="/dashboard/upload" className="mt-4 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors text-sm">
                  Upload Document
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900 transition-colors group">
                    <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-400">
                      <FileTypeIcon fileType={doc.fileType} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{doc.title}</p>
                      <p className="text-xs text-zinc-500">
                        {formatBytes(doc.fileSize)} · {formatRelativeTime(doc.createdAt)}
                      </p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-zinc-800 rounded-lg transition-all text-zinc-400" aria-label="More options">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/dashboard/upload" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-green-500/50 hover:bg-zinc-800 transition-all">
                <UploadIcon className="w-6 h-6 text-green-400" />
                <span className="text-sm font-medium text-zinc-300">Upload</span>
              </Link>
              <Link href="/dashboard/ai-connections" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800 transition-all">
                <BotIcon className="w-6 h-6 text-purple-400" />
                <span className="text-sm font-medium text-zinc-300">Connect AI</span>
              </Link>
              <Link href="/dashboard/documents" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800 transition-all">
                <FolderIcon className="w-6 h-6 text-blue-400" />
                <span className="text-sm font-medium text-zinc-300">Browse</span>
              </Link>
              <Link href="/dashboard/settings" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-500/50 hover:bg-zinc-800 transition-all">
                <SettingsIcon className="w-6 h-6 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Settings</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <StorageUsage used={usedStorage} total={storageLimit} />

          <div className="border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">AI Integrations</h2>
              <Link href="/dashboard/ai-connections" className="text-sm text-green-400 hover:text-green-300 transition-colors">
                Manage →
              </Link>
            </div>
            <div className="space-y-3">
              <AIConnectionCard name="ChatGPT" icon={<ChatGPTLogo className="w-6 h-6" />} status="disconnected" description="Connect your GPT account" />
              <AIConnectionCard name="Claude" icon={<ClaudeLogo className="w-6 h-6" />} status="disconnected" description="Sync with Claude AI" />
              <AIConnectionCard name="Gemini" icon={<GeminiLogo className="w-6 h-6" />} status="disconnected" description="Google AI integration" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <NivahLogo className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold text-white">Upgrade to Pro</h3>
                <p className="text-sm text-zinc-400">Get 1TB storage + AI features</p>
              </div>
            </div>
            <ul className="space-y-2 mb-4 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                1TB Storage
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                Unlimited AI Connections
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                Semantic Search
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                Priority Support
              </li>
            </ul>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl transition-colors">
              Upgrade Now — $9/mo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}