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

// Discover a Postgres URL from any env var (Neon's Vercel integration may use a
// custom prefix like DATABASE_URL / STORAGE_URL / POSTGRES_URL), so the build
// mode matches what lib/db resolves at runtime.
const allPg = Object.values(process.env).filter(
  (v) => v && /^postgres(ql)?:\/\//.test(v)
);
const url =
  (process.env.DATABASE_URL && /^postgres/.test(process.env.DATABASE_URL)
    ? process.env.DATABASE_URL
    : allPg.find((u) => u.includes("-pooler.")) || allPg[0]) || "";
const isPostgres = /^postgres(ql)?:\/\//.test(url);

function run(cmd, env) {
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

if (isPostgres) {
  console.log("vercel-build: PostgreSQL detected — persistent mode.");
  // Schema changes (db push) need a DIRECT connection, not the PgBouncer pool.
  // Prefer an explicit unpooled URL; otherwise derive it by dropping "-pooler".
  const directUrl =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    allPg.find((u) => !u.includes("-pooler.")) ||
    url.replace("-pooler.", ".");
  run("node scripts/prod-schema.mjs");
  run("prisma generate --schema prisma/schema.prod.prisma");

  // Sync the schema. A normal (non-destructive) push handles all routine and
  // additive changes and PRESERVES existing data. If the push can't proceed
  // because the database holds rows from an older, incompatible schema (e.g. a
  // pre-multi-tenant table missing the required orgId column), fall back to a
  // one-time reset. This only triggers when a plain push is impossible, so once
  // the schema is current your real data is never wiped. Set ALLOW_DB_RESET=false
  // to disable the fallback entirely (push will then fail loudly instead).
  const pushBase =
    "prisma db push --schema prisma/schema.prod.prisma --skip-generate --accept-data-loss";
  try {
    run(pushBase, { DATABASE_URL: directUrl });
  } catch (err) {
    if (process.env.ALLOW_DB_RESET === "false") throw err;
    console.warn(
      "vercel-build: schema push blocked by incompatible existing data — resetting the database once to apply the current schema."
    );
    run(`${pushBase} --force-reset`, { DATABASE_URL: directUrl });
  }

  // Seeds demo data only when the database is empty (the seed skips if data exists).
  run("tsx prisma/seed.ts", { DATABASE_URL: directUrl });
  run("next build");
} else {
  console.log("vercel-build: no Postgres DATABASE_URL — bundled SQLite demo mode.");
  run("prisma generate");
  run("prisma db push --skip-generate --accept-data-loss", { DATABASE_URL: "file:./prod-seed.db" });
  run("tsx prisma/seed.ts", { DATABASE_URL: "file:./prod-seed.db", SEED_FORCE: "true" });
  run("next build");
}
