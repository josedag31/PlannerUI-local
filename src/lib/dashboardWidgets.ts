// Pure constants/types shared by server and client dashboard code. No
// imports here that touch Prisma/Node — this file gets bundled into the
// browser via client components like DashboardGrid.

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

/** Tailwind col-span classes applied to each widget's grid cell (independent of drag order). */
export const WIDGET_SPANS: Record<WidgetKey, string> = {
  week: "lg:col-span-3",
  tasks: "lg:col-span-2",
  events: "",
  habits: "",
  goals: "lg:col-span-2",
  clock: "",
  googleCalendar: "",
  googleDrive: "",
  gmail: "",
  outlook: "",
};

export type WidgetLayoutItem = { key: WidgetKey; visible: boolean };

export function defaultDashboardLayout(): WidgetLayoutItem[] {
  return WIDGET_KEYS.map((key) => ({ key, visible: key !== "clock" }));
}

export function isWidgetKey(value: string): value is WidgetKey {
  return (WIDGET_KEYS as readonly string[]).includes(value);
}
