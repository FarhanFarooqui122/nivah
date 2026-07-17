import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { chunkText } from "@/lib/chunker";
import { generateEmbedding } from "@/lib/embeddings";
import { createNotification } from "@/lib/notifications";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
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

  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
  });
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!document.textContent) {
    return NextResponse.json({ error: "Document has no text content" }, { status: 400 });
  }

  await prisma.$executeRaw`DELETE FROM "DocumentChunk" WHERE "documentId" = ${id}`;

  const chunks = chunkText(document.textContent);
  const embeddings = await Promise.all(
    chunks.map((chunk) => generateEmbedding(chunk.content))
  );

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];
    const chunkId = `chunk_${id}_${chunk.chunkIndex}`;
    if (embedding) {
      await prisma.$executeRaw`
        INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "charCount", "embedding", "createdAt")
        VALUES (${chunkId}, ${id}, ${chunk.content}, ${chunk.chunkIndex}, ${chunk.charCount}, ${JSON.stringify(embedding)}::jsonb, NOW())
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "charCount", "createdAt")
        VALUES (${chunkId}, ${id}, ${chunk.content}, ${chunk.chunkIndex}, ${chunk.charCount}, NOW())
      `;
    }
  }

  await createNotification(
    user.id,
    "reindex_complete",
    `Re-indexed "${document.title}"`,
    `${chunks.length} chunks regenerated with fresh embeddings`,
    `/dashboard/documents/${document.id}`
  );

  return NextResponse.json({
    success: true,
    chunkCount: chunks.length,
    embeddedCount: embeddings.filter(Boolean).length,
  });
}
