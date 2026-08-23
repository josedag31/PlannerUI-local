"use client";

import { useRef } from "react";
import { createSubject } from "@/lib/actions";

export default function QuickAddSubject() {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createSubject(formData);
        formRef.current?.reset();
      }}
      className="flex items-center gap-2"
    >
      <input
        name="name"
        placeholder="Nueva asignatura..."
        required
        className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-accent"
      />
      <input
        type="number"
        name="credits"
        placeholder="ECTS"
        className="w-16 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs outline-none"
      />
      <button type="submit" className="text-xs font-semibold text-accent hover:brightness-110">
        + añadir
      </button>
    </form>
  );
}
