import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString,
  });
  return new PrismaClient({
    adapter,
  });
};

export const prisma =
  globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}