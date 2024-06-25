/*
  Warnings:

  - You are about to drop the column `settings` on the `Group` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "permissions" TEXT,
    "attributes" TEXT,
    CONSTRAINT "Group_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Group" ("createdAt", "id", "name", "permissions", "tenantId", "updatedAt") SELECT "createdAt", "id", "name", "permissions", "tenantId", "updatedAt" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE UNIQUE INDEX "Group_name_tenantId_key" ON "Group"("name", "tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
