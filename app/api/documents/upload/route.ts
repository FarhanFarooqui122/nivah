import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { extractText } from "@/lib/extract-text";
import { chunkText } from "@/lib/chunker";
import { generateEmbedding } from "@/lib/embeddings";

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

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    const textContent = await extractText(buffer, file.type, file.name);

    const document = await prisma.document.create({
      data: {
        title,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        fileUrl,
        textContent,
        userId: user.id,
        workspaceId: workspaceId || null,
      },
    });

    if (textContent && textContent.length > 0) {
      const chunks = chunkText(textContent);

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

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}