"use client";

import { useTransition } from "react";
import { updateGoalProgress, deleteGoal } from "@/lib/actions";
import DeleteButton from "@/components/DeleteButton";
import { useRevealOnView } from "@/hooks/useRevealOnView";
import CountUp from "@/components/CountUp";

type GoalItem = {
  id: string;
  title: string;
  progress: number;
  targetDate: Date | null;
};

/** Cada objetivo revela su barra según su propia posición en pantalla, no la
 * del primero de la lista — de ahí que cada fila tenga su propio
 * `useRevealOnView`, no uno solo para toda la lista. */
function GoalRow({
  goal,
  onProgressChange,
}: {
  goal: GoalItem;
  onProgressChange: (id: string, value: number) => void;
}) {
  const { ref, listo, anima } = useRevealOnView<HTMLDivElement>(goal.progress);

  return (
    <li className="group">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium flex-1 truncate">{goal.title}</span>
        <span className="text-xs text-muted shrink-0">
          <CountUp value={goal.progress} suffix="%" />
          {goal.targetDate &&
            ` · ${new Date(goal.targetDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}`}
        </span>
        <DeleteButton
          id={goal.id}
          action={deleteGoal}
          confirmMessage={`¿Borrar el objetivo "${goal.title}"?`}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger text-xs transition-opacity shrink-0"
        />
      </div>
      <div ref={ref} className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full progress-fill rounded-full"
          style={{
            width: listo ? `${goal.progress}%` : "0%",
            transition: anima ? "width 1.6s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        defaultValue={goal.progress}
        onChange={(e) => onProgressChange(goal.id, Number(e.target.value))}
        className="w-full mt-1.5 accent-[color:var(--accent)]"
      />
    </li>
  );
}

export default function GoalList({ goals }: { goals: GoalItem[] }) {
  const [, startTransition] = useTransition();

  if (goals.length === 0) {
    return <p className="text-sm text-muted py-4">Sin objetivos definidos.</p>;
  }

  return (
    <ul className="space-y-4">
      {goals.map((goal) => (
        <GoalRow
          key={goal.id}
          goal={goal}
          onProgressChange={(id, value) => startTransition(() => updateGoalProgress(id, value))}
        />
      ))}
    </ul>
  );
}
