// Generates prisma/schema.prod.prisma from schema.prisma with the datasource
// provider swapped to PostgreSQL. Local/Codespaces stay on SQLite while
// production (Vercel + a hosted Postgres like Neon) uses Postgres — from a
// single source of truth.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("prisma/schema.prisma", "utf8");
const out = src.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

if (out === src) {
  console.warn("prod-schema: no sqlite datasource found to swap (already postgres?).");
}
writeFileSync("prisma/schema.prod.prisma", out);
console.log("prod-schema: wrote prisma/schema.prod.prisma (postgresql).");
