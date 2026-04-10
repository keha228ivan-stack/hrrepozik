import { createRequire } from "node:module";
import { addFallbackManager, findFallbackManagerByEmail, findFallbackManagerById } from "@/server/fallback-store";

type UserRecord = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "MANAGER" | "EMPLOYEE";
};

type DbUserApi = {
  findUnique(args: { where: { id?: string; email?: string } }): Promise<UserRecord | null>;
  create(args: { data: Omit<UserRecord, "id"> }): Promise<UserRecord>;
};

type DbShape = {
  user: DbUserApi;
};
type UnsafeDb = DbShape & Record<string, unknown>;

const require = createRequire(import.meta.url);

function createFallbackDb(): DbShape {
  return {
    user: {
      async findUnique({ where }) {
        if (where.id) {
          return findFallbackManagerById(where.id);
        }
        if (where.email) {
          return findFallbackManagerByEmail(where.email);
        }
        return null;
      },
      async create({ data }) {
        const created = addFallbackManager({
          fullName: data.fullName,
          email: data.email,
          passwordHash: data.passwordHash,
        });
        if (!created) {
          const error = new Error("Unique constraint failed");
          (error as Error & { code?: string }).code = "P2002";
          throw error;
        }
        return created;
      },
    },
  };
}

function createDb(): DbShape {
  try {
    const { PrismaClient } = require("@prisma/client") as { PrismaClient: new (args: unknown) => { user: DbUserApi } };
    const globalForPrisma = globalThis as unknown as { prisma?: { user: DbUserApi } };
    const prisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prisma;
    }

    return prisma as unknown as DbShape;
  } catch (error) {
    console.warn("Prisma client is unavailable, using fallback auth store.", error);
    return createFallbackDb();
  }
}

export const db = createDb() as UnsafeDb;
