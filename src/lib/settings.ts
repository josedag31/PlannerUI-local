import { prisma } from "@/lib/prisma";
import type { Section, GoogleAccountLabel } from "@/generated/prisma/client";

export const SECTION_KEYS: Section[] = ["STUDY", "ARUS", "PERSONAL"];

const DEFAULT_SECTIONS: Record<Section, { label: string; color: string; icon: string }> = {
  STUDY: { label: "Estudios", color: "#5eb8ff", icon: "▲" },
  ARUS: { label: "ARUS", color: "#ff6b3d", icon: "●" },
  PERSONAL: { label: "Personal", color: "#baff29", icon: "■" },
};

export type ResolvedSettings = {
  appName: string;
  tagline: string;
  sections: Record<Section, { label: string; color: string; icon: string }>;
  dashboardAccounts: {
    calendar: GoogleAccountLabel;
    drive: GoogleAccountLabel;
    gmail: GoogleAccountLabel;
  };
  driveFolderId: string | null;
};

export async function getSettings(): Promise<ResolvedSettings> {
  const app = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  const existing = await prisma.sectionConfig.findMany();
  const sections = {} as ResolvedSettings["sections"];

  for (const key of SECTION_KEYS) {
    const found = existing.find((s) => s.key === key);
    if (found) {
      sections[key] = { label: found.label, color: found.color, icon: found.icon };
    } else {
      const created = await prisma.sectionConfig.upsert({
        where: { key },
        update: {},
        create: { key, ...DEFAULT_SECTIONS[key] },
      });
      sections[key] = { label: created.label, color: created.color, icon: created.icon };
    }
  }

  return {
    appName: app.appName,
    tagline: app.tagline,
    sections,
    dashboardAccounts: {
      calendar: app.dashboardCalendarAccount,
      drive: app.dashboardDriveAccount,
      gmail: app.dashboardGmailAccount,
    },
    driveFolderId: app.dashboardDriveFolderId,
  };
}
