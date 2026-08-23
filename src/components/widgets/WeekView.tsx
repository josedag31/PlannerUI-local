type WeekItem = {
  id: string;
  title: string;
  date: Date;
  color: string;
};

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function WeekView({ items }: { items: WeekItem[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = startOfWeek(today);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, i) => {
        const dayItems = items.filter((it) => {
          const d = new Date(it.date);
          return d.toDateString() === day.toDateString();
        });
        const isToday = day.toDateString() === today.toDateString();
        return (
          <div key={i} className={`rounded-lg p-2 min-h-[110px] ${isToday ? "bg-surface-2 border border-accent/40" : "bg-surface-2/40"}`}>
            <div className={`text-[11px] font-medium mb-1.5 ${isToday ? "text-accent" : "text-muted"}`}>
              {DAY_LABELS[i]} {day.getDate()}
            </div>
            <div className="space-y-1">
              {dayItems.slice(0, 4).map((it) => (
                <div
                  key={it.id}
                  className="text-[10px] leading-tight rounded px-1 py-0.5 truncate"
                  style={{ background: `${it.color}22`, color: it.color }}
                  title={it.title}
                >
                  {it.title}
                </div>
              ))}
              {dayItems.length > 4 && (
                <div className="text-[10px] text-muted">+{dayItems.length - 4} más</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
