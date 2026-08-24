import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import TaskList from "@/components/widgets/TaskList";
import QuickAddTask from "@/components/widgets/QuickAddTask";
import GoalList from "@/components/widgets/GoalList";
import QuickAddGoal from "@/components/widgets/QuickAddGoal";
import CountdownList from "@/components/widgets/CountdownList";
import QuickAddEvent from "@/components/widgets/QuickAddEvent";
import NotesBoard from "@/components/widgets/NotesBoard";
import GoogleDriveWidget from "@/components/widgets/GoogleDriveWidget";
import { getSettings } from "@/lib/settings";
import { isGoogleConnected } from "@/lib/google";
import { getRecentDriveFiles, getUpcomingCalendarEvents } from "@/lib/googleData";
import { deleteEvent } from "@/lib/actions";

export default async function ArusPage() {
  const settings = await getSettings();
  const section = settings.sections.ARUS;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const arusGoogleConnected = await isGoogleConnected("ARUS");

  const [tasks, goals, events, notes, driveFiles, arusGoogleEvents] = await Promise.all([
    prisma.task.findMany({
      where: { section: "ARUS", done: false },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.goal.findMany({ where: { section: "ARUS", archived: false }, orderBy: { createdAt: "desc" } }),
    prisma.eventCountdown.findMany({ where: { section: "ARUS", date: { gte: today } }, orderBy: { date: "asc" } }),
    prisma.note.findMany({ where: { section: "ARUS" }, orderBy: { updatedAt: "desc" } }),
    arusGoogleConnected ? getRecentDriveFiles(10, "ARUS") : Promise.resolve([]),
    arusGoogleConnected ? getUpcomingCalendarEvents(10, "ARUS") : Promise.resolve([]),
  ]);

  // Avoid showing the same item twice: once as a local event, once read back from Calendar.
  const syncedIds = new Set(events.map((e) => e.googleEventId).filter((id): id is string => Boolean(id)));
  const localArusEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    section: e.section,
    deletable: true,
  }));
  const externalArusEvents = arusGoogleEvents
    .filter((e) => !syncedIds.has(e.id))
    .map((e) => ({ id: `google-${e.id}`, title: e.title, date: e.date, section: "ARUS" as const }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: section.color }}>{section.label}</h1>
        <p className="text-sm text-muted mt-1">Tareas de equipo, reuniones y objetivos técnicos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Tareas del equipo" className="lg:col-span-2">
          <QuickAddTask section="ARUS" />
          <TaskList tasks={tasks} />
        </Card>

        <Card title="Reuniones y eventos">
          <CountdownList
            events={[...localArusEvents, ...externalArusEvents].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )}
            sectionColors={{ ARUS: section.color }}
            onDeleteEvent={deleteEvent}
          />
          <QuickAddEvent section="ARUS" />
        </Card>

        <Card title="Objetivos técnicos" className="lg:col-span-2">
          <GoalList goals={goals} />
          <QuickAddGoal section="ARUS" />
        </Card>

        <Card title="Notas técnicas" className="lg:col-span-3">
          <NotesBoard notes={notes} section="ARUS" />
        </Card>

        {arusGoogleConnected ? (
          <Card title="Google Drive (ARUS)" className="lg:col-span-3">
            <GoogleDriveWidget files={driveFiles} />
          </Card>
        ) : (
          <p className="text-xs text-muted lg:col-span-3">
            Conecta la cuenta de Google de ARUS en{" "}
            <a href="/ajustes" className="text-accent hover:brightness-110">
              Ajustes
            </a>{" "}
            para ver aquí los archivos de Drive del equipo.
          </p>
        )}
      </div>
    </div>
  );
}
