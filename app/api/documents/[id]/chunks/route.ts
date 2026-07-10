import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const chunks = await prisma.$queryRaw<{
    id: string;
    documentId: string;
    content: string;
    chunkIndex: number;
    charCount: number;
    createdAt: Date;
  }[]>`
    SELECT * FROM "DocumentChunk"
    WHERE "documentId" = ${id}
    ORDER BY "chunkIndex" ASC
  `;

  return NextResponse.json({
    documentId: id,
    totalChunks: chunks.length,
    chunks,
  });
}
