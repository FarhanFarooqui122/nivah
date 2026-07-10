-- Composite index for user-specific semantic search (documentId + embedding IS NOT NULL)
CREATE INDEX IF NOT EXISTS "DocumentChunk_user_embedding_idx" ON "DocumentChunk" ("documentId")
WHERE "embedding" IS NOT NULL;
