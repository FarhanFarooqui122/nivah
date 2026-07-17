import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { emailNotifications, autoSyncAiMemory } = await request.json();

  const data: Record<string, boolean> = {};
  if (typeof emailNotifications === "boolean") data.emailNotifications = emailNotifications;
  if (typeof autoSyncAiMemory === "boolean") data.autoSyncAiMemory = autoSyncAiMemory;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data,
  });

  return NextResponse.json({ success: true });
}
