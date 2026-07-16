import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentDetailClient } from "@/components/DocumentDetailClient";

export default async function DocumentDetailPage(props: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const { id } = await props.params;

  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
  });
  if (!document) redirect("/dashboard/documents");

  const chunks = await prisma.$queryRaw<{
    id: string;
    content: string;
    chunkIndex: number;
    charCount: number;
    embedding: number[] | null;
    createdAt: Date;
  }[]>`
    SELECT * FROM "DocumentChunk"
    WHERE "documentId" = ${id}
    ORDER BY "chunkIndex" ASC
  `;

  const embeddedCount = chunks.filter((c) => c.embedding).length;

  return (
    <DocumentDetailClient
      document={{
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        fileUrl: document.fileUrl,
        textContent: document.textContent,
        createdAt: document.createdAt.toISOString(),
        workspaceId: document.workspaceId,
      }}
      chunkCount={chunks.length}
      embeddedCount={embeddedCount}
    />
  );
}
