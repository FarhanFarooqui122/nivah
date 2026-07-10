import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const TEXT_TYPES = ["text/plain", "text/markdown"];
const PDF_TYPE = "application/pdf";
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function categorizeFileType(fileType: string): string {
  if (fileType === PDF_TYPE) return "PDF";
  if (fileType === DOCX_TYPE) return "DOCX";
  if (TEXT_TYPES.includes(fileType)) return "TXT/MD";
  if (IMAGE_TYPES.includes(fileType)) return "Images";
  return "Other";
}

function countWords(text: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const whereUser = { userId: user.id };

  const [totalDocuments, totalImages] = await Promise.all([
    prisma.document.count({ where: whereUser }),
    prisma.document.count({
      where: { ...whereUser, fileType: { in: IMAGE_TYPES } },
    }),
  ]);

  const fileInfos = await prisma.document.findMany({
    where: whereUser,
    select: { fileType: true, title: true, fileName: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const textDocs = await prisma.document.findMany({
    where: { ...whereUser, textContent: { not: null } },
    select: { title: true, fileName: true, fileType: true, textContent: true },
  });

  const totalWords = textDocs.reduce((sum, doc) => sum + countWords(doc.textContent), 0);

  const storageBreakdown: Record<string, number> = {};
  fileInfos.forEach((doc) => {
    const category = categorizeFileType(doc.fileType);
    storageBreakdown[category] = (storageBreakdown[category] || 0) + 1;
  });

  const mostRecentUpload = fileInfos.length > 0
    ? { title: fileInfos[0].title, fileName: fileInfos[0].fileName, createdAt: fileInfos[0].createdAt }
    : null;

  const sortedByContent = [...textDocs].sort(
    (a, b) => (b.textContent?.length || 0) - (a.textContent?.length || 0)
  );

  const largestDocument = sortedByContent.length > 0
    ? {
        title: sortedByContent[0].title,
        fileName: sortedByContent[0].fileName,
        charCount: sortedByContent[0].textContent?.length ?? 0,
      }
    : null;

  const fileTypeCounts = new Map<string, number>();
  fileInfos.forEach((doc) => {
    fileTypeCounts.set(doc.fileType, (fileTypeCounts.get(doc.fileType) || 0) + 1);
  });
  let mostCommonFileType: { fileType: string; count: number } | null = null;
  let maxCount = 0;
  fileTypeCounts.forEach((count, fileType) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonFileType = { fileType, count };
    }
  });

  const topDocuments = sortedByContent.slice(0, 5).map((doc) => ({
    title: doc.title,
    fileName: doc.fileName,
    fileType: doc.fileType,
    charCount: doc.textContent?.length ?? 0,
  }));

  return NextResponse.json({
    totalDocuments,
    totalImages,
    totalWords,
    storageBreakdown,
    mostRecentUpload,
    largestDocument,
    mostCommonFileType,
    topDocuments,
  });
}
