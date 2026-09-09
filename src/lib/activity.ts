import { prisma } from "@/lib/prisma";

/** Recupera el día LOCAL de una fecha guardada, no el UTC: `HabitLog.date` se
 * guarda a medianoche local ya desplazada a UTC (p.ej. 22:00 UTC del día
 * anterior en verano), así que `toISOString().slice(0,10)` daría el día de
 * antes. Los getters locales de `Date` sí devuelven el día que se pensó al
 * guardarlo, porque el proceso corre en la misma zona horaria. */
function claveDiaLocal(d: Date) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Cuenta de "actividad" por día (tareas completadas + hábitos marcados) de
 * las últimas ~53 semanas, para el mapa de calor anual. No incluye objetivos
 * ni notas: no tienen una fecha de "cuándo se hizo algo" con la que contar,
 * solo de creación/edición.
 */
export async function getActivityCounts(): Promise<Map<string, number>> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(hoy);
  inicio.setDate(inicio.getDate() - 370);

  const [tareas, logs] = await Promise.all([
    prisma.task.findMany({
      where: { done: true, doneAt: { gte: inicio } },
      select: { doneAt: true },
    }),
    prisma.habitLog.findMany({
      where: { done: true, date: { gte: inicio } },
      select: { date: true },
    }),
  ]);

  const cuentas = new Map<string, number>();
  const suma = (d: Date | null) => {
    if (!d) return;
    const clave = claveDiaLocal(d);
    cuentas.set(clave, (cuentas.get(clave) ?? 0) + 1);
  };
  tareas.forEach((t) => suma(t.doneAt));
  logs.forEach((l) => suma(l.date));

  return cuentas;
}

export { claveDiaLocal };
