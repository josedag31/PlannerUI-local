import type { Section } from "@/generated/prisma/client";
import { isGoogleConnected } from "@/lib/google";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/googleData";
import { isMicrosoftConnected } from "@/lib/microsoft";
import { createOutlookCalendarEvent, deleteOutlookCalendarEvent } from "@/lib/microsoftData";
/**
 * Pushes an item to whichever calendar belongs to its section: ARUS → Google
 * (cuenta ARUS), Estudios/Personal → Google (cuenta Personal) — salvo que
 * Outlook esté conectado, en cuyo caso Estudios usa Outlook (aparcado por
 * defecto: la Uni del usuario solo permite registrar la app de Microsoft
 * desde una cuenta personal, así que de momento no está conectado).
 * Best-effort: never throws, returns nulls if that section's account isn't
 * connected or the call fails.
 */
export async function syncToSectionCalendar(
  section: Section,
  item: { title: string; start: Date; hasTime: boolean; notes?: string | null; durationMinutes?: number | null }
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

export async function deleteSectionCalendarEvent(
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
