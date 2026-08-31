import { prisma } from "@/lib/prisma";
import Card from "@/components/Card";
import DashboardGrid from "@/components/DashboardGrid";
import TaskList from "@/components/widgets/TaskList";
import QuickAddTask from "@/components/widgets/QuickAddTask";
import HabitTracker from "@/components/widgets/HabitTracker";
import GoalList from "@/components/widgets/GoalList";
import CountdownList from "@/components/widgets/CountdownList";
import WeekView from "@/components/widgets/WeekView";
import QuickAddHabit from "@/components/widgets/QuickAddHabit";
import QuickAddGoal from "@/components/widgets/QuickAddGoal";
import QuickAddEvent from "@/components/widgets/QuickAddEvent";
import ClockWidget from "@/components/widgets/ClockWidget";
import { getSettings } from "@/lib/settings";
import { isGoogleConnected, getAccountsNeedingReconnect } from "@/lib/google";
import ReconnectBanner from "@/components/ReconnectBanner";
import { getUpcomingCalendarEvents, getRecentDriveFiles, getGmailSummary } from "@/lib/googleData";
import GoogleCalendarWidget from "@/components/widgets/GoogleCalendarWidget";
import GoogleDriveWidget from "@/components/widgets/GoogleDriveWidget";
import GmailWidget from "@/components/widgets/GmailWidget";
import { isMicrosoftConnected } from "@/lib/microsoft";
import { getOutlookMailSummary } from "@/lib/microsoftData";
import OutlookWidget from "@/components/widgets/OutlookWidget";
import { getDashboardLayout } from "@/lib/dashboardLayout";
import { deleteEvent } from "@/lib/actions";
import { WIDGET_TITLES, type WidgetKey } from "@/lib/dashboardWidgets";
import type { GoogleAccountLabel } from "@/generated/prisma/client";

export default async function DashboardPage() {
  const settings = await getSettings();
  const layout = await getDashboardLayout();
  const accountsNeedingReconnect = await getAccountsNeedingReconnect();

  const calendarAccount: GoogleAccountLabel = settings.dashboardAccounts.calendar;
  const driveAccount: GoogleAccountLabel = settings.dashboardAccounts.drive;
  const gmailAccount: GoogleAccountLabel = settings.dashboardAccounts.gmail;

  const [calendarConnected, driveConnected, gmailConnected] = await Promise.all([
    isGoogleConnected(calendarAccount),
    isGoogleConnected(driveAccount),
    isGoogleConnected(gmailAccount),
  ]);

  const [googleEvents, driveFiles, gmailSummary] = await Promise.all([
    calendarConnected ? getUpcomingCalendarEvents(20, calendarAccount) : Promise.resolve([]),
    driveConnected ? getRecentDriveFiles(8, driveAccount, settings.driveFolderId) : Promise.resolve([]),
    gmailConnected ? getGmailSummary(gmailAccount) : Promise.resolve(null),
  ]);

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
    ...upcomingEvents.map((e: (typeof upcomingEvents)[number]) => ({
      id: `event-${e.id}`,
      title: e.title,
      date: e.date,
      color: sectionColors[e.section],
    })),
    ...externalGoogleEvents.map((e) => ({
      id: `google-${e.id}`,
      title: e.title,
      date: e.date,
      color: "#4285F4",
    })),
  ];

  const anyGoogleDisconnected = !calendarConnected || !driveConnected || !gmailConnected;

  const widgets: Partial<Record<WidgetKey, React.ReactNode>> = {
    week: (
      <Card title="Semana" className="lg:col-span-3">
        <WeekView items={weekItems} />
      </Card>
    ),
    tasks: (
      <Card title="Tareas pendientes" className="lg:col-span-2">
        <QuickAddTask section="PERSONAL" />
        <TaskList tasks={pendingTasks} />
      </Card>
    ),
    events: (
      <Card title="Próximos eventos">
        <CountdownList
          events={[
            ...upcomingEvents.map((e: (typeof upcomingEvents)[number]) => ({
              id: e.id,
              title: e.title,
              date: e.date,
              section: e.section,
              deletable: true,
            })),
            ...upcomingExams.map((e: (typeof upcomingExams)[number]) => ({
              id: `exam-${e.id}`,
              title: `Examen ${e.subject.name}`,
              date: e.date,
              section: "STUDY",
            })),
          ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
          sectionColors={sectionColors}
          onDeleteEvent={deleteEvent}
        />
        <QuickAddEvent section="PERSONAL" />
      </Card>
    ),
    habits: (
      <Card title="Hábitos">
        <HabitTracker habits={habits} />
        <QuickAddHabit section="PERSONAL" />
      </Card>
    ),
    goals: (
      <Card title="Objetivos del año" className="lg:col-span-2">
        <GoalList goals={goals} />
        <QuickAddGoal section="PERSONAL" />
      </Card>
    ),
    clock: (
      <Card title="Reloj">
        <ClockWidget />
      </Card>
    ),
    googleCalendar: calendarConnected ? (
      <Card title="Google Calendar">
        <GoogleCalendarWidget events={externalGoogleEvents.slice(0, 8)} />
      </Card>
    ) : undefined,
    googleDrive: driveConnected ? (
      <Card title="Google Drive">
        <GoogleDriveWidget files={driveFiles} />
      </Card>
    ) : undefined,
    gmail: gmailConnected ? (
      <Card title="Gmail">
        <GmailWidget summary={gmailSummary} />
      </Card>
    ) : undefined,
    outlook: outlookConnected ? (
      <Card title="Outlook">
        <OutlookWidget summary={outlookSummary} />
      </Card>
    ) : undefined,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Buenas, hoy toca dar caña</h1>
        <p className="text-sm text-muted mt-1">
          {today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      <ReconnectBanner accounts={accountsNeedingReconnect} />

      <DashboardGrid layout={layout} widgets={widgets} widgetTitles={WIDGET_TITLES} />

      {(anyGoogleDisconnected || !outlookConnected) && (
        <p className="text-xs text-muted">
          Conecta tus cuentas en{" "}
          <a href="/ajustes" className="text-accent hover:brightness-110">
            Ajustes
          </a>{" "}
          para ver aquí tu Calendar, Drive, Gmail y Outlook — y elegir qué cuenta usa cada uno.
        </p>
      )}
    </div>
  );
}
