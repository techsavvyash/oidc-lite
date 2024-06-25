/*
  Warnings:

  - A unique constraint covering the columns `[applicationsId,usersId]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_applicationsId_usersId_key" ON "RefreshToken"("applicationsId", "usersId");
