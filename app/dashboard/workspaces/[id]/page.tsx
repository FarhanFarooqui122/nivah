import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { WorkspaceDetailClient } from "@/components/WorkspaceDetailClient";

export default async function WorkspaceDetailPage(props: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const { id } = await props.params;

  const workspace = await prisma.workspace.findFirst({
    where: { id, userId: user.id },
  });

  if (!workspace) redirect("/dashboard/workspaces");

  const documents = await prisma.document.findMany({
    where: { workspaceId: id, userId: user.id },
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

  return (
    <WorkspaceDetailClient
      workspace={{ id: workspace.id, name: workspace.name, description: workspace.description, createdAt: workspace.createdAt.toISOString() }}
      documents={docs}
    />
  );
}
