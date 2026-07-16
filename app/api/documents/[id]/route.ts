import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.userId !== user.id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, workspaceId } = body;

  const data: Record<string, unknown> = {};

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    data.title = title.trim();
  }

  if (workspaceId !== undefined) {
    if (workspaceId === null) {
      data.workspaceId = null;
    } else {
      const workspace = await prisma.workspace.findFirst({
        where: { id: workspaceId, userId: user.id },
      });
      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      data.workspaceId = workspaceId;
    }
  }

  const updated = await prisma.document.update({
    where: { id },
    data,
  });

  return NextResponse.json({ document: updated });
}
