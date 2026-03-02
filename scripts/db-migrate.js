/**
 * Run all schema migrations using the same Postgres as the app (POSTGRES_URL from .env.local).
 * Use this for Supabase or any remote Postgres so policy_packs and other base tables exist.
 * Usage: node scripts/db-migrate.js  (or pnpm run db:migrate if script is wired)
 * Run from project root.
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim().replace(/\r$/, "");
      const value = m[2].trim().replace(/\r$/, "").replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnvLocal();

const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!postgresUrl) {
  console.error("Missing POSTGRES_URL in .env.local");
  console.error("Add a line: POSTGRES_URL=postgresql://... (Supabase: Dashboard → Project Settings → Database → Connection string)");
  process.exit(1);
}

const migrations = [
  "001-create-tables.sql",
  "002-seed-execution-targets.sql",
  "003-command-center.sql",
  "004-command-center-results.sql",
  "005-review-queue-cases.sql",
  "006-review-queue-cases-name.sql",
  "007-review-queue-cases-policy-pack-id.sql",
];

async function run() {
  const pool = new Pool({ connectionString: postgresUrl });
  try {
    for (const name of migrations) {
      const filePath = path.join(__dirname, name);
      if (!fs.existsSync(filePath)) {
        console.warn("Skip (not found):", name);
        continue;
      }
      const sql = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      await pool.query(sql);
    }
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
