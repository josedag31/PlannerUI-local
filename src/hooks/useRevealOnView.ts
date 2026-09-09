"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useWelcomeGate } from "@/components/WelcomeOverlay";

/**
 * Cuándo debe revelarse (y animarse) algo: no antes de que el saludo de
 * bienvenida termine, Y no antes de que el propio elemento entre en el
 * viewport — si está más abajo de lo que se ve al cargar la página, la
 * animación no puede haber terminado ya para cuando se hace scroll hasta
 * él.
 *
 * Se vuelve a disparar si `dep` cambia (el dato que se anima es distinto),
 * pero no por volver a pasar por encima con el mismo dato: una vez revelado
 * con un valor, se queda así hasta que el valor cambie de verdad.
 *
 * `ref` va en el elemento cuya posición en pantalla importa (normalmente el
 * contenedor visible del widget, no necesariamente el nodo que se anima).
 */
export function useRevealOnView<E extends Element>(dep: unknown) {
  const ref = useRef<E>(null);
  const puedeAnimar = useWelcomeGate();
  const reduceMotion = useReducedMotion();
  const [enVista, setEnVista] = useState(false);

  useEffect(() => {
    setEnVista(false);
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEnVista(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);

  const listo = puedeAnimar && enVista;
  const anima = listo && !reduceMotion;

  return { ref, listo, anima, reduceMotion } as const;
}
