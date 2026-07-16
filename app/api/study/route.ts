import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = { userId: user.id };
  if (documentId) where.documentId = documentId;
  if (type) where.type = type;

  const content = await prisma.studyContent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, content: true, createdAt: true, documentId: true },
  });

  return NextResponse.json({ content });
}
