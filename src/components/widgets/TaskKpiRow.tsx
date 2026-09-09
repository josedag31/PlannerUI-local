import type { TaskKpis } from "@/lib/taskKpis";
import CountUp from "@/components/CountUp";

/** Fila de KPIs de tareas (tarea 5): completadas semana vs. anterior, %
 * hechas a tiempo, días de reacción y deuda vencida. Misma tipografía
 * kpi-value/kpi-label del resto del sistema visual, sin anillo — son
 * cifras sueltas, no algo con un "progreso" que dibujar. Cada número cuenta
 * desde 0 la primera vez que se ve (`CountUp`), con un pequeño escalonado
 * por tarjeta para que no salten las 4 a la vez. */
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
      valor: <CountUp value={completadasEstaSemana} delay={0} />,
      etiqueta: "completadas esta semana",
      nota: sinHistorial ? undefined : `${delta >= 0 ? "+" : ""}${delta} vs. semana pasada`,
    },
    {
      valor: porcentajeATiempo === null ? "—" : <CountUp value={porcentajeATiempo} delay={0.1} suffix="%" />,
      etiqueta: "hechas a tiempo",
    },
    {
      valor: diasReaccion === null ? "—" : <CountUp value={diasReaccion} decimals={1} delay={0.2} />,
      etiqueta: "días de reacción",
    },
    {
      valor: <CountUp value={deudaVencida} delay={0.3} />,
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
