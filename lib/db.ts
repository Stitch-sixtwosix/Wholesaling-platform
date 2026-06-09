import { PrismaClient } from "@prisma/client";
import { existsSync, copyFileSync } from "node:fs";
import path from "node:path";

// On Vercel (and similar serverless platforms) the deployment filesystem is
// read-only except for /tmp. We ship a pre-seeded SQLite snapshot in the build
// (prisma/prod-seed.db) and copy it to /tmp on cold start, then point Prisma at
// it. This lets the app run a working public deployment with ZERO external
// database setup — no Neon/Postgres, no env vars required.
//
// Note: /tmp is per-instance and ephemeral, so writes persist for the life of a
// warm serverless instance but reset to the seeded snapshot over time. Great for
// a live demo / first deploy; wire up a persistent DATABASE_URL later if needed.
if (process.env.VERCEL) {
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
