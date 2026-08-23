"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Section } from "@/generated/prisma/client";

type SectionInfo = { label: string; color: string; icon: string };

const ROUTES: Record<Section, string> = {
  STUDY: "/estudios",
  ARUS: "/arus",
  PERSONAL: "/personal",
};

export default function Sidebar({
  appName,
  tagline,
  sections,
}: {
  appName: string;
  tagline: string;
  sections: Record<Section, SectionInfo>;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: "◆", color: undefined as string | undefined },
    ...(Object.keys(ROUTES) as Section[]).map((key) => ({
      href: ROUTES[key],
      label: sections[key].label,
      icon: sections[key].icon,
      color: sections[key].color,
    })),
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-border">
        <div className="text-lg font-bold tracking-tight text-accent truncate" title={appName}>
          {appName}
        </div>
        <div className="text-xs text-muted mt-1 truncate" title={tagline}>
          {tagline}
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-surface-2 text-foreground"
                  : "text-muted hover:text-foreground hover:bg-surface-2/60"
              }`}
            >
              <span style={{ color: link.color ?? (active ? "var(--accent)" : undefined) }}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/ajustes"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/ajustes"
              ? "bg-surface-2 text-foreground"
              : "text-muted hover:text-foreground hover:bg-surface-2/60"
          }`}
        >
          <span>⚙</span>
          Ajustes
        </Link>
      </nav>
      <div className="px-6 py-4 border-t border-border text-[11px] text-muted">
        Planner local · SQLite
      </div>
    </aside>
  );
}
