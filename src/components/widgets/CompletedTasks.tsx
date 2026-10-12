"use client";

import { useMemo, useState, useTransition } from "react";
import type { Section } from "@/generated/prisma/client";
import { toggleTask } from "@/lib/actions";
import { completadaATiempo } from "@/lib/dueDate";

type CompletedTask = {
  id: string;
  title: string;
  section: Section;
  priority: string;
  dueDate: Date | null;
  doneAt: Date | null;
  createdAt: Date;
  subject: { name: string } | null;
};

type SectionInfo = { label: string; color: string; icon: string };

const DIA_MS = 86400000;

function inicioDia(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function inicioSemana(d: Date) {
  const r = inicioDia(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); // lunes
  return r;
}

function etiquetaDia(dia: Date, hoy: Date) {
  const diff = Math.round((inicioDia(hoy).getTime() - dia.getTime()) / DIA_MS);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  const texto = dia.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function etiquetaSemana(lunes: Date, hoy: Date) {
  const estaSemana = inicioSemana(hoy).getTime();
  if (lunes.getTime() === estaSemana) return "Esta semana";
  if (lunes.getTime() === estaSemana - 7 * DIA_MS) return "Semana pasada";
  const domingo = new Date(lunes.getTime() + 6 * DIA_MS);
  const f = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return `${f(lunes)} – ${f(domingo)}`;
}

/** Cuánto pasó desde que se apuntó hasta que se hizo. */
function textoReaccion(t: CompletedTask) {
  if (!t.doneAt) return null;
  const dias = Math.floor((inicioDia(t.doneAt).getTime() - inicioDia(t.createdAt).getTime()) / DIA_MS);
  if (dias <= 0) return "el mismo día";
  if (dias === 1) return "en 1 día";
  return `en ${dias} días`;
}

function plazo(t: CompletedTask): { texto: string; aTiempo: boolean } | null {
  if (!t.dueDate || !t.doneAt) return null;
  if (completadaATiempo(t.doneAt, t.dueDate)) return { texto: "a tiempo", aTiempo: true };
  const dias = Math.max(1, Math.round((inicioDia(t.doneAt).getTime() - inicioDia(t.dueDate).getTime()) / DIA_MS));
  return { texto: dias === 1 ? "1 día tarde" : `${dias} días tarde`, aTiempo: false };
}

type Grupo = { clave: string; titulo: string; dias: { clave: string; titulo: string; tareas: CompletedTask[] }[] };

export default function CompletedTasks({
  tasks,
  sections,
}: {
  tasks: CompletedTask[];
  sections: Record<Section, SectionInfo>;
}) {
  const [filtro, setFiltro] = useState<Section | "ALL">("ALL");
  const [busqueda, setBusqueda] = useState("");
  const [isPending, startTransition] = useTransition();

  const hoy = useMemo(() => new Date(), []);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (filtro === "ALL" || t.section === filtro) &&
        (!q || t.title.toLowerCase().includes(q) || t.subject?.name.toLowerCase().includes(q))
    );
  }, [tasks, filtro, busqueda]);

  const resumen = useMemo(() => {
    const d = inicioDia(hoy).getTime();
    const s = inicioSemana(hoy).getTime();
    const m = new Date(hoy.getFullYear(), hoy.getMonth(), 1).getTime();
    const con = visibles.filter((t) => t.doneAt);
    return [
      { valor: con.filter((t) => t.doneAt!.getTime() >= d).length, etiqueta: "hoy" },
      { valor: con.filter((t) => t.doneAt!.getTime() >= s).length, etiqueta: "esta semana" },
      { valor: con.filter((t) => t.doneAt!.getTime() >= m).length, etiqueta: "este mes" },
      { valor: visibles.length, etiqueta: "en total" },
    ];
  }, [visibles, hoy]);

  const { grupos, sinFecha } = useMemo(() => {
    const grupos: Grupo[] = [];
    const sinFecha: CompletedTask[] = [];
    for (const t of visibles) {
      if (!t.doneAt) {
        sinFecha.push(t);
        continue;
      }
      const lunes = inicioSemana(t.doneAt);
      const dia = inicioDia(t.doneAt);
      const claveSemana = String(lunes.getTime());
      let g = grupos.find((x) => x.clave === claveSemana);
      if (!g) {
        g = { clave: claveSemana, titulo: etiquetaSemana(lunes, hoy), dias: [] };
        grupos.push(g);
      }
      const claveDia = String(dia.getTime());
      let gd = g.dias.find((x) => x.clave === claveDia);
      if (!gd) {
        gd = { clave: claveDia, titulo: etiquetaDia(dia, hoy), tareas: [] };
        g.dias.push(gd);
      }
      gd.tareas.push(t);
    }
    return { grupos, sinFecha };
  }, [visibles, hoy]);

  const deshacer = (id: string) => startTransition(() => toggleTask(id, false));

  const fila = (t: CompletedTask) => {
    const sec = sections[t.section];
    const p = plazo(t);
    const reaccion = textoReaccion(t);
    return (
      <li key={t.id} className="flex items-center gap-3 py-2.5 group">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: sec.color }} title={sec.label} />
        <span className="flex-1 min-w-0 text-sm text-foreground truncate" title={t.title}>
          {t.title}
        </span>
        {t.subject && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted shrink-0">{t.subject.name}</span>
        )}
        {p && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
            style={{
              color: p.aTiempo ? "var(--accent)" : "var(--danger)",
              background: p.aTiempo ? "rgba(186,255,41,0.08)" : "rgba(255,77,79,0.1)",
            }}
          >
            {p.texto}
          </span>
        )}
        {reaccion && <span className="text-[11px] text-muted shrink-0 hidden sm:inline">{reaccion}</span>}
        {t.doneAt && (
          <span className="text-[11px] text-muted tabular-nums shrink-0 w-10 text-right">
            {t.doneAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        <button
          onClick={() => deshacer(t.id)}
          disabled={isPending}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted hover:text-foreground text-xs transition-opacity shrink-0"
          title="Marcar como pendiente otra vez"
          aria-label="deshacer"
        >
          ↺
        </button>
      </li>
    );
  };

  const chip = (valor: Section | "ALL", texto: string, color?: string) => {
    const activo = filtro === valor;
    return (
      <button
        key={valor}
        onClick={() => setFiltro(valor)}
        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
          activo ? "border-transparent bg-surface-2 text-foreground" : "border-border text-muted hover:text-foreground"
        }`}
      >
        {color && <span className="inline-block h-1.5 w-1.5 rounded-full mr-1.5 align-middle" style={{ background: color }} />}
        {texto}
      </button>
    );
  };

  return (
    <>
      <section className="card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {resumen.map((r) => (
            <div key={r.etiqueta} className="text-center py-2">
              <div className="kpi-value text-3xl">{r.valor}</div>
              <div className="kpi-label mt-1.5">{r.etiqueta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {chip("ALL", "Todas")}
          {(Object.keys(sections) as Section[]).map((k) => chip(k, sections[k].label, sections[k].color))}
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar…"
            className="ml-auto bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm w-full sm:w-56 outline-none focus:border-muted"
          />
        </div>

        {grupos.length === 0 && sinFecha.length === 0 ? (
          <p className="text-sm text-muted py-4">
            {tasks.length === 0 ? "Aún no has completado ninguna tarea." : "Nada que coincida con el filtro."}
          </p>
        ) : (
          <div className="space-y-6">
            {grupos.map((g) => (
              <div key={g.clave}>
                <div className="flex items-baseline justify-between border-b border-border pb-1.5 mb-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{g.titulo}</h2>
                  <span className="text-xs text-muted tabular-nums">
                    {g.dias.reduce((n, d) => n + d.tareas.length, 0)}
                  </span>
                </div>
                <div className="space-y-3">
                  {g.dias.map((d) => (
                    <div key={d.clave}>
                      <div className="text-xs text-foreground/80 mt-2">
                        {d.titulo} <span className="text-muted">· {d.tareas.length}</span>
                      </div>
                      <ul className="divide-y divide-border">{d.tareas.map(fila)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {sinFecha.length > 0 && (
              <div>
                <div className="flex items-baseline justify-between border-b border-border pb-1.5 mb-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Sin fecha de completado</h2>
                  <span className="text-xs text-muted tabular-nums">{sinFecha.length}</span>
                </div>
                <ul className="divide-y divide-border">{sinFecha.map(fila)}</ul>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
