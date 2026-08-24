import { prisma } from "@/lib/prisma";

export const WIDGET_KEYS = [
  "week",
  "tasks",
  "events",
  "habits",
  "goals",
  "clock",
  "googleCalendar",
  "googleDrive",
  "gmail",
  "outlook",
] as const;

export type WidgetKey = (typeof WIDGET_KEYS)[number];

export const WIDGET_TITLES: Record<WidgetKey, string> = {
  week: "Semana",
  tasks: "Tareas pendientes",
  events: "Próximos eventos",
  habits: "Hábitos",
  goals: "Objetivos del año",
  clock: "Reloj",
  googleCalendar: "Google Calendar",
  googleDrive: "Google Drive",
  gmail: "Gmail",
  outlook: "Outlook",
};

export type WidgetLayoutItem = { key: WidgetKey; visible: boolean };

function defaultLayout(): WidgetLayoutItem[] {
  return WIDGET_KEYS.map((key) => ({ key, visible: key !== "clock" }));
}

function isWidgetKey(value: string): value is WidgetKey {
  return (WIDGET_KEYS as readonly string[]).includes(value);
}

export async function getDashboardLayout(): Promise<WidgetLayoutItem[]> {
  const row = await prisma.dashboardLayout.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, order: JSON.stringify(defaultLayout()) },
  });

  let parsed: WidgetLayoutItem[];
  try {
    parsed = JSON.parse(row.order);
    if (!Array.isArray(parsed)) throw new Error("not an array");
  } catch {
    return defaultLayout();
  }

  // Drop unknown/renamed keys and append any new widget keys introduced since the layout was saved.
  const known = new Set(parsed.map((w) => w.key));
  const cleaned = parsed.filter((w) => isWidgetKey(w.key));
  const missing = WIDGET_KEYS.filter((k) => !known.has(k)).map((key) => ({ key, visible: key !== "clock" }));
  return [...cleaned, ...missing];
}
