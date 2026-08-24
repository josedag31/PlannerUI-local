"use client";

import { useTransition } from "react";

/**
 * `action` must be the raw server action reference (e.g. `deleteTask`), never
 * a wrapping closure like `() => deleteTask(id)` — a Server Component can't
 * pass an arbitrary closure to a Client Component prop ("Event handlers
 * cannot be passed to Client Component props"), but it *can* pass the server
 * action itself through unchanged. Binding the id happens here, on the client.
 */
export default function DeleteButton({
  id,
  action,
  confirmMessage,
  className,
  label = "✕",
}: {
  id: string;
  action: (id: string) => Promise<void>;
  confirmMessage?: string;
  className?: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        startTransition(() => {
          action(id);
        });
      }}
      disabled={isPending}
      className={className ?? "text-muted hover:text-danger text-xs transition-colors shrink-0"}
      aria-label="Eliminar"
      title="Eliminar"
    >
      {label}
    </button>
  );
}
