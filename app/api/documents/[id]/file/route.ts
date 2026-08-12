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

  const safeFileName = (document.fileName || "download")
    .replace(/[\r\n"]/g, "_")
    .replace(/[^\x20-\x7E]/g, "_");

  const safeContentType =
    /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(document.fileType || "")
      ? document.fileType
      : "application/octet-stream";

  return new NextResponse(document.fileBlob, {
    headers: {
      "Content-Type": safeContentType,
      "Content-Disposition": `attachment; filename="${safeFileName}"`,
      "Content-Length": document.fileSize.toString(),
      "Cache-Control": "private, no-store",
    },
  });
}
