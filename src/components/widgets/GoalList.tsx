"use client";

import { useTransition } from "react";
import { updateGoalProgress } from "@/lib/actions";

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
        <li key={goal.id}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium">{goal.title}</span>
            <span className="text-xs text-muted">
              {goal.progress}%
              {goal.targetDate &&
                ` · ${new Date(goal.targetDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}`}
            </span>
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
