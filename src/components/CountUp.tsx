"use client";

import { useEffect, useState } from "react";
import { animate } from "motion/react";
import { useRevealOnView } from "@/hooks/useRevealOnView";

/**
 * Número que cuenta desde 0 hasta `value` la primera vez que entra en el
 * viewport (no antes, aunque el saludo ya haya terminado — ver
 * `useRevealOnView`). Se salta la animación con "reducir movimiento", y
 * vuelve a contar si `value` cambia de verdad, no por volver a hacer scroll
 * sobre el mismo valor.
 */
export default function CountUp({
  value,
  decimals = 0,
  duration = 1.8,
  delay = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  duration?: number;
  delay?: number;
  suffix?: string;
}) {
  const { ref, listo, anima } = useRevealOnView<HTMLSpanElement>(value);
  // Solo guarda el valor MIENTRAS se anima — el caso "sin animación" (aún no
  // visible, o reducir movimiento) se calcula directo en el render de abajo,
  // no vía setState en el efecto.
  const [mostrado, setMostrado] = useState(0);

  useEffect(() => {
    if (!listo || !anima) return;
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setMostrado,
    });
    return () => controls.stop();
  }, [listo, anima, value, duration, delay]);

  const valorMostrado = !listo ? 0 : anima ? mostrado : value;

  return (
    <span ref={ref}>
      {valorMostrado.toFixed(decimals)}
      {suffix}
    </span>
  );
}
