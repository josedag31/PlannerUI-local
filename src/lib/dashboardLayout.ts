import { prisma } from "@/lib/prisma";
import { WIDGET_KEYS, defaultDashboardLayout, isWidgetKey, type WidgetLayoutItem } from "@/lib/dashboardWidgets";

export async function getDashboardLayout(): Promise<WidgetLayoutItem[]> {
  const row = await prisma.dashboardLayout.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, order: JSON.stringify(defaultDashboardLayout()) },
  });

  let parsed: WidgetLayoutItem[];
  try {
    parsed = JSON.parse(row.order);
    if (!Array.isArray(parsed)) throw new Error("not an array");
  } catch {
    return defaultDashboardLayout();
  }

  // Drop unknown/renamed keys and append any new widget keys introduced since the layout was saved.
  const known = new Set(parsed.map((w) => w.key));
  const cleaned = parsed.filter((w) => isWidgetKey(w.key));
  const missing = WIDGET_KEYS.filter((k) => !known.has(k)).map((key) => ({ key, visible: key !== "clock" }));
  return [...cleaned, ...missing];
}
