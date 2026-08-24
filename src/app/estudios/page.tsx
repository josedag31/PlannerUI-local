import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import TaskList from "@/components/widgets/TaskList";
import QuickAddTask from "@/components/widgets/QuickAddTask";
import QuickAddSubject from "@/components/widgets/QuickAddSubject";
import QuickAddExam from "@/components/widgets/QuickAddExam";
import GoalList from "@/components/widgets/GoalList";
import QuickAddGoal from "@/components/widgets/QuickAddGoal";
import NotesBoard from "@/components/widgets/NotesBoard";
import CountdownList from "@/components/widgets/CountdownList";
import { getSettings } from "@/lib/settings";
import { isMicrosoftConnected } from "@/lib/microsoft";
import { getUpcomingOutlookEvents } from "@/lib/microsoftData";

export default async function EstudiosPage() {
  const settings = await getSettings();
  const section = settings.sections.STUDY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const outlookConnected = await isMicrosoftConnected();

  const [subjects, tasks, exams, goals, notes, outlookEvents] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.task.findMany({
      where: { section: "STUDY", done: false },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: { subject: true },
    }),
    prisma.exam.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
      include: { subject: true },
    }),
    prisma.goal.findMany({ where: { section: "STUDY", archived: false }, orderBy: { createdAt: "desc" } }),
    prisma.note.findMany({ where: { section: "STUDY" }, orderBy: { updatedAt: "desc" } }),
    outlookConnected ? getUpcomingOutlookEvents(10) : Promise.resolve([]),
  ]);

  // Exams/tasks already synced to Outlook show up here too — exclude those to avoid duplicates.
  const syncedIds = new Set(
    [...exams, ...tasks]
      .map((item: { outlookEventId?: string | null }) => item.outlookEventId)
      .filter((id): id is string => Boolean(id))
  );
  const externalOutlookEvents = outlookEvents
    .filter((e) => !syncedIds.has(e.id))
    .map((e) => ({ id: `outlook-${e.id}`, title: e.title, date: e.date, section: "STUDY" as const }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: section.color }}>{section.label}</h1>
        <p className="text-sm text-muted mt-1">Asignaturas, exámenes y tareas de la carrera.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Asignaturas" className="lg:col-span-1">
          <ul className="space-y-2 mb-3">
            {subjects.length === 0 && <p className="text-sm text-muted">Sin asignaturas todavía.</p>}
            {subjects.map((s: (typeof subjects)[number]) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span>{s.name}</span>
                {s.credits && <span className="text-xs text-muted">{s.credits} ECTS</span>}
              </li>
            ))}
          </ul>
          <QuickAddSubject />
        </Card>

        <Card title="Próximos exámenes" className="lg:col-span-2">
          <ul className="divide-y divide-border mb-3">
            {exams.length === 0 && <p className="text-sm text-muted py-2">Sin exámenes próximos.</p>}
            {exams.map((e: (typeof exams)[number]) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">{e.subject.name}</span>
                <span className="text-muted">{e.notes}</span>
                <span className="text-xs font-mono">
                  {new Date(e.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
          <QuickAddExam subjects={subjects} />
        </Card>

        <Card title="Tareas" className="lg:col-span-2">
          <QuickAddTask section="STUDY" subjects={subjects} />
          <TaskList tasks={tasks} />
        </Card>

        <Card title="Objetivos académicos">
          <GoalList goals={goals} />
          <QuickAddGoal section="STUDY" />
        </Card>

        <Card title="Notas y apuntes" className="lg:col-span-3">
          <NotesBoard notes={notes} section="STUDY" />
        </Card>

        {outlookConnected ? (
          <Card title="Próximo en Outlook" className="lg:col-span-3">
            <CountdownList events={externalOutlookEvents} sectionColors={{ STUDY: section.color }} />
          </Card>
        ) : (
          <p className="text-xs text-muted lg:col-span-3">
            Conecta tu cuenta de Microsoft en{" "}
            <a href="/ajustes" className="text-accent hover:brightness-110">
              Ajustes
            </a>{" "}
            para ver aquí lo que tengas en tu Outlook Calendar, y para que tus tareas/exámenes se sincronicen ahí.
          </p>
        )}
      </div>
    </div>
  );
}
