import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DocumentsClient } from "@/components/DocumentsClient";
import { formatBytes } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { UploadIcon } from "@/components/Icons";

const FILTER_LABELS: Record<string, string> = {
  pdf: "PDF",
  docx: "DOCX",
  text: "TXT/MD",
  image: "Images",
};

export default async function DocumentsPage(props: { searchParams: Promise<{ type?: string; workspace?: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const searchParams = await props.searchParams;
  const typeFilter = searchParams.type ?? null;
  const workspaceFilter = searchParams.workspace ?? null;
  const filterLabel = typeFilter ? FILTER_LABELS[typeFilter] : null;

  const workspaceWhere = workspaceFilter ? { workspaceId: workspaceFilter } : {};

  const documents = await prisma.document.findMany({
    where: { userId: user.id, ...workspaceWhere },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      fileUrl: true,
      createdAt: true,
      workspaceId: true,
      textContent: true,
    },
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
        AND "embeddingVector" IS NOT NULL
      GROUP BY "documentId"
    `;
    for (const row of embeddedRows) {
      embeddedCountMap.set(row.document_id, row.count);
    }
  }

  const workspaces = await prisma.workspace.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
  const workspaceMap = new Map(workspaces.map((w) => [w.id, w.name]));

  const docs = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    fileUrl: doc.fileUrl,
    createdAt: doc.createdAt,
    charCount: doc.textContent?.length ?? 0,
    wordCount: doc.textContent ? doc.textContent.trim().split(/\s+/).filter(Boolean).length : 0,
    chunkCount: chunkCountMap.get(doc.id) ?? 0,
    embeddedCount: embeddedCountMap.get(doc.id) ?? 0,
    workspaceName: doc.workspaceId ? workspaceMap.get(doc.workspaceId) ?? null : null,
    workspaceId: doc.workspaceId,
  }));

  const totalSize = docs.reduce((acc, doc) => acc + doc.fileSize, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Library"
        title="Documents"
        description={`${docs.length} document${docs.length !== 1 ? "s" : ""} · ${formatBytes(totalSize)} total indexed storage`}
        actions={
          <>
            {filterLabel && (
              <span className="inline-flex items-center gap-2 border-2 border-[var(--color-border)] bg-purple-500/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-purple-400">
                {filterLabel}
                <Link href="/dashboard/documents" className="text-zinc-400 transition-colors hover:text-white">
                  Clear
                </Link>
              </span>
            )}
            <Link href="/dashboard/upload" className="btn-primary px-4 py-2.5 text-xs">
              <UploadIcon className="h-4 w-4" />
              Upload
            </Link>
          </>
        }
      />

      <DocumentsClient documents={docs} initialFilter={typeFilter} workspaces={workspaces} />
    </div>
  );
}