-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "workspaceId" TEXT;

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyContent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workspace_userId_idx" ON "Workspace"("userId");

-- CreateIndex
CREATE INDEX "StudyContent_userId_idx" ON "StudyContent"("userId");

-- CreateIndex
CREATE INDEX "StudyContent_documentId_idx" ON "StudyContent"("documentId");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyContent" ADD CONSTRAINT "StudyContent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
