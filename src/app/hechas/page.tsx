import { prisma } from "@/lib/prisma";
import Cascade from "@/components/Cascade";
import CompletedTasks from "@/components/widgets/CompletedTasks";
import { getSettings } from "@/lib/settings";

/** Historial de lo trabajado: solo tareas completadas. Las que se borran con
 * la X no aparecen porque `deleteTask` las elimina de verdad de la BBDD; las
 * completadas se quedan con `done` + `doneAt`, así que aquí sale también todo
 * lo completado antes de que existiera esta página. */
export default async function HechasPage() {
  const settings = await getSettings();

  const tasks = await prisma.task.findMany({
    where: { done: true },
    orderBy: [{ doneAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      section: true,
      priority: true,
      dueDate: true,
      doneAt: true,
      createdAt: true,
      subject: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-accent">Hechas</h1>
        <p className="text-sm text-muted mt-1">Lo que has trabajado, no solo cuánto.</p>
      </header>

      <Cascade className="grid grid-cols-1 gap-6">
        <CompletedTasks tasks={tasks} sections={settings.sections} />
      </Cascade>
    </div>
  );
}
