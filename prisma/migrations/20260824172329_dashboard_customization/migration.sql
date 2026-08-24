-- CreateTable
CREATE TABLE "DashboardLayout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "order" TEXT NOT NULL DEFAULT '[]'
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "appName" TEXT NOT NULL DEFAULT 'Centro de Mando',
    "tagline" TEXT NOT NULL DEFAULT 'Tu base de operaciones para el curso',
    "dashboardCalendarAccount" TEXT NOT NULL DEFAULT 'PERSONAL',
    "dashboardDriveAccount" TEXT NOT NULL DEFAULT 'PERSONAL',
    "dashboardGmailAccount" TEXT NOT NULL DEFAULT 'PERSONAL'
);
INSERT INTO "new_AppSettings" ("appName", "id", "tagline") SELECT "appName", "id", "tagline" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
