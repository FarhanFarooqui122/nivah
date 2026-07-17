import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/embeddings";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    if (!document.textContent || document.textContent.trim().length === 0) {
      return NextResponse.json({ error: "Document has no text content to summarize" }, { status: 400 });
    }

    const MAX_CHARS = 30000;
    const content = document.textContent.slice(0, MAX_CHARS);

    const prompt = `Summarize the following document. Provide a clear, concise summary highlighting the key points and main ideas.

Document Title: ${document.title}

Content:
${content}

Write a concise summary (2-4 paragraphs) that captures the essential information.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const summary = result.text?.trim() || "Failed to generate summary.";

    await prisma.document.update({
      where: { id },
      data: { summary },
    });

    await createNotification(
      user.id,
      "summary_ready",
      `Summary ready for "${document.title}"`,
      null,
      `/dashboard/documents/${document.id}`
    );

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[Summarize] Failed:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to generate summary. Please try again." },
      { status: 500 },
    );
  }
}
