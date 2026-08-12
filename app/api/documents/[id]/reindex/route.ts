import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { chunkText } from "@/lib/chunker";
import { generateEmbedding, toVectorLiteral } from "@/lib/embeddings";
import { createNotification } from "@/lib/notifications";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

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

  const limited = checkRateLimit(`reindex:${user.id}`, RATE_LIMITS.reindex.limit, RATE_LIMITS.reindex.windowMs);
  if (limited) return limited;

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

  const chunks = chunkText(document.textContent);
  const embeddings = await Promise.all(
    chunks.map((chunk) => generateEmbedding(chunk.content))
  );

  if (embeddings.every((embedding) => embedding === null)) {
    return NextResponse.json(
      { error: "Embedding generation failed; existing chunks kept intact" },
      { status: 502 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`DELETE FROM "DocumentChunk" WHERE "documentId" = ${id}`;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        const chunkId = `chunk_${id}_${chunk.chunkIndex}`;
        if (embedding) {
          await tx.$executeRaw`
            INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "charCount", "embedding", "embeddingVector", "createdAt")
            VALUES (${chunkId}, ${id}, ${chunk.content}, ${chunk.chunkIndex}, ${chunk.charCount}, ${JSON.stringify(embedding)}::jsonb, ${toVectorLiteral(embedding)}::vector, NOW())
          `;
        } else {
          await tx.$executeRaw`
            INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "charCount", "createdAt")
            VALUES (${chunkId}, ${id}, ${chunk.content}, ${chunk.chunkIndex}, ${chunk.charCount}, NOW())
          `;
        }
      }
    });
  } catch (error) {
    console.error("[Reindex] Failed:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Re-index failed; existing chunks kept intact" },
      { status: 500 }
    );
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
