import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DocumentsClient } from "@/components/DocumentsClient";
import { formatBytes, formatRelativeTime } from "@/lib/utils";

const FILTER_LABELS: Record<string, string> = {
  pdf: "PDF",
  docx: "DOCX",
  text: "TXT/MD",
  image: "Images",
};

export default async function DocumentsPage(props: { searchParams: Promise<{ type?: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const searchParams = await props.searchParams;
  const typeFilter = searchParams.type ?? null;
  const filterLabel = typeFilter ? FILTER_LABELS[typeFilter] : null;

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const chunkCountMap = new Map<string, number>();
  const embeddedCountMap = new Map<string, number>();
  if (documents.length > 0) {
    const chunkRows = await prisma.$queryRaw<{ document_id: string; count: number }[]>`
      SELECT "documentId" AS document_id, COUNT(*)::int AS count
      FROM "DocumentChunk"
      WHERE "documentId" IN (${Prisma.join(documents.map((d) => d.id))})
      GROUP BY "documentId"
    `;
    for (const row of chunkRows) {
      chunkCountMap.set(row.document_id, row.count);
    }

    const embeddedRows = await prisma.$queryRaw<{ document_id: string; count: number }[]>`
      SELECT "documentId" AS document_id, COUNT(*)::int AS count
      FROM "DocumentChunk"
      WHERE "documentId" IN (${Prisma.join(documents.map((d) => d.id))})
        AND "embedding" IS NOT NULL
      GROUP BY "documentId"
    `;
    for (const row of embeddedRows) {
      embeddedCountMap.set(row.document_id, row.count);
    }
  }
  const docs = documents.map((doc) => ({
    ...doc,
    charCount: doc.textContent?.length ?? 0,
    wordCount: doc.textContent ? doc.textContent.trim().split(/\s+/).filter(Boolean).length : 0,
    chunkCount: chunkCountMap.get(doc.id) ?? 0,
    embeddedCount: embeddedCountMap.get(doc.id) ?? 0,
  }));

  const totalSize = docs.reduce((acc, doc) => acc + doc.fileSize, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Documents</h1>
            {filterLabel && (
              <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs font-medium text-zinc-300">
                {filterLabel}
              </span>
            )}
          </div>
          <p className="text-zinc-400 mt-1">
            {docs.length} document{docs.length !== 1 ? "s" : ""} · {formatBytes(totalSize)} total
            {filterLabel && (
              <a href="/dashboard/documents" className="ml-2 text-xs text-green-400 hover:text-green-300 transition-colors">
                Clear filter
              </a>
            )}
          </p>
        </div>
        <a
          href="/dashboard/upload"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          + Upload
        </a>
      </div>

      <DocumentsClient documents={docs} initialFilter={typeFilter} />
    </div>
  );
}