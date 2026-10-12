import { prisma } from "@/lib/prisma";
import type { Priority, Section } from "@/generated/prisma/client";
import { syncToSectionCalendar } from "@/lib/sectionCalendar";

export type NewTask = {
  title: string;
  section: Section;
  priority: Priority;
  due: { date: Date; hasTime: boolean } | null;
  subjectId?: string | null;
  /** Id del buzón del móvil si la tarea viene de ahí. Es único: si la misma
   * tarea llega dos veces (la app se cerró entre guardarla y confirmarla al
   * buzón), el segundo `create` falla en vez de duplicarla. */
  inboxId?: string | null;
};

/**
 * Crea una tarea y, si tiene fecha, su evento en el calendario de la sección.
 * Camino único para todas las tareas: las del formulario y las que llegan del
 * móvil tienen que acabar exactamente igual.
 *
 * La fila se crea ANTES que el evento: con `inboxId` único, la fila es la que
 * "reclama" la tarea, y así dos recogidas simultáneas del buzón no pueden
 * crear dos eventos de calendario para la misma tarea.
 */
export async function insertTask(t: NewTask) {
  const task = await prisma.task.create({
    data: {
      title: t.title,
      section: t.section,
      priority: t.priority,
      dueDate: t.due?.date ?? null,
      subjectId: t.subjectId ?? null,
      inboxId: t.inboxId ?? null,
    },
  });

  if (t.due) {
    const { googleEventId, outlookEventId } = await syncToSectionCalendar(t.section, {
      title: t.title,
      start: t.due.date,
      hasTime: t.due.hasTime,
    });
    if (googleEventId || outlookEventId) {
      await prisma.task.update({ where: { id: task.id }, data: { googleEventId, outlookEventId } });
    }
  }

  return task;
}
