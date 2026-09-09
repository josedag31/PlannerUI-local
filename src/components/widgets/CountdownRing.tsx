"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/react";
import { useRevealOnView } from "@/hooks/useRevealOnView";
import CountUp from "@/components/CountUp";

// Ventana de referencia del anillo: más allá de esto se queda casi vacío, no
// literalmente vacío (que un anillo sin trazo parezca roto es peor que uno
// apenas insinuado).
const VENTANA_DIAS = 30;
const RADIO = 54;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

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

/**
 * Cuenta atrás en anillo para el próximo examen/evento (el más cercano de
 * todas las secciones). El trazo se llena según cuánto queda dentro de
 * `VENTANA_DIAS` — cuanto más cerca, más lleno y no según ningún dato
 * adicional que no tengamos (no hay "inicio" real de la cuenta atrás).
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
  const { ref, listo, anima } = useRevealOnView<HTMLDivElement>(progreso);
  const circleRef = useRef<SVGCircleElement>(null);

  const glow = hexToRgba(color, 0.55);
  const numero = dias < 0 ? -dias : dias;
  const etiqueta = dias < 0 ? "días tarde" : dias === 0 ? "hoy" : dias === 1 ? "mañana" : "días";

  useEffect(() => {
    const el = circleRef.current;
    if (!el || !listo) return;

    if (!anima) {
      el.style.strokeDasharray = `${progreso * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`;
      return;
    }
    const controls = animate(0, progreso, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.style.strokeDasharray = `${v * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`;
      },
    });
    return () => controls.stop();
  }, [listo, anima, progreso]);

  return (
    <div ref={ref} className="flex flex-col items-center py-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
          <circle cx="60" cy="60" r={RADIO} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
          <circle
            ref={circleRef}
            cx="60"
            cy="60"
            r={RADIO}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`0 ${CIRCUNFERENCIA}`}
            style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
          />
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
      </p>
    </div>
  );
}
