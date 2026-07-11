<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project State

### Database
- PostgreSQL via Neon
- Prisma v7.8 — model delegates not available at runtime; all DocumentChunk operations use raw SQL (`$executeRaw` / `$queryRaw`)
- `prisma/add-index-embedding.sql` — partial index on `DocumentChunk(documentId) WHERE embedding IS NOT NULL`

### Auth
- Clerk for authentication, `prisma.User` linked via `clerkId`

### Embeddings & Semantic Search
- Google Gemini `gemini-embedding-001` via `@google/genai` SDK (`lib/embeddings.ts`)
- Cosine similarity computed in-memory (`lib/cosine-similarity.ts`) — clamped to [0, 1]
- Chunking: 1000 char chunks, 200 char overlap (`lib/chunker.ts`)
- MIN_SCORE = 0.3, TOP_K default 10 (configurable via API)

### Upload Flow
- `POST /api/documents/upload` — saves file, extracts text, chunks, batch-generates embeddings with `Promise.all`
- Documents uploaded before the embedding feature was added need re-indexing

### PDF OCR Fallback
- PDF text extraction (`pdf-parse`) → if result is null/empty/<20 chars → fall back to OCR
- OCR pipeline: `pdfjs-dist` renders pages → `@napi-rs/canvas` converts to PNG → `tesseract.js` OCRs
- Native deps externalized via `next.config.ts` -> `serverExternalPackages`

### Pages
- `/dashboard/semantic-search` — query persisted in URL params (`?q=`), debounced auto-search, `/` keyboard shortcut, document filter dropdown, clickable results linking to detail page, retry button
- `/dashboard/documents` — document list with "Needs re-index" badge when `embeddedCount < chunkCount`
- `/dashboard/documents/[id]` — detail page with metadata, chunk/embedding stats, re-index button, content preview

### API Routes
- `POST /api/documents/semantic-search` — accepts `{ q, topK?, documentId? }`, returns `{ results: [...] }`
- `POST /api/documents/[id]/reindex` — deletes all chunks for a document and regenerates them with fresh embeddings
