import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import TaskList from "@/components/widgets/TaskList";
import QuickAddTask from "@/components/widgets/QuickAddTask";
import HabitTracker from "@/components/widgets/HabitTracker";
import GoalList from "@/components/widgets/GoalList";
import CountdownList from "@/components/widgets/CountdownList";
import WeekView from "@/components/widgets/WeekView";
import QuickAddHabit from "@/components/widgets/QuickAddHabit";
import QuickAddGoal from "@/components/widgets/QuickAddGoal";
import QuickAddEvent from "@/components/widgets/QuickAddEvent";
import { getSettings } from "@/lib/settings";
import { isGoogleConnected } from "@/lib/google";
import { getUpcomingCalendarEvents, getRecentDriveFiles, getGmailSummary } from "@/lib/googleData";
import GoogleCalendarWidget from "@/components/widgets/GoogleCalendarWidget";
import GoogleDriveWidget from "@/components/widgets/GoogleDriveWidget";
import GmailWidget from "@/components/widgets/GmailWidget";
import { isMicrosoftConnected } from "@/lib/microsoft";
import { getOutlookMailSummary } from "@/lib/microsoftData";
import OutlookWidget from "@/components/widgets/OutlookWidget";

export default async function DashboardPage() {
  const settings = await getSettings();
  const googleConnected = await isGoogleConnected();
  const [googleEvents, driveFiles, gmailSummary] = googleConnected
    ? await Promise.all([getUpcomingCalendarEvents(20), getRecentDriveFiles(), getGmailSummary()])
    : [[], [], null];

  const outlookConnected = await isMicrosoftConnected();
  const outlookSummary = outlookConnected ? await getOutlookMailSummary() : null;
  const sectionColors = {
    STUDY: settings.sections.STUDY.color,
    ARUS: settings.sections.ARUS.color,
    PERSONAL: settings.sections.PERSONAL.color,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAhead = new Date(today);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const [pendingTasks, habits, goals, upcomingEvents, upcomingExams, weekTasks] = await Promise.all([
    prisma.task.findMany({
      where: { done: false },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 8,
      include: { subject: true },
    }),
    prisma.habit.findMany({
      where: { archived: false },
      include: { logs: { orderBy: { date: "desc" }, take: 30 } },
    }),
    prisma.goal.findMany({ where: { archived: false }, orderBy: { createdAt: "desc" } }),
    prisma.eventCountdown.findMany({ where: { date: { gte: today } }, orderBy: { date: "asc" }, take: 6 }),
    prisma.exam.findMany({ where: { date: { gte: today } }, orderBy: { date: "asc" }, take: 6, include: { subject: true } }),
    prisma.task.findMany({ where: { done: false, dueDate: { gte: today, lte: weekAhead } }, include: { subject: true } }),
  ]);

  // Google Calendar events that already correspond to a local task/exam/event
  // (created via sync) are excluded here to avoid showing the same thing twice.
  const syncedGoogleEventIds = new Set(
    [...weekTasks, ...upcomingExams, ...upcomingEvents]
      .map((item: { googleEventId: string | null }) => item.googleEventId)
      .filter((id): id is string => Boolean(id))
  );
  const externalGoogleEvents = googleEvents.filter((e) => !syncedGoogleEventIds.has(e.id));

  const weekItems = [
    ...weekTasks.filter((t: (typeof weekTasks)[number]) => t.dueDate).map((t: (typeof weekTasks)[number]) => ({
      id: `task-${t.id}`,
      title: t.title,
      date: t.dueDate as Date,
      color: sectionColors[t.section],
    })),
    ...upcomingExams.map((e: (typeof upcomingExams)[number]) => ({
      id: `exam-${e.id}`,
      title: `Examen ${e.subject.name}`,
      date: e.date,
      color: sectionColors.STUDY,
    })),
    ...externalGoogleEvents.map((e) => ({
      id: `google-${e.id}`,
      title: e.title,
      date: e.date,
      color: "#4285F4",
    })),
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Buenas, hoy toca dar caña</h1>
        <p className="text-sm text-muted mt-1">
          {today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      <Card title="Semana">
        <WeekView items={weekItems} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Tareas pendientes" className="lg:col-span-2">
          <QuickAddTask section="PERSONAL" />
          <TaskList tasks={pendingTasks} />
        </Card>

        <Card title="Próximos eventos">
          <CountdownList
            events={[
              ...upcomingEvents,
              ...upcomingExams.map((e: (typeof upcomingExams)[number]) => ({
                id: `exam-${e.id}`,
                title: `Examen ${e.subject.name}`,
                date: e.date,
                section: "STUDY",
              })),
            ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
            sectionColors={sectionColors}
          />
          <QuickAddEvent section="PERSONAL" />
        </Card>

        <Card title="Hábitos">
          <HabitTracker habits={habits} />
          <QuickAddHabit section="PERSONAL" />
        </Card>

        <Card title="Objetivos del año" className="lg:col-span-2">
          <GoalList goals={goals} />
          <QuickAddGoal section="PERSONAL" />
        </Card>

        {googleConnected && (
          <>
            <Card title="Google Calendar">
              <GoogleCalendarWidget events={externalGoogleEvents.slice(0, 8)} />
            </Card>

            <Card title="Google Drive">
              <GoogleDriveWidget files={driveFiles} />
            </Card>

            <Card title="Gmail">
              <GmailWidget summary={gmailSummary} />
            </Card>
          </>
        )}

        {outlookConnected && (
          <Card title="Outlook">
            <OutlookWidget summary={outlookSummary} />
          </Card>
        )}
      </div>

      {(!googleConnected || !outlookConnected) && (
        <p className="text-xs text-muted">
          Conecta tus cuentas en{" "}
          <a href="/ajustes" className="text-accent hover:brightness-110">
            Ajustes
          </a>{" "}
          para ver aquí tu Calendar, Drive, Gmail y Outlook.
        </p>
      )}
    </div>
  );
}
