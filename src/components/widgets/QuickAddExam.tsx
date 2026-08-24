"use client";

import { useRef } from "react";
import { createExam } from "@/lib/actions";
import { useNowDefaults } from "@/lib/useNowDefaults";

export default function QuickAddExam({ subjects }: { subjects: { id: string; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const fillDefaults = useNowDefaults({ date: dateRef, time: timeRef });

  if (subjects.length === 0) {
    return <p className="text-xs text-muted">Crea primero una asignatura para poder añadir exámenes.</p>;
  }
  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createExam(formData);
        formRef.current?.reset();
        fillDefaults();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <select name="subjectId" required className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs outline-none">
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input ref={dateRef} type="date" name="date" required className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs outline-none" />
      <input ref={timeRef} type="time" name="time" className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs outline-none" />
      <input
        name="notes"
        placeholder="Notas (opcional)"
        className="flex-1 min-w-[120px] bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-accent"
      />
      <button type="submit" className="text-xs font-semibold text-accent hover:brightness-110">
        + añadir
      </button>
    </form>
  );
}
