"use client";

import { useRef } from "react";
import { createEvent } from "@/lib/actions";

export default function QuickAddEvent({ section }: { section: "STUDY" | "ARUS" | "PERSONAL" }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createEvent(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-2 mt-3"
    >
      <input type="hidden" name="section" value={section} />
      <input
        name="title"
        placeholder="Nuevo evento..."
        required
        className="flex-1 min-w-[140px] bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-accent"
      />
      <input
        type="date"
        name="date"
        required
        className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs outline-none"
      />
      <button type="submit" className="text-xs font-semibold text-accent hover:brightness-110">
        + añadir
      </button>
    </form>
  );
}
