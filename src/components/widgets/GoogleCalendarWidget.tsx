import type { GoogleCalendarEvent } from "@/lib/googleData";

export default function GoogleCalendarWidget({ events }: { events: GoogleCalendarEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted py-4">Sin eventos próximos en Google Calendar.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {events.map((event) => (
        <li key={event.id} className="flex items-center justify-between py-2 text-sm">
          <span className="truncate">{event.title}</span>
          <span className="text-xs text-muted shrink-0 ml-2">
            {new Date(event.date).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
