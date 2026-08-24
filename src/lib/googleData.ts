import { google } from "googleapis";
import { getAuthenticatedClient } from "@/lib/google";

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  date: Date;
};

export async function getUpcomingCalendarEvents(maxResults = 8): Promise<GoogleCalendarEvent[]> {
  const auth = await getAuthenticatedClient();
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
  } catch {
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

export async function getRecentDriveFiles(maxResults = 8): Promise<GoogleDriveFile[]> {
  const auth = await getAuthenticatedClient();
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
  } catch {
    return [];
  }
}

export async function searchDriveFiles(query: string, maxResults = 10): Promise<GoogleDriveFile[]> {
  const auth = await getAuthenticatedClient();
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
  } catch {
    return [];
  }
}

export type GmailSummary = {
  unreadCount: number;
  latest: { id: string; subject: string; from: string }[];
};

export async function getGmailSummary(): Promise<GmailSummary | null> {
  const auth = await getAuthenticatedClient();
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
  } catch {
    return null;
  }
}
