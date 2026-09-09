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

  // "Ajustar estado cuando cambia una prop" durante el render, no en un
  // efecto: es el patrón que recomienda React para esto exactamente
  // (react.dev — "You Might Not Need An Effect"), y evita la vuelta extra de
  // render+efecto que haría un `useEffect([dep]) { setEnVista(false) }`.
  const [depAnterior, setDepAnterior] = useState(dep);
  if (!Object.is(dep, depAnterior)) {
    setDepAnterior(dep);
    setEnVista(false);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el || enVista) return;
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
  }, [enVista, dep]);

  const listo = puedeAnimar && enVista;
  const anima = listo && !reduceMotion;

  return { ref, listo, anima, reduceMotion } as const;
}
