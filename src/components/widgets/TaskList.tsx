"use client";

import { useTransition } from "react";
import { toggleTask, deleteTask } from "@/lib/actions";

type TaskItem = {
  id: string;
  title: string;
  done: boolean;
  priority: string;
  dueDate: Date | null;
  subject?: { name: string; color: string | null } | null;
};

const priorityColor: Record<string, string> = {
  HIGH: "var(--danger)",
  MEDIUM: "var(--accent)",
  LOW: "var(--muted)",
};

function hasExplicitTime(date: Date) {
  const d = new Date(date);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

export default function TaskList({ tasks, emptyLabel = "Sin tareas. Buen trabajo." }: { tasks: TaskItem[]; emptyLabel?: string }) {
  const [isPending, startTransition] = useTransition();

  if (tasks.length === 0) {
    return <p className="text-sm text-muted py-4">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-3 py-2.5 group">
          <button
            onClick={() =>
              startTransition(() => {
                toggleTask(task.id, !task.done);
              })
            }
            disabled={isPending}
            className={`h-4.5 w-4.5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
              task.done ? "bg-accent border-accent" : "border-muted hover:border-foreground"
            }`}
            style={{ height: 18, width: 18 }}
            aria-label="toggle task"
          >
            {task.done && <span className="text-[10px] text-background font-bold">✓</span>}
          </button>
          <span
            className={`flex-1 text-sm ${task.done ? "line-through text-muted" : "text-foreground"}`}
          >
            {task.title}
          </span>
          {task.subject && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted">
              {task.subject.name}
            </span>
          )}
          {task.dueDate && (
            <span className="text-[11px] text-muted">
              {new Date(task.dueDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
              {hasExplicitTime(task.dueDate) &&
                ` · ${new Date(task.dueDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
            </span>
          )}
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: priorityColor[task.priority] }}
            title={task.priority}
          />
          <button
            onClick={() => startTransition(() => deleteTask(task.id))}
            className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger text-xs transition-opacity"
            aria-label="delete task"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
