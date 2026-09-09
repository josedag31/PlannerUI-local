"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { useWelcomeGate } from "@/components/WelcomeOverlay";

/**
 * Número que cuenta desde 0 hasta `value` la primera vez que se ve en
 * pantalla — el mismo criterio de todo el sistema visual: no arranca
 * mientras el saludo tape la pantalla (`useWelcomeGate`) y se salta la
 * animación con "reducir movimiento" activado.
 */
export default function CountUp({
  value,
  decimals = 0,
  duration = 1.1,
  delay = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  duration?: number;
  delay?: number;
  suffix?: string;
}) {
  const puedeAnimar = useWelcomeGate();
  const reduceMotion = useReducedMotion();
  const anima = puedeAnimar && !reduceMotion;
  const [mostrado, setMostrado] = useState(anima ? 0 : value);

  useEffect(() => {
    if (!anima) {
      setMostrado(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setMostrado,
    });
    return () => controls.stop();
  }, [anima, value, duration, delay]);

  return (
    <>
      {mostrado.toFixed(decimals)}
      {suffix}
    </>
  );
}
