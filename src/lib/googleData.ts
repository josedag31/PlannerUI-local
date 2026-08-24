import { google } from "googleapis";
import { getAuthenticatedClient } from "@/lib/google";
import type { GoogleAccountLabel } from "@/generated/prisma/client";

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  date: Date;
};

/**
 * Pushes a local item to Google Calendar as a new event. Best-effort: returns
 * null (never throws) if Google isn't connected or the API call fails, so
 * callers can save locally regardless of calendar sync succeeding.
 */
export async function createCalendarEvent(
  input: {
    title: string;
    start: Date;
    hasTime: boolean;
    notes?: string | null;
    durationMinutes?: number | null;
  },
  label: GoogleAccountLabel = "PERSONAL"
): Promise<string | null> {
  const auth = await getAuthenticatedClient(label);
  if (!auth) return null;

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const durationMs = input.hasTime
      ? (input.durationMinutes ?? 60) * 60 * 1000
      : 24 * 60 * 60 * 1000;
    const end = new Date(input.start.getTime() + durationMs);

    const { data } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: input.title,
        description: input.notes ?? undefined,
        start: input.hasTime
          ? { dateTime: input.start.toISOString() }
          : { date: input.start.toISOString().slice(0, 10) },
        end: input.hasTime
          ? { dateTime: end.toISOString() }
          : { date: end.toISOString().slice(0, 10) },
      },
    });

    return data.id ?? null;
  } catch (err) {
    console.error("[google] createCalendarEvent failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string, label: GoogleAccountLabel = "PERSONAL"): Promise<void> {
  const auth = await getAuthenticatedClient(label);
  if (!auth) return;

  try {
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch (err) {
    console.error("[google] deleteCalendarEvent failed:", err instanceof Error ? err.message : err);
  }
}

export async function getUpcomingCalendarEvents(
  maxResults = 8,
  label: GoogleAccountLabel = "PERSONAL"
): Promise<GoogleCalendarEvent[]> {
  const auth = await getAuthenticatedClient(label);
  if (!auth) return [];

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    return (data.items ?? [])
      .filter((event) => event.start?.dateTime || event.start?.date)
      .map((event) => ({
        id: event.id ?? crypto.randomUUID(),
        title: event.summary ?? "(sin título)",
        date: new Date(event.start!.dateTime ?? event.start!.date!),
      }));
  } catch (err) {
    console.error("[google] request failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export type GoogleDriveFile = {
  id: string;
  name: string;
  webViewLink: string | null;
  modifiedTime: string | null;
  iconLink: string | null;
};

export async function getRecentDriveFiles(
  maxResults = 8,
  label: GoogleAccountLabel = "PERSONAL"
): Promise<GoogleDriveFile[]> {
  const auth = await getAuthenticatedClient(label);
  if (!auth) return [];

  try {
    const drive = google.drive({ version: "v3", auth });
    const { data } = await drive.files.list({
      pageSize: maxResults,
      orderBy: "modifiedTime desc",
      fields: "files(id, name, webViewLink, modifiedTime, iconLink)",
    });

    return (data.files ?? []).map((f) => ({
      id: f.id ?? "",
      name: f.name ?? "(sin nombre)",
      webViewLink: f.webViewLink ?? null,
      modifiedTime: f.modifiedTime ?? null,
      iconLink: f.iconLink ?? null,
    }));
  } catch (err) {
    console.error("[google] request failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function searchDriveFiles(
  query: string,
  maxResults = 10,
  label: GoogleAccountLabel = "PERSONAL"
): Promise<GoogleDriveFile[]> {
  const auth = await getAuthenticatedClient(label);
  if (!auth || !query.trim()) return [];

  try {
    const drive = google.drive({ version: "v3", auth });
    const { data } = await drive.files.list({
      pageSize: maxResults,
      q: `name contains '${query.replace(/'/g, "")}' and trashed = false`,
      fields: "files(id, name, webViewLink, modifiedTime, iconLink)",
    });

    return (data.files ?? []).map((f) => ({
      id: f.id ?? "",
      name: f.name ?? "(sin nombre)",
      webViewLink: f.webViewLink ?? null,
      modifiedTime: f.modifiedTime ?? null,
      iconLink: f.iconLink ?? null,
    }));
  } catch (err) {
    console.error("[google] request failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export type GmailSummary = {
  unreadCount: number;
  latest: { id: string; subject: string; from: string }[];
};

export async function getGmailSummary(label: GoogleAccountLabel = "PERSONAL"): Promise<GmailSummary | null> {
  const auth = await getAuthenticatedClient(label);
  if (!auth) return null;

  try {
    const gmail = google.gmail({ version: "v1", auth });
    const list = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread in:inbox",
      maxResults: 5,
    });

    const messages = list.data.messages ?? [];
    const latest = await Promise.all(
      messages.map(async (m) => {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: m.id!,
          format: "metadata",
          metadataHeaders: ["Subject", "From"],
        });
        const headers = msg.data.payload?.headers ?? [];
        const subject = headers.find((h) => h.name === "Subject")?.value ?? "(sin asunto)";
        const from = headers.find((h) => h.name === "From")?.value ?? "";
        return { id: m.id!, subject, from };
      })
    );

    return {
      unreadCount: list.data.resultSizeEstimate ?? messages.length,
      latest,
    };
  } catch (err) {
    console.error("[google] request failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
