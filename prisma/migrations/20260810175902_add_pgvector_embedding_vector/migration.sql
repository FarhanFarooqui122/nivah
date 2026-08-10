-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN     "embeddingVector" vector(3072);

-- Backfill vector column from existing JSON embeddings ([0.1, 0.2, ...] text parses as vector literal)
UPDATE "DocumentChunk" SET "embeddingVector" = ("embedding")::text::vector WHERE "embedding" IS NOT NULL;

-- Note: no ANN index (HNSW/IVFFlat both cap at 2000 dims; gemini-embedding-001 outputs 3072).
-- Cosine similarity runs as a Postgres-side scan with LIMIT, which already avoids shipping all chunks to Node.