import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import TaskList from "@/components/widgets/TaskList";
import QuickAddTask from "@/components/widgets/QuickAddTask";
import HabitTracker from "@/components/widgets/HabitTracker";
import QuickAddHabit from "@/components/widgets/QuickAddHabit";
import GoalList from "@/components/widgets/GoalList";
import QuickAddGoal from "@/components/widgets/QuickAddGoal";
import CountdownList from "@/components/widgets/CountdownList";
import QuickAddEvent from "@/components/widgets/QuickAddEvent";
import NotesBoard from "@/components/widgets/NotesBoard";
import { getSettings } from "@/lib/settings";

export default async function PersonalPage() {
  const settings = await getSettings();
  const section = settings.sections.PERSONAL;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [tasks, habits, goals, events, notes] = await Promise.all([
    prisma.task.findMany({
      where: { section: "PERSONAL", done: false },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.habit.findMany({
      where: { section: "PERSONAL", archived: false },
      include: { logs: { orderBy: { date: "desc" }, take: 30 } },
    }),
    prisma.goal.findMany({ where: { section: "PERSONAL", archived: false }, orderBy: { createdAt: "desc" } }),
    prisma.eventCountdown.findMany({ where: { section: "PERSONAL", date: { gte: today } }, orderBy: { date: "asc" } }),
    prisma.note.findMany({ where: { section: "PERSONAL" }, orderBy: { updatedAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: section.color }}>{section.label}</h1>
        <p className="text-sm text-muted mt-1">Hábitos, objetivos y vida fuera de la carrera.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Tareas" className="lg:col-span-2">
          <QuickAddTask section="PERSONAL" />
          <TaskList tasks={tasks} />
        </Card>

        <Card title="Eventos">
          <CountdownList events={events} sectionColors={{ PERSONAL: section.color }} />
          <QuickAddEvent section="PERSONAL" />
        </Card>

        <Card title="Hábitos">
          <HabitTracker habits={habits} />
          <QuickAddHabit section="PERSONAL" />
        </Card>

        <Card title="Objetivos" className="lg:col-span-2">
          <GoalList goals={goals} />
          <QuickAddGoal section="PERSONAL" />
        </Card>

        <Card title="Notas" className="lg:col-span-3">
          <NotesBoard notes={notes} section="PERSONAL" />
        </Card>
      </div>
    </div>
  );
}
