import { claveDiaLocal } from "@/lib/activity";

const CELDA = 11;
const HUECO = 3;
const PASO = CELDA + HUECO;
const ETIQUETA_ALTO = 16;
const SEMANAS = 53;

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic",
];

// Umbrales fijos en vez de cuartiles del máximo: con pocos datos (semanas
// sueltas de uso) unos cuartiles darían un mapa todo al máximo o todo vacío.
function nivel(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

const COLOR_NIVEL = [
  "var(--surface-2)",
  "color-mix(in srgb, var(--accent) 25%, var(--surface-2))",
  "color-mix(in srgb, var(--accent) 50%, var(--surface-2))",
  "color-mix(in srgb, var(--accent) 78%, var(--surface-2))",
  "var(--accent)",
];

type Dia = { fecha: Date; cuenta: number; futuro: boolean };

function construirSemanas(cuentas: Map<string, number>): Dia[][] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Domingo de la semana actual (fin de la cuadrícula) y lunes de hace
  // `SEMANAS` semanas completas (inicio) — así el mapa cubre siempre semanas
  // enteras, con lunes arriba y domingo abajo en cada columna.
  const diaSemanaHoy = (hoy.getDay() + 6) % 7; // 0 = lunes
  const finSemana = new Date(hoy);
  finSemana.setDate(finSemana.getDate() + (6 - diaSemanaHoy));
  const inicio = new Date(finSemana);
  inicio.setDate(inicio.getDate() - (SEMANAS * 7 - 1));

  const semanas: Dia[][] = [];
  const cursor = new Date(inicio);
  for (let s = 0; s < SEMANAS; s++) {
    const semana: Dia[] = [];
    for (let d = 0; d < 7; d++) {
      const futuro = cursor > hoy;
      semana.push({
        fecha: new Date(cursor),
        cuenta: futuro ? 0 : cuentas.get(claveDiaLocal(cursor)) ?? 0,
        futuro,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

/**
 * Mapa de calor de actividad (tareas completadas + hábitos marcados) de las
 * últimas ~53 semanas, estilo GitHub: una columna por semana, un cuadrito por
 * día, teñido según cuánto se hizo ese día.
 */
export default function ActivityHeatmap({ counts }: { counts: Map<string, number> }) {
  const semanas = construirSemanas(counts);
  const ancho = semanas.length * PASO;
  const alto = ETIQUETA_ALTO + 7 * PASO;

  let mesAnterior = -1;
  const etiquetasMes: { x: number; texto: string }[] = [];
  semanas.forEach((semana, i) => {
    const primerDia = semana[0].fecha;
    const mes = primerDia.getMonth();
    if (mes !== mesAnterior && primerDia.getDate() <= 7) {
      etiquetasMes.push({ x: i * PASO, texto: MESES[mes] });
      mesAnterior = mes;
    }
  });

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <svg viewBox={`0 0 ${ancho} ${alto}`} width={ancho} height={alto} className="block">
          {etiquetasMes.map((e) => (
            <text key={e.x} x={e.x} y={11} className="fill-muted" style={{ fontSize: 9 }}>
              {e.texto}
            </text>
          ))}
          {semanas.map((semana, si) =>
            semana.map((dia, di) => (
              <rect
                key={`${si}-${di}`}
                x={si * PASO}
                y={ETIQUETA_ALTO + di * PASO}
                width={CELDA}
                height={CELDA}
                rx={2.5}
                fill={dia.futuro ? "transparent" : COLOR_NIVEL[nivel(dia.cuenta)]}
                style={
                  !dia.futuro && nivel(dia.cuenta) === 4
                    ? { filter: "drop-shadow(0 0 3px var(--accent-glow))" }
                    : undefined
                }
              >
                {!dia.futuro && (
                  // <title> solo acepta un único string como hijo — con varias
                  // expresiones JSX seguidas (fecha, separador, texto) React
                  // avisa de que no sabe convertir el array a texto.
                  <title>
                    {`${dia.fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })} — ${
                      dia.cuenta === 0 ? "sin actividad" : `${dia.cuenta} ${dia.cuenta === 1 ? "cosa hecha" : "cosas hechas"}`
                    }`}
                  </title>
                )}
              </rect>
            ))
          )}
        </svg>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-muted">
        <span>{total === 0 ? "Sin actividad registrada todavía" : `${total} en el último año`}</span>
        <span className="flex items-center gap-1">
          menos
          {COLOR_NIVEL.map((c, i) => (
            <span key={i} className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} />
          ))}
          más
        </span>
      </div>
    </div>
  );
}
