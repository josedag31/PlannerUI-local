import { prisma } from "@/lib/prisma";
import type { Section } from "@/generated/prisma/client";
import { syncToSectionCalendar } from "@/lib/sectionCalendar";

export type NewEvent = {
  title: string;
  section: Section;
  start: { date: Date; hasTime: boolean };
  /** Solo tiene sentido con hora de inicio; en un evento de todo el día se ignora. */
  durationMinutes?: number | null;
  /** Id del buzón del móvil si el evento viene de ahí (único, como en las tareas). */
  inboxId?: string | null;
};

/**
 * Crea un evento y su entrada en el calendario de la sección. Camino único
 * para el formulario y para los eventos que llegan del móvil.
 *
 * La fila se crea antes que el evento de calendario, por el mismo motivo que
 * en `insertTask`: con `inboxId` único, la fila "reclama" el evento y dos
 * recogidas simultáneas no pueden crear dos eventos en el calendario.
 */
export async function insertEvent(e: NewEvent) {
  const durationMinutes = e.start.hasTime ? (e.durationMinutes ?? null) : null;

  const event = await prisma.eventCountdown.create({
    data: {
      title: e.title,
      section: e.section,
      date: e.start.date,
      durationMinutes,
      inboxId: e.inboxId ?? null,
    },
  });

  const { googleEventId, outlookEventId } = await syncToSectionCalendar(e.section, {
    title: e.title,
    start: e.start.date,
    hasTime: e.start.hasTime,
    durationMinutes,
  });
  if (googleEventId || outlookEventId) {
    await prisma.eventCountdown.update({ where: { id: event.id }, data: { googleEventId, outlookEventId } });
  }

  return event;
}
