import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ai } from "@/lib/embeddings";
import { NextRequest, NextResponse } from "next/server";

const STUDY_PROMPTS: Record<string, string> = {
  flashcards: `You are an AI study assistant. Create flashcards from the following document content. Each flashcard should have a question on one side and an answer on the other.

Document: {title}

Content:
{content}

Generate 10-15 flashcards covering the most important concepts. Return the flashcards as a JSON array of objects with "question" and "answer" fields. Example format:
[{"question": "What is X?", "answer": "X is Y"}]`,

  quiz: `You are an AI study assistant. Create a quiz from the following document content. Each quiz item should have a question and a detailed answer.

Document: {title}

Content:
{content}

Generate 8-10 quiz questions covering the key concepts. Return as a JSON array of objects with "question" and "answer" fields. Example format:
[{"question": "What is X?", "answer": "X is Y"}]`,

  mcq: `You are an AI study assistant. Create multiple-choice questions from the following document content. Each MCQ should have a question, 4 options, and the correct answer index.

Document: {title}

Content:
{content}

Generate 8-10 MCQs covering the key concepts. Return as a JSON array of objects with "question", "options" (array of 4 strings), and "correctIndex" (0-3) fields. Example format:
[{"question": "What is X?", "options": ["A", "B", "C", "D"], "correctIndex": 0}]`,

  "short-notes": `You are an AI study assistant. Create concise short notes from the following document content. Focus on key definitions, important concepts, and essential takeaways.

Document: {title}

Content:
{content}

Generate well-organized short notes with bullet points and clear sections. Return as plain text with markdown formatting.`,
};

const MAX_CHARS = 25000;

export async function POST(
  request: NextRequest,
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
    const { type } = await request.json();

    if (!type || !STUDY_PROMPTS[type]) {
      return NextResponse.json({ error: "Invalid study type" }, { status: 400 });
    }

    const document = await prisma.document.findFirst({
      where: { id, userId: user.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!document.textContent || document.textContent.trim().length === 0) {
      return NextResponse.json({ error: "Document has no text content" }, { status: 400 });
    }

    const content = document.textContent.slice(0, MAX_CHARS);
    const prompt = STUDY_PROMPTS[type]
      .replace("{title}", document.title)
      .replace("{content}", content);

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    });

    const output = result.text?.trim() || "Failed to generate study content.";

    let parsedContent: Prisma.InputJsonValue;
    if (type === "short-notes") {
      parsedContent = { notes: output } as Prisma.InputJsonValue;
    } else {
      try {
        const jsonStart = output.indexOf("[");
        const jsonEnd = output.lastIndexOf("]");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          parsedContent = JSON.parse(output.slice(jsonStart, jsonEnd + 1)) as Prisma.InputJsonValue;
        } else {
          parsedContent = { raw: output } as Prisma.InputJsonValue;
        }
      } catch {
        parsedContent = { raw: output } as Prisma.InputJsonValue;
      }
    }

    const studyContent = await prisma.studyContent.create({
      data: {
        userId: user.id,
        documentId: id,
        type,
        content: parsedContent,
      },
    });

    return NextResponse.json({ studyContent });
  } catch (error) {
    console.error("[Study] Failed:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to generate study content. Please try again." },
      { status: 500 },
    );
  }
}
