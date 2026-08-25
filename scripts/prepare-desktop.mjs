// Prepara src-tauri/resources antes de `tauri build`/`tauri dev`:
// copia el build standalone de Next.js, descarga node.exe si falta y genera
// una BBDD plantilla con las migraciones aplicadas (sin datos ni credenciales).
import { existsSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tauriDir = join(root, "src-tauri");
const resourcesDir = join(tauriDir, "resources");
const nodeDir = join(resourcesDir, "node");
const appDir = join(resourcesDir, "app");
const nodeExe = join(nodeDir, "node.exe");

const NODE_VERSION = process.version.replace(/^v/, "");

console.log("[1/4] Copiando build standalone de Next.js...");
const standaloneDir = join(root, ".next", "standalone");
if (!existsSync(standaloneDir)) {
  throw new Error("Falta .next/standalone — ejecuta `npm run build` primero.");
}
rmSync(appDir, { recursive: true, force: true });
mkdirSync(appDir, { recursive: true });
cpSync(standaloneDir, appDir, { recursive: true });
cpSync(join(root, ".next", "static"), join(appDir, ".next", "static"), { recursive: true });
cpSync(join(root, "public"), join(appDir, "public"), { recursive: true });

// Next copia .env/.env.production al build standalone — nunca deben distribuirse
// (rutas/config personales); el lanzador de Tauri fija las env vars que hacen falta.
for (const envFile of [".env", ".env.local", ".env.production", ".env.production.local"]) {
  rmSync(join(appDir, envFile), { force: true });
}

cpSync(join(root, "scripts", "migrate-runtime.cjs"), join(appDir, "migrate-runtime.cjs"));

console.log("[1.5/4] Copiando migraciones de Prisma (para BBDDs ya existentes)...");
const migrationsResourceDir = join(resourcesDir, "migrations");
rmSync(migrationsResourceDir, { recursive: true, force: true });
cpSync(join(root, "prisma", "migrations"), migrationsResourceDir, { recursive: true });

console.log("[2/4] Verificando node.exe empaquetado...");
if (!existsSync(nodeExe)) {
  console.log(`  node.exe no encontrado, descargando v${NODE_VERSION}...`);
  const zipUrl = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip`;
  const tmpZip = join(resourcesDir, "_node.zip");
  execFileSync("curl", ["-sL", zipUrl, "-o", tmpZip], { stdio: "inherit" });
  const tmpExtract = join(resourcesDir, "_node_extract");
  rmSync(tmpExtract, { recursive: true, force: true });
  execFileSync("powershell", [
    "-NoProfile", "-Command",
    `Expand-Archive -Path "${tmpZip}" -DestinationPath "${tmpExtract}" -Force`,
  ], { stdio: "inherit" });
  mkdirSync(nodeDir, { recursive: true });
  cpSync(join(tmpExtract, `node-v${NODE_VERSION}-win-x64`, "node.exe"), nodeExe);
  cpSync(join(tmpExtract, `node-v${NODE_VERSION}-win-x64`, "LICENSE"), join(nodeDir, "LICENSE"));
  rmSync(tmpZip, { force: true });
  rmSync(tmpExtract, { recursive: true, force: true });
} else {
  console.log("  ya presente, se reutiliza.");
}

console.log("[4/4] Generando BBDD plantilla (migraciones aplicadas, sin datos)...");
const templateDb = join(resourcesDir, "template.db");
rmSync(templateDb, { force: true });
const npxArgs = ["prisma", "migrate", "deploy"];
if (process.platform === "win32") {
  execFileSync("cmd.exe", ["/c", "npx", ...npxArgs], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: `file:${templateDb}` },
    stdio: "inherit",
  });
} else {
  execFileSync("npx", npxArgs, {
    cwd: root,
    env: { ...process.env, DATABASE_URL: `file:${templateDb}` },
    stdio: "inherit",
  });
}

console.log("Listo. Recursos de escritorio preparados en src-tauri/resources.");
