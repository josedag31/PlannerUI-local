-- AlterTable
ALTER TABLE "EventCountdown" ADD COLUMN "googleEventId" TEXT;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN "googleEventId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "googleEventId" TEXT;

-- CreateTable
CREATE TABLE "GoogleOAuthConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL DEFAULT 'http://localhost:3000/api/google/callback',
    "updatedAt" DATETIME NOT NULL
);
