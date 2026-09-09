"use client";

/**
 * Contenedor con animación de alto vía `grid-template-rows` (0fr ↔ 1fr) en
 * vez de `max-height`: no hace falta conocer de antemano la altura del
 * contenido (que aquí varía: formularios, listas...), así que nunca se corta
 * a medias ni deja hueco de más.
 */
export default function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div className="overflow-hidden min-h-0">{children}</div>
    </div>
  );
}
