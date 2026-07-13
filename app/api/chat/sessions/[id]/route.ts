import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

  const session = await prisma.chatSession.findUnique({ where: { id } });
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.chatSession.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
