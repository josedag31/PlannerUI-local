import { getMicrosoftAccessToken } from "@/lib/microsoft";

export type OutlookSummary = {
  unreadCount: number;
  latest: { id: string; subject: string; from: string }[];
};

type GraphMessage = {
  id: string;
  subject?: string;
  from?: { emailAddress?: { address?: string; name?: string } };
};

export async function getOutlookMailSummary(): Promise<OutlookSummary | null> {
  const token = await getMicrosoftAccessToken();
  if (!token) return null;

  try {
    const [inboxRes, messagesRes] = await Promise.all([
      fetch("https://graph.microsoft.com/v1.0/me/mailFolders/inbox", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(
        "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$filter=isRead eq false&$top=5&$select=subject,from&$orderby=receivedDateTime desc",
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    ]);

    if (!inboxRes.ok) throw new Error(await inboxRes.text());
    if (!messagesRes.ok) throw new Error(await messagesRes.text());

    const inbox: { unreadItemCount?: number } = await inboxRes.json();
    const messages: { value?: GraphMessage[] } = await messagesRes.json();

    const latest = (messages.value ?? []).map((m) => ({
      id: m.id,
      subject: m.subject || "(sin asunto)",
      from: m.from?.emailAddress?.address || m.from?.emailAddress?.name || "",
    }));

    return { unreadCount: inbox.unreadItemCount ?? latest.length, latest };
  } catch (err) {
    console.error("[microsoft] request failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export type OutlookCalendarEvent = {
  id: string;
  title: string;
  date: Date;
};

type GraphEvent = {
  id: string;
  subject?: string;
  start?: { dateTime?: string };
  isAllDay?: boolean;
};

export async function getUpcomingOutlookEvents(maxResults = 8): Promise<OutlookCalendarEvent[]> {
  const token = await getMicrosoftAccessToken();
  if (!token) return [];

  try {
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 24 * 60 * 60 * 1000);
    const url = new URL("https://graph.microsoft.com/v1.0/me/calendarView");
    url.searchParams.set("startDateTime", start.toISOString());
    url.searchParams.set("endDateTime", end.toISOString());
    url.searchParams.set("$orderby", "start/dateTime");
    url.searchParams.set("$top", String(maxResults));
    url.searchParams.set("$select", "id,subject,start,isAllDay");

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="UTC"' } });
    if (!res.ok) throw new Error(await res.text());

    const data: { value?: GraphEvent[] } = await res.json();
    return (data.value ?? [])
      .filter((e) => e.start?.dateTime)
      .map((e) => ({
        id: e.id,
        title: e.subject || "(sin título)",
        date: new Date(`${e.start!.dateTime}Z`),
      }));
  } catch (err) {
    console.error("[microsoft] request failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/** Best-effort: returns null (never throws) if not connected or the API call fails. */
export async function createOutlookCalendarEvent(input: {
  title: string;
  start: Date;
  hasTime: boolean;
  notes?: string | null;
  durationMinutes?: number | null;
}): Promise<string | null> {
  const token = await getMicrosoftAccessToken();
  if (!token) return null;

  try {
    const durationMs = input.hasTime ? (input.durationMinutes ?? 60) * 60 * 1000 : 24 * 60 * 60 * 1000;
    const end = new Date(input.start.getTime() + durationMs);
    const toGraphDateTime = (d: Date) => d.toISOString().replace("Z", "");

    const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: input.title,
        body: input.notes ? { contentType: "text", content: input.notes } : undefined,
        isAllDay: !input.hasTime,
        start: { dateTime: toGraphDateTime(input.start), timeZone: "UTC" },
        end: { dateTime: toGraphDateTime(end), timeZone: "UTC" },
      }),
    });
    if (!res.ok) throw new Error(await res.text());

    const data: { id: string } = await res.json();
    return data.id;
  } catch (err) {
    console.error("[microsoft] createOutlookCalendarEvent failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function deleteOutlookCalendarEvent(eventId: string): Promise<void> {
  const token = await getMicrosoftAccessToken();
  if (!token) return;

  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok && res.status !== 404) throw new Error(await res.text());
  } catch (err) {
    console.error("[microsoft] deleteOutlookCalendarEvent failed:", err instanceof Error ? err.message : err);
  }
}
