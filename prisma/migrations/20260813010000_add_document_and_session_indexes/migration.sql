-- Indexes for the most common document/session access patterns

CREATE INDEX IF NOT EXISTS "Document_userId_idx" ON "Document" ("userId");
CREATE INDEX IF NOT EXISTS "Document_workspaceId_idx" ON "Document" ("workspaceId");
CREATE INDEX IF NOT EXISTS "ChatSession_workspaceId_idx" ON "ChatSession" ("workspaceId");