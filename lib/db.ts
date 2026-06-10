import { PrismaClient } from "@prisma/client";
import { existsSync, copyFileSync } from "node:fs";
import path from "node:path";

// On Vercel in DEMO mode (no persistent Postgres) the deployment filesystem is
// read-only except for /tmp. We ship a pre-seeded SQLite snapshot in the build
// (prisma/prod-seed.db) and copy it to /tmp on cold start, then point Prisma at
// it. When a persistent Postgres DATABASE_URL is configured instead, we use that
// directly and skip all of this.
//
// Note: /tmp is per-instance and ephemeral, so user-created data does NOT
// persist across instances. Configure a Postgres DATABASE_URL (e.g. Neon) for
// real, shared, permanent storage.
const isPostgres = /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL || "");
if (process.env.VERCEL && !isPostgres) {
  const runtimeDb = "/tmp/data.db";
  if (!existsSync(runtimeDb)) {
    const seedDb = path.join(process.cwd(), "prisma", "prod-seed.db");
    if (existsSync(seedDb)) copyFileSync(seedDb, runtimeDb);
  }
  process.env.DATABASE_URL = `file:${runtimeDb}`;
}

// Reuse the Prisma client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
