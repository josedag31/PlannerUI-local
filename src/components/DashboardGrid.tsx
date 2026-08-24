"use client";

import { useRef, useState, useTransition } from "react";
import { updateDashboardLayout } from "@/lib/actions";
import { WIDGET_SPANS, type WidgetKey, type WidgetLayoutItem } from "@/lib/dashboardWidgets";

export default function DashboardGrid({
  layout,
  widgets,
  widgetTitles,
}: {
  layout: WidgetLayoutItem[];
  widgets: Partial<Record<WidgetKey, React.ReactNode>>;
  widgetTitles: Record<WidgetKey, string>;
}) {
  const [items, setItems] = useState(layout);
  const [editMode, setEditMode] = useState(false);
  const [, startTransition] = useTransition();
  const dragIndex = useRef<number | null>(null);

  function persist(next: WidgetLayoutItem[]) {
    setItems(next);
    startTransition(() => {
      updateDashboardLayout(next);
    });
  }

  function toggleVisible(key: WidgetKey) {
    persist(items.map((i) => (i.key === key ? { ...i, visible: !i.visible } : i)));
  }

  function handleDrop(targetIndex: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === targetIndex) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    persist(next);
  }

  const visibleItems = items.filter((i) => i.visible && widgets[i.key]);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setEditMode((v) => !v)}
          className={`text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors ${
            editMode ? "bg-accent text-background border-accent" : "border-border text-muted hover:text-foreground"
          }`}
        >
          {editMode ? "Listo" : "Personalizar dashboard"}
        </button>
      </div>

      {editMode && (
        <div className="card p-4 mb-4 space-y-2">
          <p className="text-xs text-muted mb-2">
            Marca lo que quieras ver, y arrastra las tarjetas de abajo para reordenarlas.
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <label
                key={item.key}
                className="text-xs flex items-center gap-1.5 bg-surface-2 border border-border px-2.5 py-1.5 rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={() => toggleVisible(item.key)}
                  className="accent-[color:var(--accent)]"
                />
                {widgetTitles[item.key]}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {visibleItems.map((item) => (
          <div
            key={item.key}
            draggable={editMode}
            onDragStart={(e) => {
              dragIndex.current = items.findIndex((i) => i.key === item.key);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (editMode) e.preventDefault();
            }}
            onDrop={() => {
              if (editMode) handleDrop(items.findIndex((i) => i.key === item.key));
            }}
            className={`relative ${WIDGET_SPANS[item.key]} ${
              editMode
                ? "cursor-move rounded-2xl ring-1 ring-accent/40 ring-offset-2 ring-offset-background transition-shadow"
                : ""
            }`}
          >
            {editMode && (
              // Punto de agarre fijo: el resto de la tarjeta está lleno de botones/inputs
              // (checkboxes, "añadir rápido"...) y el navegador no inicia un drag nativo si
              // el mousedown empieza sobre uno de esos controles — solo desde aquí o del
              // título (texto plano) se puede arrastrar de forma fiable.
              <div
                title="Arrastrar para reordenar"
                className="absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-border bg-surface-2 text-muted"
              >
                <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
                  <circle cx="5" cy="3" r="1.3" />
                  <circle cx="11" cy="3" r="1.3" />
                  <circle cx="5" cy="8" r="1.3" />
                  <circle cx="11" cy="8" r="1.3" />
                  <circle cx="5" cy="13" r="1.3" />
                  <circle cx="11" cy="13" r="1.3" />
                </svg>
              </div>
            )}
            {widgets[item.key]}
          </div>
        ))}
      </div>
    </div>
  );
}
