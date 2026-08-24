import type { GoogleDriveFile } from "@/lib/googleData";

export default function GoogleDriveWidget({ files }: { files: GoogleDriveFile[] }) {
  if (files.length === 0) {
    return <p className="text-sm text-muted py-4">Sin archivos recientes en Drive.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {files.map((file) => (
        <li key={file.id} className="flex items-center gap-2 py-2 text-sm">
          {file.iconLink && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.iconLink} alt="" className="h-4 w-4 shrink-0" />
          )}
          {file.webViewLink ? (
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-accent transition-colors"
            >
              {file.name}
            </a>
          ) : (
            <span className="truncate">{file.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
