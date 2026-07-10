import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SemanticSearchClient } from "@/components/SemanticSearchClient";

export default async function SemanticSearchPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  return <SemanticSearchClient documents={documents} />;
}
