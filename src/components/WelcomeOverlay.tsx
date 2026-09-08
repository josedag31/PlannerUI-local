"use client";

import { useCallback, useEffect, useState } from "react";

/** Solo la primera vez que se abre la app, no en cada navegación entre páginas. */
const SESSION_KEY = "welcome-shown";
const DURACION_MS = 2600;
const DURACION_REDUCIDA_MS = 900;
const FUNDIDO_MS = 600;

type Fase = "oculto" | "visible" | "saliendo";

/**
 * Saludo a pantalla completa al abrir la app, con una banda de luz recorriendo
 * el texto (`.text-shimmer` en globals.css).
 *
 * Se hace con estado + transición CSS y no con `AnimatePresence`: la salida por
 * presencia no llegaba a ejecutarse aquí y el overlay se quedaba tapando la app
 * entera, que es un fallo demasiado grave para dejarlo en manos de algo que no
 * termino de controlar. Un `opacity` con `transition` hace lo mismo y siempre
 * se puede quitar.
 */
export default function WelcomeOverlay({ userName }: { userName: string | null }) {
  const [fase, setFase] = useState<Fase>("oculto");

  // Se decide en el primer render del cliente, no dentro del efecto: si la
  // condición vive en el efecto, la segunda pasada que hace React en desarrollo
  // se la salta y el saludo se queda sin temporizador de salida.
  const [primeraVezEnLaSesion] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      // sessionStorage puede fallar (modo privado, permisos). Si no se puede
      // leer, no se muestra: mejor eso que arriesgarse a dejarlo colgado.
      if (sessionStorage.getItem(SESSION_KEY) === "1") return false;
      sessionStorage.setItem(SESSION_KEY, "1");
      return true;
    } catch {
      return false;
    }
  });

  const cerrar = useCallback(() => setFase((f) => (f === "visible" ? "saliendo" : f)), []);

  useEffect(() => {
    if (!primeraVezEnLaSesion) return;

    // El saludo se enciende después de montar, no en el render inicial, para
    // que el HTML del servidor y el primer render del cliente coincidan y no
    // haya desajuste de hidratación. Es un render extra, y sale a cuenta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFase("visible");
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const salida = setTimeout(cerrar, reduceMotion ? DURACION_REDUCIDA_MS : DURACION_MS);
    return () => clearTimeout(salida);
  }, [primeraVezEnLaSesion, cerrar]);

  useEffect(() => {
    if (fase !== "saliendo") return;
    const quitar = setTimeout(() => setFase("oculto"), FUNDIDO_MS);
    return () => clearTimeout(quitar);
  }, [fase]);

  if (fase === "oculto") return null;

  const saludo = userName ? `Bienvenido de nuevo, ${userName}` : "Bienvenido de nuevo";

  return (
    <div
      // Se puede saltar con un clic: verlo una vez tiene gracia, esperarlo con
      // prisa no.
      onClick={cerrar}
      role="presentation"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity ease-in-out ${
        fase === "saliendo" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FUNDIDO_MS}ms` }}
    >
      <p className="text-shimmer text-3xl sm:text-4xl font-semibold tracking-tight px-6 text-center">
        {saludo}
      </p>
    </div>
  );
}
