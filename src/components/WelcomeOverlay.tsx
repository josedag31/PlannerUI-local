"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const DURACION_MS = 2600;
const DURACION_REDUCIDA_MS = 900;
const FUNDIDO_MS = 600;

type Fase = "pendiente" | "visible" | "saliendo" | "oculto";

/**
 * Si el saludo está en pantalla, empieza en `false`: las animaciones de
 * entrada de otros componentes (la cascada del dashboard) lo consultan con
 * `useWelcomeGate()` para no arrancar detrás del overlay, donde terminarían
 * sin que diera tiempo a verlas.
 */
const WelcomeGateContext = createContext(true);

export function useWelcomeGate() {
  return useContext(WelcomeGateContext);
}

/**
 * Saludo a pantalla completa al abrir la app, con una banda de luz recorriendo
 * el texto (`.text-shimmer` en globals.css), y gate de animaciones para que
 * nada más arranque mientras tapa la pantalla.
 *
 * La fase inicial ("pendiente") es la misma en servidor y en el primer render
 * de cliente, así que no hay desajuste de hidratación. La decisión real de si
 * toca mostrar el saludo la toma un script bloqueante en <head> (ver
 * `layout.tsx`), que marca `<html data-welcome-pending="1">` antes de que se
 * pinte nada — eso es lo que hace que el overlay ya esté visible en el primer
 * fotograma en vez de aparecer un instante después de la app. El efecto de
 * aquí solo confirma esa decisión y se hace cargo del cierre.
 *
 * Se cierra con estado + transición CSS y no con `AnimatePresence`: la salida
 * por presencia no llegaba a ejecutarse aquí y el overlay se quedaba tapando
 * la app entera, que es un fallo demasiado grave para dejarlo en manos de
 * algo que no termino de controlar. Un `opacity` con `transition` hace lo
 * mismo y siempre se puede quitar.
 */
export default function WelcomeOverlay({
  userName,
  children,
}: {
  userName: string | null;
  children: ReactNode;
}) {
  const [fase, setFase] = useState<Fase>("pendiente");

  const cerrar = useCallback(() => setFase((f) => (f === "visible" ? "saliendo" : f)), []);

  useEffect(() => {
    const pendiente = document.documentElement.hasAttribute("data-welcome-pending");
    if (!pendiente) {
      setFase("oculto");
      return;
    }
    setFase("visible");
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const salida = setTimeout(cerrar, reduceMotion ? DURACION_REDUCIDA_MS : DURACION_MS);
    return () => clearTimeout(salida);
  }, [cerrar]);

  useEffect(() => {
    if (fase !== "saliendo") return;
    const quitar = setTimeout(() => setFase("oculto"), FUNDIDO_MS);
    return () => clearTimeout(quitar);
  }, [fase]);

  const puedeAnimar = fase === "oculto";
  const saludo = userName ? `Bienvenido de nuevo, ${userName}` : "Bienvenido de nuevo";

  return (
    <WelcomeGateContext.Provider value={puedeAnimar}>
      <div
        // Se puede saltar con un clic: verlo una vez tiene gracia, esperarlo
        // con prisa no.
        onClick={cerrar}
        role="presentation"
        className="welcome-overlay fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity ease-in-out"
        style={
          fase === "pendiente"
            ? undefined // manda el CSS de html[data-welcome-pending] hasta que React decide
            : {
                opacity: fase === "visible" ? 1 : 0,
                pointerEvents: fase === "visible" ? "auto" : "none",
                transitionDuration: `${FUNDIDO_MS}ms`,
              }
        }
      >
        <p className="text-shimmer text-3xl sm:text-4xl font-semibold tracking-tight px-6 text-center">
          {saludo}
        </p>
      </div>
      {children}
    </WelcomeGateContext.Provider>
  );
}
