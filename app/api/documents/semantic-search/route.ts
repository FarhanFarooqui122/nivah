import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { cosineSimilarity } from "@/lib/cosine-similarity";

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

    const chunks = await prisma.$queryRaw<{
      id: string;
      documentId: string;
      content: string;
      chunkIndex: number;
      embedding: number[] | null;
      title: string;
    }[]>`
      SELECT c."id", c."documentId", c."content", c."chunkIndex", c."embedding", d."title"
      FROM "DocumentChunk" c
      JOIN "Document" d ON d."id" = c."documentId"
      WHERE d."userId" = ${user.id}
        AND c."embedding" IS NOT NULL
        ${documentId ? Prisma.sql`AND c."documentId" = ${documentId}` : Prisma.empty}
        ${workspaceId ? Prisma.sql`AND d."workspaceId" = ${workspaceId}` : Prisma.empty}
    `;

    const scored = chunks
      .filter((c) => c.embedding && c.embedding.length > 0)
      .map((c) => ({
        id: c.id,
        documentId: c.documentId,
        title: c.title,
        content: c.content,
        chunkIndex: c.chunkIndex,
        score: cosineSimilarity(queryEmbedding, c.embedding!),
      }))
      .filter((c) => c.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, topKValue);

    return NextResponse.json({ results: scored });
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
