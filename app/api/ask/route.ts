import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding, toVectorLiteral } from "@/lib/embeddings";
import { ai } from "@/lib/embeddings";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

const TOP_K = 5;
const MIN_SCORE = 0.3;

const SYSTEM_PROMPT = `You are Nivah, a helpful AI assistant with access to the user's documents.

When you are given document context, base your answers on those documents and cite them.
When greeting you or having a general conversation, respond naturally.
If the user asks about their documents but no relevant context is available, say:
"I couldn't find that information in your documents."

Do not invent facts or hallucinate.`;

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

const FALLBACK_ANSWER = "I couldn't find that information in your documents.";

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

    const limited = checkRateLimit(`ask:${user.id}`, RATE_LIMITS.ask.limit, RATE_LIMITS.ask.windowMs);
    if (limited) return limited;

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

    if (!session) {
      session = await prisma.chatSession.create({
        data: { title: question.trim().slice(0, 80), userId: user.id },
      });
    }

    const queryEmbedding = await generateEmbedding(question.trim());
    if (!queryEmbedding) {
      return NextResponse.json(
        { error: "Failed to generate query embedding. Check your GOOGLE_API_KEY." },
        { status: 500 },
      );
    }

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
        ${workspaceId ? Prisma.sql`AND d."workspaceId" = ${workspaceId}` : Prisma.empty}
      ORDER BY c."embeddingVector" <=> ${queryVector}::vector
      LIMIT ${TOP_K}
    `;

    const scored = chunks
      .filter((c) => c.similarity >= MIN_SCORE)
      .map((c) => ({
        documentId: c.documentId,
        title: c.title,
        content: c.content,
        similarity: c.similarity,
      }))
      .slice(0, TOP_K);

    const context = buildContext(scored);

    const prompt = `Context:\n\n${context}\n\nQuestion:\n${question.trim()}`;

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

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          send({ type: "meta", sessionId: session.id, sources });

          const result = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature: 0.5,
            },
          });

          let answer = "";
          for await (const chunk of result) {
            const text = chunk.text ?? "";
            if (!text) continue;
            answer += text;
            send({ type: "delta", text });
          }

          if (!answer.trim()) answer = FALLBACK_ANSWER;

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

          await prisma.chatSession.update({
            where: { id: session.id },
            data: { updatedAt: new Date() },
          });

          send({ type: "done" });
        } catch (error) {
          console.error("[Ask Nivah] Generation failed:", error instanceof Error ? error.message : error);
          send({ type: "error", error: "Failed to generate answer. Please try again." });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[Ask Nivah] Unhandled error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
