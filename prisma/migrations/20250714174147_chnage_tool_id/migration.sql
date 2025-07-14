/*
  Warnings:

  - The primary key for the `Tool` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defination" JSONB NOT NULL,
    "mcpServer" TEXT NOT NULL
);
INSERT INTO "new_Tool" ("defination", "description", "id", "mcpServer", "name") SELECT "defination", "description", "id", "mcpServer", "name" FROM "Tool";
DROP TABLE "Tool";
ALTER TABLE "new_Tool" RENAME TO "Tool";
CREATE UNIQUE INDEX "Tool_name_mcpServer_key" ON "Tool"("name", "mcpServer");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
