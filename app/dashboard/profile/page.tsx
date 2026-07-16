import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "@/components/ProfileClient";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const docCount = await prisma.document.count({ where: { userId: user.id } });
  const chunkCount = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM "DocumentChunk" c
    JOIN "Document" d ON d."id" = c."documentId"
    WHERE d."userId" = ${user.id}
  `;
  const sessionCount = await prisma.chatSession.count({ where: { userId: user.id } });
  const totalSize = await prisma.document.aggregate({
    where: { userId: user.id },
    _sum: { fileSize: true },
  });

  return (
    <ProfileClient
      stats={{
        documents: docCount,
        chunks: Number(chunkCount[0]?.count ?? 0),
        chatSessions: sessionCount,
        totalStorage: totalSize._sum.fileSize ?? 0,
        joinedAt: user.createdAt.toISOString(),
      }}
    />
  );
}
