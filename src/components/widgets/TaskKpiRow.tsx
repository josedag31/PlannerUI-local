import type { TaskKpis } from "@/lib/taskKpis";

/** Fila de KPIs de tareas (tarea 5): completadas semana vs. anterior, %
 * hechas a tiempo, días de reacción y deuda vencida. Misma tipografía
 * kpi-value/kpi-label del resto del sistema visual, sin anillo — son
 * cifras sueltas, no algo con un "progreso" que dibujar. */
export default function TaskKpiRow({
  completadasEstaSemana,
  completadasSemanaAnterior,
  porcentajeATiempo,
  diasReaccion,
  deudaVencida,
}: TaskKpis) {
  const delta = completadasEstaSemana - completadasSemanaAnterior;
  const sinHistorial = completadasEstaSemana === 0 && completadasSemanaAnterior === 0;

  const tiles: { valor: React.ReactNode; etiqueta: string; nota?: string; alerta?: boolean }[] = [
    {
      valor: completadasEstaSemana,
      etiqueta: "completadas esta semana",
      nota: sinHistorial ? undefined : `${delta >= 0 ? "+" : ""}${delta} vs. semana pasada`,
    },
    {
      valor: porcentajeATiempo === null ? "—" : `${porcentajeATiempo}%`,
      etiqueta: "hechas a tiempo",
    },
    {
      valor: diasReaccion === null ? "—" : diasReaccion,
      etiqueta: "días de reacción",
    },
    {
      valor: deudaVencida,
      etiqueta: deudaVencida === 1 ? "vencida" : "vencidas",
      alerta: deudaVencida > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {tiles.map((t, i) => (
        <div key={i} className="text-center py-2">
          <div className="kpi-value text-3xl" style={t.alerta ? { color: "var(--danger)" } : undefined}>
            {t.valor}
          </div>
          <div className="kpi-label mt-1.5">{t.etiqueta}</div>
          {t.nota && <div className="text-xs text-muted mt-1">{t.nota}</div>}
        </div>
      ))}
    </div>
  );
}
