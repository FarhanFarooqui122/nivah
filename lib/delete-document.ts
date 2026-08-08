import { prisma } from "@/lib/prisma";

export async function deleteDocumentForUser(userId: string, documentId: string) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });
  if (!doc) return false;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`DELETE FROM "DocumentChunk" WHERE "documentId" = ${documentId}`;
    await tx.studyContent.deleteMany({ where: { documentId } });
    await tx.document.delete({ where: { id: documentId } });
  });

  return true;
}
