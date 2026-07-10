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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
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
      },
    });

    if (textContent && textContent.length > 0) {
      const chunks = chunkText(textContent);
      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.content);
        if (embedding) {
          await prisma.$executeRaw`
            INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "charCount", "embedding", "createdAt")
            VALUES (${`chunk_${document.id}_${chunk.chunkIndex}`}, ${document.id}, ${chunk.content}, ${chunk.chunkIndex}, ${chunk.charCount}, ${JSON.stringify(embedding)}::jsonb, NOW())
          `;
        } else {
          await prisma.$executeRaw`
            INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "charCount", "createdAt")
            VALUES (${`chunk_${document.id}_${chunk.chunkIndex}`}, ${document.id}, ${chunk.content}, ${chunk.chunkIndex}, ${chunk.charCount}, NOW())
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