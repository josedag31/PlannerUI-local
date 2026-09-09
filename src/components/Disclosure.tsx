"use client";

import { useState } from "react";
import Collapse from "@/components/Collapse";

/** Reemplazo animado de `<details>/<summary>`: mismo patrón (un resumen que
 * se pulsa para desplegar contenido), pero con transición de alto en vez del
 * salto instantáneo del navegador, y una flechita que gira. */
export default function Disclosure({
  summary,
  defaultOpen = false,
  children,
}: {
  summary: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-muted hover:text-foreground select-none"
      >
        <svg
          viewBox="0 0 16 16"
          width="10"
          height="10"
          fill="currentColor"
          className="transition-transform duration-200 shrink-0"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          <path d="M4 2l8 6-8 6z" />
        </svg>
        {summary}
      </button>
      <Collapse open={open}>
        <div className="mt-3">{children}</div>
      </Collapse>
    </div>
  );
}
