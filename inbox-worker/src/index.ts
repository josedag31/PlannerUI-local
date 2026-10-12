/**
 * Buzón del móvil para Locked In Planner.
 *
 * El atajo del iPhone deja aquí las tareas (POST /tasks) aunque el portátil
 * esté apagado. La app, al arrancar y cada poco mientras está abierta, las
 * recoge (GET /tasks), las guarda en su SQLite local y confirma (POST
 * /tasks/ack), y solo entonces se borran de aquí. La BBDD de verdad sigue
 * siendo la del portátil: esto es solo una sala de espera.
 *
 * El buzón no interpreta nada (secciones, fechas, prioridades): guarda lo que
 * llega y lo devuelve tal cual. Quien sabe cómo se llaman las secciones de
 * cada persona es la app.
 */

export interface Env {
  DB: D1Database;
  INBOX_TOKEN: string;
}

const MAX_TITULO = 500;
const MAX_CAMPO = 100;
/** Tope de tareas en espera: si alguien consiguiera el token, no podría
 * llenar la base gratuita. Con uso normal no se acerca ni de lejos. */
const MAX_PENDIENTES = 500;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

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

async function crearTarea(req: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "El cuerpo tiene que ser JSON." }, 400);
  }

  const titulo = typeof body.title === "string" ? body.title.trim() : "";
  if (!titulo) return json({ ok: false, error: "Falta el título de la tarea." }, 400);

  const { n } = (await env.DB.prepare("SELECT COUNT(*) AS n FROM pending").first<{ n: number }>()) ?? { n: 0 };
  if (n >= MAX_PENDIENTES) {
    return json({ ok: false, error: "El buzón está lleno: abre el planner para vaciarlo." }, 429);
  }

  const payload = {
    title: titulo.slice(0, MAX_TITULO),
    section: campo(body.section),
    priority: campo(body.priority),
    due: campo(body.due),
  };
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO pending (id, payload, received_at) VALUES (?, ?, ?)")
    .bind(id, JSON.stringify(payload), new Date().toISOString())
    .run();

  return json({ ok: true, id, mensaje: `Añadida: ${payload.title}` }, 201);
}

async function listarPendientes(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT id, payload, received_at FROM pending ORDER BY received_at LIMIT 200"
  ).all<{ id: string; payload: string; received_at: string }>();
  return json({
    tasks: results.map((r) => ({ id: r.id, receivedAt: r.received_at, ...JSON.parse(r.payload) })),
  });
}

async function confirmar(req: Request, env: Env): Promise<Response> {
  let ids: unknown;
  try {
    ({ ids } = await req.json<{ ids: unknown }>());
  } catch {
    return json({ ok: false, error: "El cuerpo tiene que ser JSON." }, 400);
  }
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === "string") || ids.length > 200) {
    return json({ ok: false, error: "ids tiene que ser una lista de textos (máx. 200)." }, 400);
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

    if (!(await autorizado(req, env))) return json({ ok: false, error: "Token incorrecto." }, 401);

    if (pathname === "/tasks" && req.method === "POST") return crearTarea(req, env);
    if (pathname === "/tasks" && req.method === "GET") return listarPendientes(env);
    if (pathname === "/tasks/ack" && req.method === "POST") return confirmar(req, env);

    return json({ ok: false, error: "No existe." }, 404);
  },
} satisfies ExportedHandler<Env>;
