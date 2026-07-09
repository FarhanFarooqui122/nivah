import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let documentIds: string[];
  try {
    const body = await request.json();
    documentIds = body.documentIds;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return NextResponse.json({ error: "No documents selected" }, { status: 400 });
  }

  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      fileType: true,
      textContent: true,
      createdAt: true,
    },
  });

  if (documents.length !== documentIds.length) {
    return NextResponse.json({ error: "One or more documents not found" }, { status: 404 });
  }

  const docMap = new Map(documents.map((d) => [d.id, d]));
  const ordered = documentIds.map((id) => docMap.get(id)).filter((d): d is NonNullable<typeof d> => d !== undefined);

  const parts = ordered.map((doc) => {
    const date = new Date(doc.createdAt).toISOString().split("T")[0];
    const type = doc.fileType.split("/").pop()?.toUpperCase() || "FILE";
    const text = doc.textContent?.trim() || "No text content available.";
    return `# ${doc.title}\n\nType: ${type}\nCreated: ${date}\n\n---\n\n${text}\n\n---`;
  });

  const markdown = parts.join("\n\n");

  return NextResponse.json({ markdown });
}