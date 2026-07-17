<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project State

### Database
- PostgreSQL via Neon
- Prisma v7.8 — model delegates not available at runtime; all DocumentChunk operations use raw SQL (`$executeRaw` / `$queryRaw`)
- `prisma/add-index-embedding.sql` — partial index on `DocumentChunk(documentId) WHERE embedding IS NOT NULL`
- `ChatSession` — id, title, userId, createdAt, updatedAt
- `ChatMessage` — id, role (USER/ASSISTANT), content, sources (Json), sessionId, createdAt
- `Workspace` — id, name, description, userId, createdAt, updatedAt
- `DocumentWorkspace` — join table linking documents to workspaces

### Auth
- Clerk for authentication, `prisma.User` linked via `clerkId`
- Custom sign-in/sign-up pages at `app/(auth)/` route group with Nivah branding
- Multi-account switching requires Clerk paid plan — used basic accounts menu instead

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
- `/dashboard/ask` — "Ask Nivah" grounded RAG chat: question input, generated answer, source citations linking to `/dashboard/documents/[id]`, persistent chat history with session management
- `/dashboard/documents` — document list with "Needs re-index" badge when `embeddedCount < chunkCount`
- `/dashboard/documents/[id]` — detail page with metadata, chunk/embedding stats, re-index button, content preview
- `/dashboard/workspaces` — workspaces list
- `/dashboard/workspaces/[id]` — workspace detail with scoped search
- `/dashboard/profile` — user profile page
- `/dashboard/search` — global search page
- `/dashboard/ai-connections` — AI connections settings page
- `/dashboard/settings` — user settings
- `/dashboard/upload` — document upload page
- `/dashboard/ask` — "Ask Nivah" grounded RAG chat
- Custom auth pages at `/sign-in` and `/sign-up` (from `(auth)` route group)

### API Routes
- `POST /api/ask` — grounded RAG: accepts `{ question, sessionId? }`, retrieves top 5 chunks via semantic search, sends to `gemini-3.1-flash-lite`, returns `{ answer, sources, sessionId }`
- `GET /api/chat/sessions` — list user's chat sessions (sorted by most recent)
- `POST /api/chat/sessions` — create a new session
- `DELETE /api/chat/sessions/[id]` — delete a session
- `GET /api/chat/sessions/[id]/messages` — load messages for a session
- `POST /api/documents/semantic-search` — accepts `{ q, topK?, documentId? }`, returns `{ results: [...] }`
- `POST /api/documents/[id]/reindex` — deletes all chunks for a document and regenerates them with fresh embeddings
- `PATCH /api/documents/[id]` — updates document title
- `POST /api/user/delete` — deletes Clerk user + Prisma user (cascades to docs/chunks)
- `POST /api/documents/export` — returns markdown for selected document IDs

### Infrastructure
- **Tests**: Vitest — `npm test` / `npm run test:watch`. Tests in `lib/*.test.ts`.
- **Sidebar**: `SidebarContext` (`lib/sidebar-context.tsx`) — mobile overlay via hamburger, desktop collapse via chevron
- **Theme**: `ThemeContext` (`lib/theme-context.tsx`) — light/dark toggle, persisted to localStorage, inline `<script>` prevents flash, `mounted` state prevents hydration mismatch
- **Theme**: `ThemeContext` (`lib/theme-context.tsx`) — light/dark toggle, persisted to localStorage, inline `<script>` prevents flash, `mounted` state prevents hydration mismatch
- **Plans config**: `lib/plans.ts` — single source of truth for Free/Pro tiers (storage, AI connections, pricing)
- **Pagination**: Client-side 20/page in `DocumentsClient`, resets on search/filter change

### Known Issues
- Middleware uses deprecated `middleware.ts` convention — should migrate to `proxy`
- Semantic search is purely in-memory (no pgvector) — won't scale beyond ~10K chunks

### Today's Changes (2026-07-15)
- **Fix Ask Nivah lint**: Removed unused `i` parameter in `buildContext` (`app/api/ask/route.ts:30`)
- **Fix Ask Nivah useEffect lint**: Added ref guard to prevent setState in effect (`components/AskNivahClient.tsx`)
- **UI**: Removed "Semantic Search" from AI Connections "Coming Soon" section (`app/dashboard/ai-connections/page.tsx`)
- **Fix theme hydration mismatch**: Added `mounted` state to `ThemeContext`; Header only renders theme toggle after client mount (`lib/theme-context.tsx`, `components/dashboard/Header.tsx`)

### Today's Changes (2026-07-16)
- **Workspace migration**: Created Workspace + DocumentWorkspace tables, added models to schema, ran `prisma migrate dev`
- **Profile page**: Created `/dashboard/profile` page with user info and account management
- **Switch accounts**: Added multi-account menu to Header; Clerk multi-session requires paid plan — reverted to basic menu
- **Custom auth pages**: Created branded sign-in/sign-up under `app/(auth)/`, replaced Clerk defaults
- **Fix NivahLogo**: Fixed path data in `components/Icons.tsx` to draw "N" instead of "M"
- **Fix auth hydration**: Removed nested `<body>` tags in auth layout
- **Remove route conflict**: Deleted Clerk's default `app/sign-in/[[...sign-in]]` and `app/sign-up/[[...sign-up]]` catch-all routes
- **Fix build error**: Removed duplicate `toggleMobile` line in `components/dashboard/Header.tsx`
