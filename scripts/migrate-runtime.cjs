// Aplica migraciones de Prisma pendientes contra una BBDD SQLite ya existente
// (la del usuario en %APPDATA%), sin depender del CLI de Prisma. Se ejecuta
// una vez al arrancar el .exe, antes del servidor Next.js — ver src-tauri/src/lib.rs.
//
// Usa la misma tabla `_prisma_migrations` que `prisma migrate deploy`, así
// que sigue siendo compatible si algún día se corre el CLI real contra esta
// BBDD (por ejemplo, copiándola de vuelta al proyecto para depurar).
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const dbPath = process.argv[2];
const migrationsDir = process.argv[3];

if (!dbPath || !migrationsDir) {
  console.error("uso: migrate-runtime.cjs <db-path> <migrations-dir>");
  process.exit(1);
}

const Database = require("better-sqlite3");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
  );
`);

const applied = new Set(
  db.prepare('SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL').all()
    .map((r) => r.migration_name)
);

const pending = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort()
  .filter((name) => !applied.has(name));

if (pending.length === 0) {
  console.log("[migrate] BBDD al día, nada que aplicar.");
  process.exit(0);
}

for (const name of pending) {
  const sqlPath = path.join(migrationsDir, name, "migration.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const checksum = crypto.createHash("sha256").update(sql).digest("hex");
  console.log(`[migrate] aplicando ${name}...`);

  const applyAll = db.transaction(() => {
    db.exec(sql);
    db.prepare(
      `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
       VALUES (?, ?, datetime('now'), ?, datetime('now'), 1)`
    ).run(crypto.randomUUID(), checksum, name);
  });
  applyAll();
}

console.log(`[migrate] ${pending.length} migración(es) aplicada(s).`);
