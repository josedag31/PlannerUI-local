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

// Copia de seguridad antes de tocar nada. Solo se hace cuando hay migraciones
// pendientes: es el único momento en que el esquema cambia y, por tanto, el
// único con riesgo real. Si la copia falla no se migra — es preferible que la
// app se queje a modificar la BBDD del usuario sin marcha atrás.
const BACKUPS_TO_KEEP = 5;
const backupsDir = path.join(path.dirname(dbPath), "backups");

try {
  fs.mkdirSync(backupsDir, { recursive: true });

  // Hora local, no UTC: así el nombre del fichero cuadra con la fecha que se ve
  // en el explorador de Windows.
  const now = new Date();
  const p2 = (n) => String(n).padStart(2, "0");
  const stamp =
    `${now.getFullYear()}${p2(now.getMonth() + 1)}${p2(now.getDate())}` +
    `-${p2(now.getHours())}${p2(now.getMinutes())}${p2(now.getSeconds())}`;
  const backupPath = path.join(backupsDir, `dev-${stamp}.db`);

  // `VACUUM INTO` escribe una copia consistente en un solo fichero, incluyendo
  // lo que hubiera en el WAL. Copiar el .db a pelo puede dejar fuera esos
  // cambios y dar una copia corrupta.
  db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);
  console.log(`[migrate] copia de seguridad en ${backupPath}`);

  // Se conservan solo las más recientes: son copias completas y el objetivo es
  // poder deshacer una actualización reciente, no guardar un histórico.
  const old = fs
    .readdirSync(backupsDir)
    .filter((f) => /^dev-\d{8}-\d{6}\.db$/.test(f))
    .sort()
    .slice(0, -BACKUPS_TO_KEEP);
  for (const f of old) {
    fs.rmSync(path.join(backupsDir, f), { force: true });
  }
  if (old.length > 0) {
    console.log(`[migrate] ${old.length} copia(s) antigua(s) eliminada(s).`);
  }
} catch (err) {
  console.error(
    `[migrate] no se pudo crear la copia de seguridad (${err instanceof Error ? err.message : err}) — ` +
      `no se aplica ninguna migración para no tocar la BBDD sin respaldo.`
  );
  process.exit(1);
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
