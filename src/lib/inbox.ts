import { prisma } from "@/lib/prisma";
import type { Priority, Section } from "@/generated/prisma/client";
import { getSettings, SECTION_KEYS } from "@/lib/settings";
import { insertTask } from "@/lib/tasks";

/** Lo que el buzón devuelve: exactamente lo que mandó el atajo, sin interpretar. */
type InboxItem = {
  id: string;
  receivedAt: string;
  title: string;
  section: string | null;
  priority: string | null;
  due: string | null;
};

export type InboxSyncResult =
  | { status: "off" }
  | { status: "ok"; imported: number }
  | { status: "error"; error: string };

const TIMEOUT_MS = 10_000;

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/** Acepta la clave interna (STUDY/ARUS/PERSONAL) o el nombre que la persona
 * le haya puesto a la sección en Ajustes, sin importar mayúsculas ni tildes:
 * el menú del atajo enseña nombres, no claves. */
function resolverSeccion(valor: string | null, nombres: Record<Section, string>): Section {
  if (valor) {
    const v = normalizar(valor);
    for (const key of SECTION_KEYS) {
      if (normalizar(key) === v || normalizar(nombres[key]) === v) return key;
    }
  }
  return "PERSONAL";
}

function resolverPrioridad(valor: string | null): Priority {
  const v = valor ? normalizar(valor) : "";
  if (v === "high" || v === "alta") return "HIGH";
  if (v === "low" || v === "baja") return "LOW";
  return "MEDIUM";
}

/** Fecha límite: vacía, "hoy"/"mañana", "AAAA-MM-DD" (sin hora) o ISO con
 * hora (lo que da "Formatear fecha → ISO 8601" en Atajos). Si no se entiende,
 * la tarea entra sin fecha en vez de perderse. */
export function resolverFecha(valor: string | null, ahora = new Date()): { date: Date; hasTime: boolean } | null {
  if (!valor) return null;
  const v = normalizar(valor);
  const dia = (offset: number) => {
    const d = new Date(ahora);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return { date: d, hasTime: false };
  };
  if (v === "sin fecha" || v === "none") return null;
  if (v === "hoy" || v === "today") return dia(0);
  if (v === "manana" || v === "tomorrow") return dia(1);
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return { date: new Date(`${v}T00:00`), hasTime: false };
  }
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  return { date: d, hasTime: d.getHours() !== 0 || d.getMinutes() !== 0 };
}

function esDuplicado(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

async function llamar(url: string, token: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("El buzón rechaza el token: revisa que sea el mismo en Ajustes y en Cloudflare.");
  if (!res.ok) throw new Error(`El buzón respondió ${res.status}.`);
  return res.json();
}

let enCurso: Promise<InboxSyncResult> | null = null;

/**
 * Recoge las tareas del buzón del móvil y las mete en la BBDD local.
 *
 * Orden importante: primero se guarda aquí, después se confirma al buzón
 * (que entonces las borra). Si la app se cierra entre medias, la tarea sigue
 * en el buzón y vuelve a llegar; `Task.inboxId` es único, así que esa segunda
 * vez se detecta como ya importada y solo se confirma.
 *
 * Si se llama otra vez mientras hay una recogida en marcha (foco + intervalo
 * a la vez), se reutiliza la que ya está corriendo.
 */
export function syncMobileInbox(): Promise<InboxSyncResult> {
  enCurso ??= recoger().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

async function recoger(): Promise<InboxSyncResult> {
  const config = await prisma.mobileInboxConfig.findUnique({ where: { id: 1 } });
  if (!config?.url || !config.token) return { status: "off" };

  const base = config.url.replace(/\/+$/, "");
  try {
    const { tasks } = (await llamar(`${base}/tasks`, config.token)) as { tasks: InboxItem[] };

    let imported = 0;
    const confirmar: string[] = [];
    if (tasks.length > 0) {
      const { sections } = await getSettings();
      const nombres = Object.fromEntries(SECTION_KEYS.map((k) => [k, sections[k].label])) as Record<Section, string>;

      for (const item of tasks) {
        if (await prisma.task.findUnique({ where: { inboxId: item.id }, select: { id: true } })) {
          confirmar.push(item.id);
          continue;
        }
        try {
          await insertTask({
            title: item.title,
            section: resolverSeccion(item.section, nombres),
            priority: resolverPrioridad(item.priority),
            due: resolverFecha(item.due),
            inboxId: item.id,
          });
          imported++;
          confirmar.push(item.id);
        } catch (e) {
          if (esDuplicado(e)) confirmar.push(item.id);
          else console.error("[buzón] no se pudo guardar una tarea, se reintentará:", e);
        }
      }

      if (confirmar.length > 0) {
        await llamar(`${base}/tasks/ack`, config.token, { method: "POST", body: JSON.stringify({ ids: confirmar }) });
      }
    }

    await prisma.mobileInboxConfig.update({ where: { id: 1 }, data: { lastSyncAt: new Date(), lastError: null } });
    return { status: "ok", imported };
  } catch (e) {
    // fetch lanza un TypeError genérico ("fetch failed") si no hay red o el
    // servidor no existe; se traduce para que en Ajustes se entienda.
    const error =
      e instanceof Error && e.name === "TimeoutError"
        ? "El buzón no responde (¿sin conexión?)."
        : e instanceof TypeError
          ? "No se puede conectar con el buzón (¿sin conexión o URL incorrecta?)."
          : e instanceof Error
            ? e.message
            : String(e);
    await prisma.mobileInboxConfig.update({ where: { id: 1 }, data: { lastError: error } });
    return { status: "error", error };
  }
}
