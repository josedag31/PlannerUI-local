/**
 * Widgets que dependen de una llamada de red (Google, Microsoft). Se renderizan
 * dentro de su propio <Suspense> para que el dashboard aparezca al instante con
 * lo que sale de la BBDD local, y estas tarjetas se rellenen cuando la API
 * conteste — en vez de que una llamada lenta retrase la página entera.
 */
import { getRecentDriveFiles, getGmailSummary } from "@/lib/googleData";
import { getOutlookMailSummary } from "@/lib/microsoftData";
import GoogleDriveWidget from "@/components/widgets/GoogleDriveWidget";
import GmailWidget from "@/components/widgets/GmailWidget";
import OutlookWidget from "@/components/widgets/OutlookWidget";
import type { GoogleAccountLabel } from "@/generated/prisma/client";

/** Relleno con la forma aproximada de una lista, para que no salte el layout. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 py-1" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="skeleton h-4 w-4 shrink-0 rounded" />
          <div className="skeleton h-3.5" style={{ width: `${88 - i * 11}%` }} />
        </div>
      ))}
    </div>
  );
}

export async function DriveCardContent({
  account,
  folderId,
}: {
  account: GoogleAccountLabel;
  folderId: string | null;
}) {
  const files = await getRecentDriveFiles(8, account, folderId);
  return <GoogleDriveWidget files={files} />;
}

export async function GmailCardContent({ account }: { account: GoogleAccountLabel }) {
  const summary = await getGmailSummary(account);
  return <GmailWidget summary={summary} />;
}

export async function OutlookCardContent() {
  const summary = await getOutlookMailSummary();
  return <OutlookWidget summary={summary} />;
}
