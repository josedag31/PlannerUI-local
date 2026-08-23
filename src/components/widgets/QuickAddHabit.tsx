"use client";

import { useRef } from "react";
import { createHabit } from "@/lib/actions";

export default function QuickAddHabit({ section }: { section: "STUDY" | "ARUS" | "PERSONAL" }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createHabit(formData);
        formRef.current?.reset();
      }}
      className="flex items-center gap-2 mt-3"
    >
      <input type="hidden" name="section" value={section} />
      <input
        name="name"
        placeholder="Nuevo hábito..."
        required
        className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-accent"
      />
      <input
        type="number"
        name="targetPerWeek"
        defaultValue={7}
        min={1}
        max={7}
        className="w-14 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs outline-none"
      />
      <button type="submit" className="text-xs font-semibold text-accent hover:brightness-110">
        + añadir
      </button>
    </form>
  );
}
