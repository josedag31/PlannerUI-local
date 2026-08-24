-- Drop and recreate GoogleAccount with `label` as primary key instead of a
-- fixed single-row id, to support connecting more than one Google account
-- (e.g. Personal + ARUS). Any previously connected account is lost here and
-- must be reconnected from /ajustes.
DROP TABLE IF EXISTS "GoogleAccount";

CREATE TABLE "GoogleAccount" (
    "label" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" BIGINT NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MicrosoftAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "email" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" BIGINT NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MicrosoftOAuthConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'common',
    "redirectUri" TEXT NOT NULL DEFAULT 'http://localhost:3000/api/microsoft/callback',
    "updatedAt" DATETIME NOT NULL
);
