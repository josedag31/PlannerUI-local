-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GoogleAccount" (
    "label" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" BIGINT NOT NULL,
    "scope" TEXT NOT NULL,
    "clientId" TEXT,
    "needsReconnect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GoogleAccount" ("accessToken", "createdAt", "email", "expiryDate", "label", "refreshToken", "scope", "updatedAt") SELECT "accessToken", "createdAt", "email", "expiryDate", "label", "refreshToken", "scope", "updatedAt" FROM "GoogleAccount";
DROP TABLE "GoogleAccount";
ALTER TABLE "new_GoogleAccount" RENAME TO "GoogleAccount";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
