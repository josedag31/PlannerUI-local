import type { GmailSummary } from "@/lib/googleData";

export default function GmailWidget({ summary }: { summary: GmailSummary | null }) {
  if (!summary || summary.unreadCount === 0) {
    return <p className="text-sm text-muted py-4">Sin correos sin leer.</p>;
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2">
        {summary.unreadCount} sin leer
      </p>
      <ul className="divide-y divide-border">
        {summary.latest.map((mail) => (
          <li key={mail.id} className="py-2">
            <div className="text-sm truncate">{mail.subject}</div>
            <div className="text-xs text-muted truncate">{mail.from}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
