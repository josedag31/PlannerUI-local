"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Priority, Section } from "@/generated/prisma/client";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// ---------- Tasks ----------

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const section = String(formData.get("section")) as Section;
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  const priority = (String(formData.get("priority") ?? "MEDIUM")) as Priority;
  const subjectId = String(formData.get("subjectId") ?? "") || null;

  await prisma.task.create({
    data: {
      title,
      section,
      priority,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      subjectId,
    },
  });
  revalidatePath("/");
  revalidatePath("/estudios");
  revalidatePath("/arus");
  revalidatePath("/personal");
}

export async function toggleTask(id: string, done: boolean) {
  await prisma.task.update({
    where: { id },
    data: { done, doneAt: done ? new Date() : null },
  });
  revalidatePath("/");
  revalidatePath("/estudios");
  revalidatePath("/arus");
  revalidatePath("/personal");
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
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
  if (!subjectId || !dateRaw) return;
  const notes = String(formData.get("notes") ?? "") || null;
  await prisma.exam.create({ data: { subjectId, date: new Date(dateRaw), notes } });
  revalidatePath("/estudios");
  revalidatePath("/");
}

// ---------- Events / countdowns ----------

export async function createEvent(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const dateRaw = String(formData.get("date") ?? "");
  if (!title || !dateRaw) return;
  const section = String(formData.get("section")) as Section;
  await prisma.eventCountdown.create({ data: { title, date: new Date(dateRaw), section } });
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
