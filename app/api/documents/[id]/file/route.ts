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

  if (!document.fileBlob) {
    return NextResponse.json({ error: "File data not available" }, { status: 404 });
  }

  return new NextResponse(document.fileBlob, {
    headers: {
      "Content-Type": document.fileType,
      "Content-Disposition": `attachment; filename="${document.fileName}"`,
      "Content-Length": document.fileSize.toString(),
    },
  });
}
