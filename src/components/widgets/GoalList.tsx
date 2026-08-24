"use client";

import { useTransition } from "react";
import { updateGoalProgress, deleteGoal } from "@/lib/actions";
import DeleteButton from "@/components/DeleteButton";

type GoalItem = {
  id: string;
  title: string;
  progress: number;
  targetDate: Date | null;
};

export default function GoalList({ goals }: { goals: GoalItem[] }) {
  const [, startTransition] = useTransition();

  if (goals.length === 0) {
    return <p className="text-sm text-muted py-4">Sin objetivos definidos.</p>;
  }

  return (
    <ul className="space-y-4">
      {goals.map((goal) => (
        <li key={goal.id} className="group">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-sm font-medium flex-1 truncate">{goal.title}</span>
            <span className="text-xs text-muted shrink-0">
              {goal.progress}%
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
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            defaultValue={goal.progress}
            onChange={(e) => {
              const value = Number(e.target.value);
              startTransition(() => updateGoalProgress(goal.id, value));
            }}
            className="w-full mt-1.5 accent-[color:var(--accent)]"
          />
        </li>
      ))}
    </ul>
  );
}
