"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/react";
import { useRevealOnView } from "@/hooks/useRevealOnView";
import CountUp from "@/components/CountUp";

// Ventana de referencia del anillo exterior: más allá de esto se queda casi
// vacío, no literalmente vacío (que un anillo sin trazo parezca roto es peor
// que uno apenas insinuado). 21 días = casi vacío a las 2-3 semanas, medio a
// la semana y pico, casi lleno a pocos días — los puntos de referencia que
// dio él al pedirlo.
const VENTANA_DIAS = 21;
const RADIO_EXTERIOR = 54;
const CIRCUNFERENCIA_EXTERIOR = 2 * Math.PI * RADIO_EXTERIOR;

// Anillo interior de horas: solo existe (visualmente) por debajo de esta
// ventana. Va de vacío a las 24h justas hasta lleno en el momento del
// evento — un radio menor para que quede claramente anidado dentro del de
// días, con hueco de sobra entre los dos trazos.
const VENTANA_HORAS = 24;
const RADIO_INTERIOR = 38;
const CIRCUNFERENCIA_INTERIOR = 2 * Math.PI * RADIO_INTERIOR;

function hexToRgba(hex: string, alpha: number) {
  const limpio = hex.replace("#", "");
  const completo = limpio.length === 3 ? limpio.split("").map((c) => c + c).join("") : limpio;
  const n = parseInt(completo, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function diasHasta(date: Date) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

/** Mismo criterio que CountdownList: medianoche en punto significa "sin hora
 * concreta" (solo fecha), cualquier otra cosa es una hora real que enseñar. */
function tieneHora(date: Date) {
  const d = new Date(date);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

/** Horas exactas (con decimales, puede ser negativo si ya pasó) — para el
 * relleno del anillo interior y para decidir si ya toca activarlo. */
function horasExactasHasta(date: Date) {
  return (date.getTime() - Date.now()) / (1000 * 60 * 60);
}

/**
 * Cuenta atrás en anillo para el próximo examen/evento (el más cercano de
 * todas las secciones), con dos trazos anidados:
 *
 * - Exterior: días, dentro de `VENTANA_DIAS`.
 * - Interior: horas, dentro de `VENTANA_HORAS` — solo se dibuja cuando
 *   quedan de verdad menos de 24h reales (no "es el mismo día de
 *   calendario": a las 23h de hoy, un evento mañana a mediodía ya activa el
 *   interior aunque sea "otro día").
 *
 * Mientras el interior está activo, el número grande pasa de días a horas
 * (perdiendo la palabra "día" a propósito — pedido explícito: más simple
 * que arrastrar las dos unidades a la vez, que quedaba confuso).
 *
 * El trazo se dibuja con `animate()` imperativo sobre un `ref` (mismo
 * mecanismo que `CountUp`), no con `<motion.circle animate={...}>`: los
 * componentes `motion.*` declarativos no arrancan su animación cuando este
 * widget llega al cliente como children de un Server Component pasado por
 * prop a `DashboardGrid` — se quedan fijos en su valor `initial` para
 * siempre, sin ningún error en consola. Ver [[Locked In - Problemas
 * resueltos]].
 *
 * No arranca hasta que el propio anillo entra en el viewport (no basta con
 * que el saludo haya terminado) — `useRevealOnView`.
 */
export default function CountdownRing({
  title,
  date,
  color,
}: {
  title: string;
  date: Date;
  color: string;
}) {
  const dias = diasHasta(date);
  const progreso = Math.min(1, Math.max(0.02, 1 - Math.max(dias, 0) / VENTANA_DIAS));

  // Sin hora concreta (solo fecha) no hay "momento exacto" al que contar en
  // horas — medianoche es un marcador, no una hora real de la que faltar 20
  // minutos. El anillo interior solo tiene sentido cuando sí la hay.
  const conHora = tieneHora(date);
  const horasExactas = horasExactasHasta(date);
  const horasActivas = conHora && horasExactas >= 0 && horasExactas < VENTANA_HORAS;
  const progresoHoras = horasActivas ? Math.min(1, Math.max(0.02, 1 - horasExactas / VENTANA_HORAS)) : 0;
  const horas = horasActivas ? Math.max(1, Math.ceil(horasExactas)) : null;

  const { ref, listo, anima } = useRevealOnView<HTMLDivElement>(`${dias}:${horas}`);
  const circleExtRef = useRef<SVGCircleElement>(null);
  const circleIntRef = useRef<SVGCircleElement>(null);

  const glow = hexToRgba(color, 0.55);

  const numero = horas !== null ? horas : dias < 0 ? -dias : dias;
  const etiqueta =
    horas !== null
      ? horas === 1
        ? "hora"
        : "horas"
      : dias < 0
        ? "días tarde"
        : dias === 0
          ? "hoy"
          : dias === 1
            ? "mañana"
            : "días";

  useEffect(() => {
    if (!listo) return;
    const elExt = circleExtRef.current;
    const elInt = circleIntRef.current;

    if (!anima) {
      if (elExt) elExt.style.strokeDasharray = `${progreso * CIRCUNFERENCIA_EXTERIOR} ${CIRCUNFERENCIA_EXTERIOR}`;
      if (elInt) elInt.style.strokeDasharray = `${progresoHoras * CIRCUNFERENCIA_INTERIOR} ${CIRCUNFERENCIA_INTERIOR}`;
      return;
    }

    const controles = [
      animate(0, progreso, {
        duration: 1.8,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => {
          if (elExt) elExt.style.strokeDasharray = `${v * CIRCUNFERENCIA_EXTERIOR} ${CIRCUNFERENCIA_EXTERIOR}`;
        },
      }),
    ];
    if (elInt) {
      controles.push(
        animate(0, progresoHoras, {
          duration: 1.8,
          delay: 0.15,
          ease: [0.22, 1, 0.36, 1],
          onUpdate: (v) => {
            elInt.style.strokeDasharray = `${v * CIRCUNFERENCIA_INTERIOR} ${CIRCUNFERENCIA_INTERIOR}`;
          },
        })
      );
    }
    return () => controles.forEach((c) => c.stop());
  }, [listo, anima, progreso, progresoHoras]);

  return (
    <div ref={ref} className="flex flex-col items-center py-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
          <circle cx="60" cy="60" r={RADIO_EXTERIOR} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
          <circle
            ref={circleExtRef}
            cx="60"
            cy="60"
            r={RADIO_EXTERIOR}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`0 ${CIRCUNFERENCIA_EXTERIOR}`}
            style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
          />
          {horasActivas && (
            <>
              <circle cx="60" cy="60" r={RADIO_INTERIOR} fill="none" stroke="var(--surface-2)" strokeWidth="6" />
              <circle
                ref={circleIntRef}
                cx="60"
                cy="60"
                r={RADIO_INTERIOR}
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`0 ${CIRCUNFERENCIA_INTERIOR}`}
                style={{ filter: `drop-shadow(0 0 5px ${glow})` }}
              />
            </>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="kpi-value text-3xl">
            <CountUp value={numero} duration={1.8} />
          </span>
          <span className="kpi-label">{etiqueta}</span>
        </div>
      </div>
      <p className="text-sm font-medium mt-3 text-center truncate max-w-[10rem]">{title}</p>
      <p className="text-xs text-muted mt-0.5">
        {new Date(date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
        {conHora && ` · ${new Date(date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
      </p>
    </div>
  );
}
