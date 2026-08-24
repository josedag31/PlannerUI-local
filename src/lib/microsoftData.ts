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
