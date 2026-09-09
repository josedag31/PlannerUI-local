"use client";

import { useEffect, useState } from "react";

export default function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return <div className="h-16" />;
  }

  return (
    <div className="text-center py-2">
      <div className="kpi-value text-4xl font-mono glow-text">
        {now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div className="kpi-label mt-1.5">
        {now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
      </div>
    </div>
  );
}
