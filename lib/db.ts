import { PrismaClient } from "@prisma/client";
import { existsSync, copyFileSync } from "node:fs";
import path from "node:path";

// Resolve the database connection across environments.
//
// - Local/dev: DATABASE_URL from .env (SQLite file).
// - Vercel + Neon (persistent): the integration may expose the Postgres URL
//   under a custom-prefixed name (e.g. DATABASE_URL, STORAGE_URL, POSTGRES_URL).
//   We auto-discover it so configuration "just works" regardless of the prefix.
// - Vercel demo (no Postgres): copy the bundled seeded SQLite snapshot to /tmp
//   (the only writable dir). Per-instance & ephemeral — not for real data.
function discoverPostgresUrl(): string | undefined {
  const direct = process.env.DATABASE_URL;
  if (direct && /^postgres(ql)?:\/\//.test(direct)) return direct;
  const urls = Object.values(process.env).filter(
    (v): v is string => !!v && /^postgres(ql)?:\/\//.test(v)
  );
  if (urls.length === 0) return undefined;
  // Prefer a pooled connection (host contains "-pooler") for serverless runtime.
  return urls.find((u) => u.includes("-pooler.")) ?? urls[0];
}

const pgUrl = discoverPostgresUrl();
if (pgUrl) {
  let url = pgUrl;
  // Neon's pooled endpoint runs PgBouncer in transaction mode, which needs
  // pgbouncer=true so Prisma doesn't use prepared statements.
  if (url.includes("-pooler.") && !/[?&]pgbouncer=true/.test(url)) {
    url += (url.includes("?") ? "&" : "?") + "pgbouncer=true";
  }
  process.env.DATABASE_URL = url;
} else if (process.env.VERCEL) {
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
