/**
 * Applies all `*.sql` files in `supabase/migrations/` in lexical order via psql.
 *
 * Requires DATABASE_URL in .env.local (from Supabase Dashboard → Connect).
 * Prefer **Session pooler** URI if direct `db.*` fails (IPv6).
 *
 * Uses **psql** when available: `supabase db query -f` cannot run multi-statement
 * files (PostgreSQL: "cannot insert multiple commands into a prepared statement").
 */
"use strict";

const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const root = path.join(__dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");

const dbUrl = (process.env.DATABASE_URL || "").trim();

function printFailureHelp() {
  console.error(`
── If the migration failed ───────────────────────────────────────────
Read the PostgreSQL error above.

• "policy … already exists" → use the latest migration file (it drops policies first), then:
    npm run db:apply

• "no route to host" / IPv6 / DNS → use Session pooler DATABASE_URL (see README).

• Install psql:  macOS \`brew install libpq && brew link --force libpq\`, or paste SQL into Dashboard → SQL Editor.

• New columns (e.g. venue_setting): run migrations after pulling; older app versions ignore unknown fields until you deploy.
──────────────────────────────────────────────────────────────────────
`);
}

function psqlAvailable() {
  const r = spawnSync("psql", ["--version"], { stdio: "pipe", encoding: "utf8" });
  return r.status === 0;
}

if (!dbUrl) {
  console.error(`
Missing DATABASE_URL in .env.local

The Data API (publishable / anon key) cannot execute DDL like CREATE TABLE or triggers.

Add your Postgres URI from the dashboard:
  1. Supabase → your project → **Connect** (top bar)
  2. Choose **Session pooler** (recommended on many home / office networks)
  3. Copy the URI and replace [YOUR-PASSWORD] with your database password
  4. In .env.local add ONE line (never commit this file):

     DATABASE_URL=postgresql://postgres...

  If your password has @, #, etc., use URL-encoded characters in the URI.

Then run:  npm run db:apply
`);
  process.exit(1);
}

if (!fs.existsSync(migrationsDir)) {
  console.error("Migrations directory not found:", migrationsDir);
  process.exit(1);
}

const sqlFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => path.join(migrationsDir, f));

if (sqlFiles.length === 0) {
  console.error("No .sql files in", migrationsDir);
  process.exit(1);
}

if (
  dbUrl.includes("db.") &&
  dbUrl.includes(".supabase.co") &&
  !dbUrl.includes("pooler.supabase.com")
) {
  console.warn(
    "\nTip: DATABASE_URL uses direct db.*.host (often IPv6-only). If this fails, switch to the Session pooler URI from Connect.\n",
  );
}

if (psqlAvailable()) {
  console.info("Applying migrations via psql (supports multi-statement SQL files)…");
  for (const sqlFile of sqlFiles) {
    console.info("→", path.basename(sqlFile));
    const psql = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlFile], {
      stdio: "inherit",
      cwd: root,
      env: process.env,
    });
    if (psql.status !== 0) {
      printFailureHelp();
      process.exit(psql.status === null ? 1 : psql.status);
    }
  }
  console.info("\nDone. Applied", sqlFiles.length, "file(s). Check Table Editor for layouts + profiles.");
  process.exit(0);
}

console.warn(
  "psql not found on PATH. Falling back to Supabase CLI (often fails on multi-statement migrations).\n" +
    "Install psql: macOS `brew install libpq` then `brew link --force libpq`, or use SQL Editor.\n",
);

for (const sqlFile of sqlFiles) {
  console.info("→", path.basename(sqlFile));
  const supabaseCli = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["--yes", "supabase@2.101.0", "db", "query", "--db-url", dbUrl, "-f", sqlFile],
    { stdio: "inherit", cwd: root, env: process.env, shell: process.platform === "win32" },
  );
  if (supabaseCli.status !== 0) {
    console.error(`
Supabase CLI error: multi-statement .sql files are not supported by "supabase db query -f"
(PostgreSQL: "cannot insert multiple commands into a prepared statement").

Install psql and run again:
  brew install libpq && brew link --force libpq
  npm run db:apply

Or paste each migration into Dashboard → SQL Editor → Run.
`);
    printFailureHelp();
    process.exit(supabaseCli.status === null ? 1 : supabaseCli.status);
  }
}

console.info("Done. Applied", sqlFiles.length, "file(s).");
process.exit(0);
