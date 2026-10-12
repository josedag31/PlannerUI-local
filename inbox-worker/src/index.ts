/**
 * Buzón del móvil para Locked In Planner.
 *
 * Los atajos del iPhone dejan aquí tareas (POST /tasks) y eventos (POST
 * /events) aunque el portátil esté apagado. La app, al arrancar y cada poco
 * mientras está abierta, los recoge (GET /tasks, GET /events), los guarda en
 * su SQLite local y confirma (POST /tasks/ack, /events/ack), y solo entonces
 * se borran de aquí. La BBDD de verdad sigue siendo la del portátil: esto es
 * solo una sala de espera.
 *
 * El buzón apenas interpreta nada (secciones, prioridades): guarda lo que
 * llega y lo devuelve tal cual. Quien sabe cómo se llaman las secciones de
 * cada persona es la app. Lo único que valida es lo que haría inútil el
 * envío (sin título, evento sin fecha), para que el fallo se vea en el móvil.
 *
 * Tareas y eventos van en la misma tabla, distinguidos por `kind` dentro del
 * JSON. Lo guardado antes de existir los eventos no tiene `kind` y cuenta como
 * tarea. GET /tasks devuelve SOLO tareas: así una app antigua (que solo conoce
 * /tasks) nunca convierte un evento en tarea; los eventos esperan aquí hasta
 * que se actualice.
 */

export interface Env {
  DB: D1Database;
  INBOX_TOKEN: string;
}

type Kind = "task" | "event";

const MAX_TITULO = 500;
const MAX_CAMPO = 100;
/** Tope de cosas en espera: si alguien consiguiera el token, no podría llenar
 * la base gratuita. Con uso normal no se acerca ni de lejos. */
const MAX_PENDIENTES = 500;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

/** Error con `mensaje` además de `error`: el atajo enseña `mensaje` en la
 * notificación, así que un fallo se ve como fallo en vez de salir vacía. */
const fallo = (error: string, status: number) =>
  json({ ok: false, error, mensaje: `✕ No se ha añadido: ${error}` }, status);

async function autorizado(req: Request, env: Env): Promise<boolean> {
  if (!env.INBOX_TOKEN) return false;
  const cabecera = req.headers.get("authorization") ?? "";
  const recibido = cabecera.startsWith("Bearer ") ? cabecera.slice(7).trim() : "";
  const a = new TextEncoder().encode(recibido);
  const b = new TextEncoder().encode(env.INBOX_TOKEN);
  // Comparación en tiempo constante: no revela por cuántos caracteres falla.
  return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b);
}

function campo(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s.slice(0, MAX_CAMPO) : null;
}

/** Lo que la app sabe convertir en fecha: hoy/mañana, AAAA-MM-DD o ISO 8601. */
function fechaValida(s: string): boolean {
  const v = s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  if (["hoy", "today", "manana", "tomorrow"].includes(v)) return true;
  return !Number.isNaN(Date.parse(s));
}

async function leerCuerpo(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function guardar(env: Env, payload: Record<string, unknown>): Promise<string | Response> {
  const { n } = (await env.DB.prepare("SELECT COUNT(*) AS n FROM pending").first<{ n: number }>()) ?? { n: 0 };
  if (n >= MAX_PENDIENTES) return fallo("El buzón está lleno: abre el planner para vaciarlo.", 429);

  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO pending (id, payload, received_at) VALUES (?, ?, ?)")
    .bind(id, JSON.stringify(payload), new Date().toISOString())
    .run();
  return id;
}

async function crearTarea(req: Request, env: Env): Promise<Response> {
  const body = await leerCuerpo(req);
  if (!body) return fallo("El cuerpo tiene que ser JSON.", 400);

  const titulo = typeof body.title === "string" ? body.title.trim() : "";
  if (!titulo) return fallo("Falta el título de la tarea.", 400);

  const payload = {
    kind: "task",
    title: titulo.slice(0, MAX_TITULO),
    section: campo(body.section),
    priority: campo(body.priority),
    due: campo(body.due),
  };
  const id = await guardar(env, payload);
  if (id instanceof Response) return id;
  return json({ ok: true, id, mensaje: `Añadida: ${payload.title}` }, 201);
}

async function crearEvento(req: Request, env: Env): Promise<Response> {
  const body = await leerCuerpo(req);
  if (!body) return fallo("El cuerpo tiene que ser JSON.", 400);

  const titulo = typeof body.title === "string" ? body.title.trim() : "";
  if (!titulo) return fallo("Falta el título del evento.", 400);
  const inicio = campo(body.start);
  if (!inicio) return fallo("Falta la fecha del evento.", 400);
  if (!fechaValida(inicio)) return fallo(`No entiendo la fecha "${inicio}".`, 400);

  const payload = {
    kind: "event",
    title: titulo.slice(0, MAX_TITULO),
    section: campo(body.section),
    start: inicio,
    duration: campo(body.duration),
  };
  const id = await guardar(env, payload);
  if (id instanceof Response) return id;
  return json({ ok: true, id, mensaje: `Evento añadido: ${payload.title}` }, 201);
}

async function listar(env: Env, kind: Kind): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT id, payload, received_at FROM pending " +
      "WHERE coalesce(json_extract(payload, '$.kind'), 'task') = ? ORDER BY received_at LIMIT 200"
  )
    .bind(kind)
    .all<{ id: string; payload: string; received_at: string }>();
  const items = results.map((r) => ({ id: r.id, receivedAt: r.received_at, ...JSON.parse(r.payload) }));
  return json(kind === "task" ? { tasks: items } : { events: items });
}

async function confirmar(req: Request, env: Env): Promise<Response> {
  const body = await leerCuerpo(req);
  const ids = body?.ids;
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === "string") || ids.length > 200) {
    return fallo("ids tiene que ser una lista de textos (máx. 200).", 400);
  }
  if (ids.length === 0) return json({ ok: true, deleted: 0 });

  const huecos = ids.map(() => "?").join(",");
  const res = await env.DB.prepare(`DELETE FROM pending WHERE id IN (${huecos})`).bind(...ids).run();
  return json({ ok: true, deleted: res.meta.changes ?? 0 });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);

    // Sin token: solo para comprobar que el despliegue responde.
    if (pathname === "/" || pathname === "/health") return json({ ok: true, servicio: "planner-inbox" });

    if (!(await autorizado(req, env))) return fallo("Token incorrecto.", 401);

    if (pathname === "/tasks" && req.method === "POST") return crearTarea(req, env);
    if (pathname === "/tasks" && req.method === "GET") return listar(env, "task");
    if (pathname === "/events" && req.method === "POST") return crearEvento(req, env);
    if (pathname === "/events" && req.method === "GET") return listar(env, "event");
    // Los ids son únicos en toda la tabla: las dos rutas borran igual.
    if ((pathname === "/tasks/ack" || pathname === "/events/ack") && req.method === "POST") {
      return confirmar(req, env);
    }

    return fallo("No existe.", 404);
  },
} satisfies ExportedHandler<Env>;
