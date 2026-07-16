import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { cosineSimilarity } from "@/lib/cosine-similarity";
import { ai } from "@/lib/embeddings";

const TOP_K = 5;
const MIN_SCORE = 0.3;

const SYSTEM_PROMPT = `You are Nivah.

Answer ONLY using the supplied document context.

If the answer is not contained in the context, say:

"I couldn't find that information in your documents."

Do not invent facts.
Do not hallucinate.
Do not use outside knowledge.

Always stay grounded in the provided context.`;

function buildContext(
  chunks: { content: string; title: string }[],
): string {
  return chunks
    .map(
      (c) =>
        `Document:\n${c.title}\n\nContent:\n${c.content}\n---`,
    )
    .join("\n\n");
}

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

  const { question, sessionId, workspaceId } = await request.json();
  if (!question || typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  let session;
  if (sessionId) {
    session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
  }

  const queryEmbedding = await generateEmbedding(question.trim());
  if (!queryEmbedding) {
    return NextResponse.json(
      { error: "Failed to generate query embedding. Check your GOOGLE_API_KEY." },
      { status: 500 },
    );
  }

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
      ${workspaceId ? Prisma.sql`AND d."workspaceId" = ${workspaceId}` : Prisma.empty}
  `;

  const scored = chunks
    .filter((c) => c.embedding && c.embedding.length > 0)
    .map((c) => ({
      documentId: c.documentId,
      title: c.title,
      content: c.content,
      similarity: cosineSimilarity(queryEmbedding, c.embedding!),
    }))
    .filter((c) => c.similarity >= MIN_SCORE)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TOP_K);

  if (scored.length === 0) {
    const noAnswer = "I couldn't find that information in your documents.";

    if (!session) {
      session = await prisma.chatSession.create({
        data: { title: question.trim().slice(0, 80), userId: user.id },
      });
    }

    await prisma.chatMessage.createMany({
      data: [
        { role: "USER", content: question.trim(), sessionId: session.id },
        { role: "ASSISTANT", content: noAnswer, sessionId: session.id },
      ],
    });

    return NextResponse.json({
      answer: noAnswer,
      sources: [],
      sessionId: session.id,
    });
  }

  const context = buildContext(scored);

  const prompt = `Context:\n\n${context}\n\nQuestion:\n${question.trim()}`;

  let answer: string;
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
      },
    });

    answer = result.text ?? "I couldn't find that information in your documents.";
  } catch (error) {
    console.error("[Ask Nivah] Generation failed:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to generate answer. Please try again." },
      { status: 500 },
    );
  }

  const seen = new Set<string>();
  const sources = scored
    .filter((s) => {
      if (seen.has(s.documentId)) return false;
      seen.add(s.documentId);
      return true;
    })
    .map((s) => ({
      documentId: s.documentId,
      documentTitle: s.title,
      similarity: s.similarity,
    }));

  if (!session) {
    session = await prisma.chatSession.create({
      data: { title: question.trim().slice(0, 80), userId: user.id },
    });
  }

  await prisma.chatMessage.createMany({
    data: [
      { role: "USER", content: question.trim(), sessionId: session.id },
      {
        role: "ASSISTANT",
        content: answer,
        sources: sources,
        sessionId: session.id,
      },
    ],
  });

  return NextResponse.json({ answer, sources, sessionId: session.id });
  } catch (error) {
    console.error("[Ask Nivah] Unhandled error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
