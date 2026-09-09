import { prisma } from "@/lib/prisma";

function inicioSemana(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  const diaSemana = (r.getDay() + 6) % 7; // 0 = lunes
  r.setDate(r.getDate() - diaSemana);
  return r;
}

export type TaskKpis = {
  completadasEstaSemana: number;
  completadasSemanaAnterior: number;
  /** null si no hay ninguna tarea completada con fecha límite que comparar. */
  porcentajeATiempo: number | null;
  /** null si no hay ninguna tarea completada. */
  diasReaccion: number | null;
  deudaVencida: number;
};

/**
 * KPIs de tareas para el dashboard. Todo histórico (sin ventana de tiempo):
 * con el volumen de uso de una sola persona, una ventana corta (30 días...)
 * dejaría "% a tiempo" y "días de reacción" con aún menos datos de los que
 * ya hay.
 */
export async function getTaskKpis(): Promise<TaskKpis> {
  const hoy = new Date();
  const inicioEstaSemana = inicioSemana(hoy);
  const inicioSemanaAnterior = new Date(inicioEstaSemana);
  inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7);

  const [completadasEstaSemana, completadasSemanaAnterior, completadas, deudaVencida] = await Promise.all([
    prisma.task.count({ where: { done: true, doneAt: { gte: inicioEstaSemana } } }),
    prisma.task.count({
      where: { done: true, doneAt: { gte: inicioSemanaAnterior, lt: inicioEstaSemana } },
    }),
    prisma.task.findMany({
      where: { done: true, doneAt: { not: null } },
      select: { doneAt: true, dueDate: true, createdAt: true },
    }),
    prisma.task.count({ where: { done: false, dueDate: { lt: hoy } } }),
  ]);

  const conPlazo = completadas.filter((t) => t.dueDate);
  const porcentajeATiempo =
    conPlazo.length === 0
      ? null
      : Math.round((conPlazo.filter((t) => t.doneAt! <= t.dueDate!).length / conPlazo.length) * 100);

  const diasReaccion =
    completadas.length === 0
      ? null
      : Math.round(
          (completadas.reduce((acc, t) => acc + (t.doneAt!.getTime() - t.createdAt.getTime()) / 86400000, 0) /
            completadas.length) *
            10
        ) / 10;

  return { completadasEstaSemana, completadasSemanaAnterior, porcentajeATiempo, diasReaccion, deudaVencida };
}
