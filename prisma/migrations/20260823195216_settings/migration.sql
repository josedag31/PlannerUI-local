-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "appName" TEXT NOT NULL DEFAULT 'Centro de Mando',
    "tagline" TEXT NOT NULL DEFAULT 'Tu base de operaciones para el curso'
);

-- CreateTable
CREATE TABLE "SectionConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL
);
