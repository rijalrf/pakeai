/*
  Warnings:

  - You are about to drop the column `projectId` on the `AgentToken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AgentToken" DROP CONSTRAINT "AgentToken_projectId_fkey";

-- DropIndex
DROP INDEX "AgentToken_projectId_idx";

-- AlterTable
ALTER TABLE "AgentToken" DROP COLUMN "projectId";

-- CreateTable
CREATE TABLE "AgentTokenScope" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "AgentTokenScope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentTokenScope_projectId_idx" ON "AgentTokenScope"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentTokenScope_tokenId_projectId_key" ON "AgentTokenScope"("tokenId", "projectId");

-- AddForeignKey
ALTER TABLE "AgentTokenScope" ADD CONSTRAINT "AgentTokenScope_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "AgentToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTokenScope" ADD CONSTRAINT "AgentTokenScope_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
