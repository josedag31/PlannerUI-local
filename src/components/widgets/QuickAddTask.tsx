"use client";

import { useRef } from "react";
import { createTask } from "@/lib/actions";

export default function QuickAddTask({ section, subjects }: { section: "STUDY" | "ARUS" | "PERSONAL"; subjects?: { id: string; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createTask(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-2 mb-3"
    >
      <input type="hidden" name="section" value={section} />
      <input
        name="title"
        placeholder="Nueva tarea..."
        required
        className="flex-1 min-w-[160px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {subjects && subjects.length > 0 && (
        <select name="subjectId" className="bg-surface-2 border border-border rounded-lg px-2 py-2 text-xs text-muted outline-none">
          <option value="">Asignatura</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}
      <select name="priority" defaultValue="MEDIUM" className="bg-surface-2 border border-border rounded-lg px-2 py-2 text-xs text-muted outline-none">
        <option value="LOW">Baja</option>
        <option value="MEDIUM">Media</option>
        <option value="HIGH">Alta</option>
      </select>
      <input
        type="date"
        name="dueDate"
        className="bg-surface-2 border border-border rounded-lg px-2 py-2 text-xs text-muted outline-none"
      />
      <input
        type="time"
        name="dueTime"
        className="bg-surface-2 border border-border rounded-lg px-2 py-2 text-xs text-muted outline-none"
      />
      <button
        type="submit"
        className="bg-accent text-background text-sm font-semibold rounded-lg px-3 py-2 hover:brightness-110"
      >
        Añadir
      </button>
    </form>
  );
}
