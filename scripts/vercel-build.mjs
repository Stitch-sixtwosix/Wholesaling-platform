// Vercel build entrypoint with two modes:
//
//  1. PERSISTENT (recommended): if DATABASE_URL points at a Postgres database
//     (e.g. a free Neon database), build against it. Organizations, invites,
//     and all data persist permanently and are shared across every serverless
//     instance. This is required for registration / team invites / settings.
//
//  2. DEMO: if no Postgres DATABASE_URL is set, bundle a seeded SQLite snapshot
//     and copy it to /tmp at runtime. Great for instantly previewing the demo
//     data, but per-instance and ephemeral — user-created data does NOT persist.
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL || "";
const isPostgres = /^postgres(ql)?:\/\//.test(url);

function run(cmd, env) {
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

if (isPostgres) {
  console.log("vercel-build: PostgreSQL DATABASE_URL detected — persistent mode.");
  run("node scripts/prod-schema.mjs");
  run("prisma generate --schema prisma/schema.prod.prisma");
  run("prisma db push --schema prisma/schema.prod.prisma --skip-generate --accept-data-loss");
  // Seeds demo data only on the first deploy (the seed skips if data exists).
  run("tsx prisma/seed.ts");
  run("next build");
} else {
  console.log("vercel-build: no Postgres DATABASE_URL — bundled SQLite demo mode.");
  run("prisma generate");
  run("prisma db push --skip-generate --accept-data-loss", { DATABASE_URL: "file:./prod-seed.db" });
  run("tsx prisma/seed.ts", { DATABASE_URL: "file:./prod-seed.db", SEED_FORCE: "true" });
  run("next build");
}
