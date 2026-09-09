"use client";

import { useWelcomeGate } from "@/components/WelcomeOverlay";

/**
 * Entrada en cascada para los hijos directos de un grid — el mismo efecto de
 * `DashboardGrid`, pero como envoltorio ligero para páginas con tarjetas
 * estáticas (Estudios, ARUS, Personal, Ajustes...) que no necesitan Motion ni
 * índices explícitos. El escalonado lo hace `globals.css` por `nth-child`;
 * aquí solo se decide CUÁNDO arranca.
 *
 * Como `DashboardGrid`, respeta `useWelcomeGate()`: si el saludo de
 * bienvenida está en pantalla, las tarjetas se quedan ancladas invisibles en
 * vez de animarse detrás de él.
 */
export default function Cascade({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const puedeAnimar = useWelcomeGate();

  return <div className={`${className} ${puedeAnimar ? "cascade-play" : "cascade-pending"}`}>{children}</div>;
}
