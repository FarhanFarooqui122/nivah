import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/embeddings";
import { NextRequest, NextResponse } from "next/server";

const ACTION_PROMPTS: Record<string, string> = {
  summarize: `You are an AI assistant. Summarize the following documents together as a combined summary. Identify common themes, key points, and overall significance.

Documents:

{documentContext}

Provide a comprehensive combined summary (3-5 paragraphs) that covers all documents.`,

  compare: `You are an AI assistant. Compare and contrast the following documents. Identify similarities, differences, unique insights, and relationships between them.

Documents:

{documentContext}

Provide a structured comparison covering:
1. Overview of each document
2. Common themes and similarities
3. Key differences
4. Unique insights from each
5. Overall relationship and connections`,

  "extract-key-points": `You are an AI assistant. Extract the key points and main ideas from the following documents.

Documents:

{documentContext}

Provide a bullet-point summary of the most important key points across all documents, organized by document.`,

  "study-notes": `You are an AI assistant. Generate comprehensive study notes from the following documents. Focus on important concepts, definitions, and key takeaways.

Documents:

{documentContext}

Provide well-organized study notes with sections, bullet points, and clear explanations.`,

  faq: `You are an AI assistant. Generate a comprehensive FAQ (Frequently Asked Questions) based on the following documents. Create questions that someone reading these documents would likely ask, and provide clear answers.

Documents:

{documentContext}

Generate 10-15 FAQ items covering the most important topics across all documents.`,
};

const MAX_CHARS_PER_DOC = 8000;

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

    const { action, documentIds } = await request.json();

    if (!action || !ACTION_PROMPTS[action]) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "No documents selected" }, { status: 400 });
    }

    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        userId: user.id,
      },
      select: { id: true, title: true, textContent: true },
    });

    if (documents.length === 0) {
      return NextResponse.json({ error: "No documents found" }, { status: 404 });
    }

    const docMap = new Map(documents.map((d) => [d.id, d]));
    const ordered = documentIds
      .map((id: string) => docMap.get(id))
      .filter((d): d is NonNullable<typeof d> => d !== undefined);

    const contextParts = ordered.map((doc) => {
      const content = (doc.textContent || "No text content.").slice(0, MAX_CHARS_PER_DOC);
      return `Document: ${doc.title}\n\n${content}`;
    });

    const documentContext = contextParts.join("\n\n---\n\n");

    const promptTemplate = ACTION_PROMPTS[action];
    const prompt = promptTemplate.replace("{documentContext}", documentContext);

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    const output = result.text?.trim() || "Failed to generate output.";

    return NextResponse.json({ output });
  } catch (error) {
    console.error("[AI Actions] Failed:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to process AI action. Please try again." },
      { status: 500 },
    );
  }
}
