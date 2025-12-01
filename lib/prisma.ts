// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// En desarrollo, guardar en global para evitar múltiples instancias con hot reload
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
