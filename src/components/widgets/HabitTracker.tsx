"use client";

import { useTransition } from "react";
import { toggleHabitToday, archiveHabit } from "@/lib/actions";
import DeleteButton from "@/components/DeleteButton";

type HabitItem = {
  id: string;
  name: string;
  targetPerWeek: number;
  color: string | null;
  logs: { date: Date }[];
};

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export default function HabitTracker({ habits }: { habits: HabitItem[] }) {
  const [isPending, startTransition] = useTransition();
  const today = new Date();

  if (habits.length === 0) {
    return <p className="text-sm text-muted py-4">Sin hábitos todavía. Crea uno abajo.</p>;
  }

  return (
    <ul className="space-y-3">
      {habits.map((habit) => {
        const doneToday = habit.logs.some((l) => isSameDay(new Date(l.date), today));
        const weekCount = habit.logs.filter((l) => {
          const d = new Date(l.date);
          const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
          return diff < 7;
        }).length;
        const streak = computeStreak(habit.logs.map((l) => new Date(l.date)));

        return (
          <li key={habit.id} className="flex items-center gap-3 group">
            <button
              onClick={() => startTransition(() => toggleHabitToday(habit.id))}
              disabled={isPending}
              className="h-7 w-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors"
              style={{
                borderColor: habit.color ?? "var(--accent)",
                background: doneToday ? (habit.color ?? "var(--accent)") : "transparent",
              }}
            >
              {doneToday && <span className="text-[11px] text-background font-bold">✓</span>}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{habit.name}</div>
              <div className="text-[11px] text-muted">
                {weekCount}/{habit.targetPerWeek} esta semana · racha {streak}d
              </div>
            </div>
            <DeleteButton
              id={habit.id}
              action={archiveHabit}
              confirmMessage={`¿Quitar el hábito "${habit.name}"? Se conserva su historial, pero deja de contar.`}
              className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger text-xs transition-opacity shrink-0"
            />
          </li>
        );
      })}
    </ul>
  );
}

function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const d of sorted) {
    const dd = new Date(d);
    dd.setHours(0, 0, 0, 0);
    if (dd.getTime() === cursor.getTime()) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (dd.getTime() < cursor.getTime()) {
      break;
    }
  }
  return streak;
}
