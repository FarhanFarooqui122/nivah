import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message?: string | null,
  link?: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.emailNotifications) return;

  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
    },
  });
}
