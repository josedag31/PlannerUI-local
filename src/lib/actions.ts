"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Priority, Section } from "@/generated/prisma/client";
import { isGoogleConnected } from "@/lib/google";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/googleData";
import { isMicrosoftConnected } from "@/lib/microsoft";
import { createOutlookCalendarEvent, deleteOutlookCalendarEvent } from "@/lib/microsoftData";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Combines a `<input type="date">` value with an optional `<input type="time">` value. */
function combineDateAndTime(dateRaw: string, timeRaw: string): { date: Date; hasTime: boolean } | null {
  if (!dateRaw) return null;
  const hasTime = Boolean(timeRaw);
  const date = new Date(hasTime ? `${dateRaw}T${timeRaw}` : `${dateRaw}T00:00`);
  return { date, hasTime };
}

/**
 * Pushes an item to whichever calendar belongs to its section: ARUS → Google
 * (cuenta ARUS), Estudios/Personal → Google (cuenta Personal) — salvo que
 * Outlook esté conectado, en cuyo caso Estudios usa Outlook (aparcado por
 * defecto: la Uni del usuario solo permite registrar la app de Microsoft
 * desde una cuenta personal, así que de momento no está conectado).
 * Best-effort: never throws, returns nulls if that section's account isn't
 * connected or the call fails.
 */
async function syncToSectionCalendar(
  section: Section,
  item: { title: string; start: Date; hasTime: boolean; notes?: string | null }
): Promise<{ googleEventId: string | null; outlookEventId: string | null }> {
  if (section === "ARUS") {
    if (await isGoogleConnected("ARUS")) {
      return { googleEventId: await createCalendarEvent(item, "ARUS"), outlookEventId: null };
    }
  } else if (section === "STUDY" && (await isMicrosoftConnected())) {
    return { googleEventId: null, outlookEventId: await createOutlookCalendarEvent(item) };
  } else {
    if (await isGoogleConnected("PERSONAL")) {
      return { googleEventId: await createCalendarEvent(item, "PERSONAL"), outlookEventId: null };
    }
  }
  return { googleEventId: null, outlookEventId: null };
}

async function deleteSectionCalendarEvent(
  section: Section,
  googleEventId: string | null,
  outlookEventId: string | null
) {
  if (googleEventId) {
    await deleteCalendarEvent(googleEventId, section === "ARUS" ? "ARUS" : "PERSONAL");
  }
  if (outlookEventId) {
    await deleteOutlookCalendarEvent(outlookEventId);
  }
}

// ---------- Tasks ----------

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const section = String(formData.get("section")) as Section;
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  const dueTimeRaw = String(formData.get("dueTime") ?? "");
  const priority = (String(formData.get("priority") ?? "MEDIUM")) as Priority;
  const subjectId = String(formData.get("subjectId") ?? "") || null;

  const combined = combineDateAndTime(dueDateRaw, dueTimeRaw);

  let googleEventId: string | null = null;
  let outlookEventId: string | null = null;
  if (combined) {
    ({ googleEventId, outlookEventId } = await syncToSectionCalendar(section, {
      title,
      start: combined.date,
      hasTime: combined.hasTime,
    }));
  }

  await prisma.task.create({
    data: {
      title,
      section,
      priority,
      dueDate: combined?.date ?? null,
      subjectId,
      googleEventId,
      outlookEventId,
    },
  });
  revalidatePath("/");
  revalidatePath("/estudios");
  revalidatePath("/arus");
  revalidatePath("/personal");
}

export async function toggleTask(id: string, done: boolean) {
  const task = await prisma.task.update({
    where: { id },
    data: { done, doneAt: done ? new Date() : null },
  });

  if (done && (task.googleEventId || task.outlookEventId)) {
    await deleteSectionCalendarEvent(task.section, task.googleEventId, task.outlookEventId);
    await prisma.task.update({ where: { id }, data: { googleEventId: null, outlookEventId: null } });
  }

  revalidatePath("/");
  revalidatePath("/estudios");
  revalidatePath("/arus");
  revalidatePath("/personal");
}

export async function deleteTask(id: string) {
  const task = await prisma.task.delete({ where: { id } });
  await deleteSectionCalendarEvent(task.section, task.googleEventId, task.outlookEventId);
  revalidatePath("/");
  revalidatePath("/estudios");
  revalidatePath("/arus");
  revalidatePath("/personal");
}

// ---------- Habits ----------

export async function createHabit(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const section = String(formData.get("section")) as Section;
  const targetPerWeek = Number(formData.get("targetPerWeek") ?? 7);

  await prisma.habit.create({ data: { name, section, targetPerWeek } });
  revalidatePath("/");
  revalidatePath("/personal");
}

export async function toggleHabitToday(habitId: string) {
  const today = startOfDay(new Date());
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date: today } },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitLog.create({ data: { habitId, date: today, done: true } });
  }
  revalidatePath("/");
  revalidatePath("/personal");
}

// ---------- Goals ----------

export async function createGoal(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const section = String(formData.get("section")) as Section;
  const targetDateRaw = String(formData.get("targetDate") ?? "");

  await prisma.goal.create({
    data: {
      title,
      section,
      targetDate: targetDateRaw ? new Date(targetDateRaw) : null,
    },
  });
  revalidatePath("/");
  revalidatePath("/estudios");
  revalidatePath("/arus");
  revalidatePath("/personal");
}

export async function updateGoalProgress(id: string, progress: number) {
  const clamped = Math.max(0, Math.min(100, progress));
  await prisma.goal.update({ where: { id }, data: { progress: clamped } });
  revalidatePath("/");
  revalidatePath("/estudios");
  revalidatePath("/arus");
  revalidatePath("/personal");
}

// ---------- Subjects & Exams ----------

export async function createSubject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const credits = formData.get("credits") ? Number(formData.get("credits")) : null;
  await prisma.subject.create({ data: { name, credits } });
  revalidatePath("/estudios");
}

export async function createExam(formData: FormData) {
  const subjectId = String(formData.get("subjectId") ?? "");
  const dateRaw = String(formData.get("date") ?? "");
  const timeRaw = String(formData.get("time") ?? "");
  if (!subjectId || !dateRaw) return;
  const notes = String(formData.get("notes") ?? "") || null;

  const combined = combineDateAndTime(dateRaw, timeRaw);
  if (!combined) return;

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });

  const { googleEventId, outlookEventId } = await syncToSectionCalendar(subject?.section ?? "STUDY", {
    title: `Examen ${subject?.name ?? ""}`.trim(),
    start: combined.date,
    hasTime: combined.hasTime,
    notes,
  });

  await prisma.exam.create({ data: { subjectId, date: combined.date, notes, googleEventId, outlookEventId } });
  revalidatePath("/estudios");
  revalidatePath("/");
}

// ---------- Events / countdowns ----------

export async function createEvent(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const dateRaw = String(formData.get("date") ?? "");
  const timeRaw = String(formData.get("time") ?? "");
  if (!title || !dateRaw) return;
  const section = String(formData.get("section")) as Section;

  const combined = combineDateAndTime(dateRaw, timeRaw);
  if (!combined) return;

  const { googleEventId, outlookEventId } = await syncToSectionCalendar(section, {
    title,
    start: combined.date,
    hasTime: combined.hasTime,
  });

  await prisma.eventCountdown.create({
    data: { title, date: combined.date, section, googleEventId, outlookEventId },
  });
  revalidatePath("/");
  revalidatePath("/estudios");
  revalidatePath("/arus");
  revalidatePath("/personal");
}

// ---------- Notes ----------

export async function createNote(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  if (!title) return;
  const section = String(formData.get("section")) as Section;
  const linkedFile = String(formData.get("linkedFile") ?? "") || null;
  await prisma.note.create({ data: { title, content, section, linkedFile } });
  revalidatePath("/estudios");
  revalidatePath("/arus");
  revalidatePath("/personal");
}

// ---------- Settings ----------

export async function updateAppSettings(formData: FormData) {
  const appName = String(formData.get("appName") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  if (!appName) return;

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { appName, tagline },
    create: { id: 1, appName, tagline },
  });
  revalidatePath("/", "layout");
}

export async function updateSectionConfig(formData: FormData) {
  const key = String(formData.get("key") ?? "") as Section;
  const label = String(formData.get("label") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  if (!key || !label || !color || !icon) return;

  await prisma.sectionConfig.upsert({
    where: { key },
    update: { label, color, icon },
    create: { key, label, color, icon },
  });
  revalidatePath("/", "layout");
}

export async function updateGoogleOAuthConfig(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "").trim();
  const clientSecret = String(formData.get("clientSecret") ?? "").trim();
  const redirectUri = String(formData.get("redirectUri") ?? "").trim();
  if (!clientId || !clientSecret || !redirectUri) return;

  await prisma.googleOAuthConfig.upsert({
    where: { id: 1 },
    update: { clientId, clientSecret, redirectUri },
    create: { id: 1, clientId, clientSecret, redirectUri },
  });
  revalidatePath("/ajustes");
}

export async function updateMicrosoftOAuthConfig(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "").trim();
  const clientSecret = String(formData.get("clientSecret") ?? "").trim();
  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const redirectUri = String(formData.get("redirectUri") ?? "").trim();
  if (!clientId || !clientSecret || !tenantId || !redirectUri) return;

  await prisma.microsoftOAuthConfig.upsert({
    where: { id: 1 },
    update: { clientId, clientSecret, tenantId, redirectUri },
    create: { id: 1, clientId, clientSecret, tenantId, redirectUri },
  });
  revalidatePath("/ajustes");
}
