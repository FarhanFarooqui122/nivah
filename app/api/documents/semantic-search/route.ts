import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding, toVectorLiteral } from "@/lib/embeddings";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const MIN_SCORE = 0.3;
const DEFAULT_TOP_K = 10;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const limited = checkRateLimit(`semantic-search:${user.id}`, RATE_LIMITS.semanticSearch.limit, RATE_LIMITS.semanticSearch.windowMs);
    if (limited) return limited;

    let body: { q?: string; topK?: number; documentId?: string; workspaceId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { q, topK, documentId, workspaceId } = body;
    if (!q || typeof q !== "string" || !q.trim()) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const queryEmbedding = await generateEmbedding(q.trim());
    if (!queryEmbedding) {
      return NextResponse.json({ error: "Failed to generate query embedding. Check your GOOGLE_API_KEY." }, { status: 500 });
    }

    const topKValue = typeof topK === "number" && topK > 0 ? Math.min(topK, 50) : DEFAULT_TOP_K;
    const queryVector = toVectorLiteral(queryEmbedding);

    const chunks = await prisma.$queryRaw<{
      id: string;
      documentId: string;
      content: string;
      chunkIndex: number;
      title: string;
      similarity: number;
    }[]>`
      SELECT c."id", c."documentId", c."content", c."chunkIndex", d."title",
             1 - (c."embeddingVector" <=> ${queryVector}::vector) AS "similarity"
      FROM "DocumentChunk" c
      JOIN "Document" d ON d."id" = c."documentId"
      WHERE d."userId" = ${user.id}
        AND c."embeddingVector" IS NOT NULL
        ${documentId ? Prisma.sql`AND c."documentId" = ${documentId}` : Prisma.empty}
        ${workspaceId ? Prisma.sql`AND d."workspaceId" = ${workspaceId}` : Prisma.empty}
      ORDER BY c."embeddingVector" <=> ${queryVector}::vector
      LIMIT ${topKValue}
    `;

    const scored = chunks
      .filter((c) => c.similarity >= MIN_SCORE)
      .map((c) => ({
        id: c.id,
        documentId: c.documentId,
        title: c.title,
        content: c.content,
        chunkIndex: c.chunkIndex,
        score: c.similarity,
      }));

    return NextResponse.json({ results: scored });
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
