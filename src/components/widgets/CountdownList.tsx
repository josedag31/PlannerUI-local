type EventItem = {
  id: string;
  title: string;
  date: Date;
  section: string;
};

function daysUntil(date: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function hasExplicitTime(date: Date) {
  const d = new Date(date);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

export default function CountdownList({
  events,
  sectionColors = {},
}: {
  events: EventItem[];
  sectionColors?: Record<string, string>;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted py-4">Sin eventos próximos.</p>;
  }

  return (
    <ul className="space-y-2">
      {events.map((event) => {
        const days = daysUntil(event.date);
        return (
          <li key={event.id} className="flex items-center gap-3">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: sectionColors[event.section] ?? "var(--muted)" }}
            />
            <span className="flex-1 text-sm truncate">{event.title}</span>
            {hasExplicitTime(event.date) && (
              <span className="text-xs text-muted">
                {new Date(event.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <span className="text-xs font-mono text-muted">
              {days === 0 ? "hoy" : days > 0 ? `${days}d` : `hace ${-days}d`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
