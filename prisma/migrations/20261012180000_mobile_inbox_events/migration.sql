-- AlterTable
ALTER TABLE "EventCountdown" ADD COLUMN "inboxId" TEXT;
-- CreateIndex
CREATE UNIQUE INDEX "EventCountdown_inboxId_key" ON "EventCountdown"("inboxId");
