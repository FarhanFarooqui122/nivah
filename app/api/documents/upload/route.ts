import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/extract-text";
import { chunkText } from "@/lib/chunker";
import { generateEmbedding } from "@/lib/embeddings";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || file?.name?.replace(/\.[^/.]+$/, "") || "Untitled";
    const workspaceId = formData.get("workspaceId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    if (workspaceId) {
      const workspace = await prisma.workspace.findFirst({
        where: { id: workspaceId, userId: user.id },
      });
      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const textContent = await extractText(buffer, file.type, file.name);

    const document = await prisma.document.create({
      data: {
        title,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        fileUrl: "",
        fileBlob: buffer,
        textContent,
        userId: user.id,
        workspaceId: workspaceId || null,
      },
    });

    await prisma.document.update({
      where: { id: document.id },
      data: { fileUrl: `/api/documents/${document.id}/file` },
    });
    document.fileUrl = `/api/documents/${document.id}/file`;

    let chunkCount = 0;
    if (textContent && textContent.length > 0) {
      const chunks = chunkText(textContent);
      chunkCount = chunks.length;

      const embeddings = await Promise.all(
        chunks.map((chunk) => generateEmbedding(chunk.content))
      );

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        const id = `chunk_${document.id}_${chunk.chunkIndex}`;
        if (embedding) {
          await prisma.$executeRaw`
            INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "charCount", "embedding", "createdAt")
            VALUES (${id}, ${document.id}, ${chunk.content}, ${chunk.chunkIndex}, ${chunk.charCount}, ${JSON.stringify(embedding)}::jsonb, NOW())
          `;
        } else {
          await prisma.$executeRaw`
            INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "charCount", "createdAt")
            VALUES (${id}, ${document.id}, ${chunk.content}, ${chunk.chunkIndex}, ${chunk.charCount}, NOW())
          `;
        }
      }
    }

    await createNotification(
      user.id,
      "upload_complete",
      `"${document.title}" uploaded`,
      `Successfully uploaded and indexed ${chunkCount} chunks`,
      `/dashboard/documents/${document.id}`
    );

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}