import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: { id, userId: user.id },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const documents = await prisma.document.findMany({
    where: { workspaceId: id, userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const chunkRows = await prisma.$queryRaw<{ document_id: string; count: number }[]>`
    SELECT "documentId" AS document_id, COUNT(*)::int AS count
    FROM "DocumentChunk"
    WHERE "documentId" IN (${Prisma.join(documents.map((d) => d.id))})
    GROUP BY "documentId"
  `;

  const embeddedRows = await prisma.$queryRaw<{ document_id: string; count: number }[]>`
    SELECT "documentId" AS document_id, COUNT(*)::int AS count
    FROM "DocumentChunk"
    WHERE "documentId" IN (${Prisma.join(documents.map((d) => d.id))})
      AND "embedding" IS NOT NULL
    GROUP BY "documentId"
  `;

  const chunkCountMap = new Map(chunkRows.map((r) => [r.document_id, r.count]));
  const embeddedCountMap = new Map(embeddedRows.map((r) => [r.document_id, r.count]));

  const docs = documents.map((doc) => ({
    ...doc,
    chunkCount: chunkCountMap.get(doc.id) ?? 0,
    embeddedCount: embeddedCountMap.get(doc.id) ?? 0,
  }));

  return NextResponse.json({ documents: docs });
}
