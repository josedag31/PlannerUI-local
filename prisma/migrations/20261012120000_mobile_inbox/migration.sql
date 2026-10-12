-- AlterTable
ALTER TABLE "Task" ADD COLUMN "inboxId" TEXT;

-- CreateTable
CREATE TABLE "MobileInboxConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "url" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "lastSyncAt" DATETIME,
    "lastError" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Task_inboxId_key" ON "Task"("inboxId");
