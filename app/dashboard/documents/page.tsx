import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentsClient } from "@/components/DocumentsClient";
import { formatBytes, formatRelativeTime } from "@/lib/utils";

export default async function DocumentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const totalSize = documents.reduce((acc, doc) => acc + doc.fileSize, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="text-zinc-400 mt-1">
            {documents.length} document{documents.length !== 1 ? "s" : ""} · {formatBytes(totalSize)} total
          </p>
        </div>
        <a
          href="/dashboard/upload"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          + Upload
        </a>
      </div>

      <DocumentsClient documents={documents} />
    </div>
  );
}