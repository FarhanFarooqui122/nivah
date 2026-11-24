<div align="center">

# 🟣 Nivah

**AI-powered document intelligence platform.** Upload documents, search by meaning, ask questions with grounded AI answers, generate study materials, and keep everything organized in workspaces.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-nivah--one.vercel.app-7c3aed?style=for-the-badge&logo=vercel&logoColor=white)](https://nivah-one.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL%20%2B%20pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![Gemini](https://img.shields.io/badge/Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

</div>

---

## Table of Contents

- [About Nivah](#about-nivah)
- [How It Works](#how-it-works)
- [Features](#features)
- [Design System](#design-system)
- [Plans & Quotas](#plans--quotas)
- [Tech Stack](#tech-stack)
- [API Routes](#api-routes)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [Known Issues](#known-issues)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [License](#license)

---

## About Nivah

Nivah is a smart document assistant that helps you manage, search, and understand your files using AI.

Instead of flipping through folders or guessing file names, you can just describe what you're looking for — like *"the quarterly report about marketing spend"* — and Nivah finds it by meaning, not just keywords. You can also ask questions about your documents and get answers with sources, generate flashcards or quizzes to study, and keep everything organized in workspaces.

Think of Nivah as your personal AI research assistant that actually knows what's inside your documents.

### Why use Nivah?

- **Stop searching, start finding** — Traditional search only matches exact words. Nivah understands the meaning behind your query, so you find what you need even if you don't remember the exact wording.
- **Ask questions, get answers** — Instead of reading through pages of text, just ask. Nivah reads your documents and gives you a direct answer with the source attached.
- **Study smarter** — Turn any document into flashcards, quizzes, or study notes automatically. Great for students and researchers.
- **Everything in one place** — Upload PDFs, Word docs, images, and text files. Nivah extracts and indexes everything so you can search across all your files.
- **No cloud storage fees** — Files are stored in the database itself. No need for S3, R2, or any external file storage service.
- **Privacy-first** — Your documents stay in your own database. You control the data.
- **Free to start** — No credit card required. Upload documents, search semantically, and chat with your documents right away.

---

## How It Works

```
Upload ──▶ Extract text ──▶ Chunk (1000 chars, 200 overlap) ──▶ Embed (Gemini, 3072-dim) ──▶ Store in pgvector
                                                                                              │
Ask a question ──▶ Embed question ──▶ Cosine search (Postgres <=>) ──▶ Top 5 chunks ──▶ LLM (streaming SSE) ──▶ Answer + sources
```

### Chunking

`lib/chunker.ts` splits text by **characters, not words or tokens**:

| Constant | Value |
| --- | --- |
| `CHUNK_SIZE` | 1000 characters |
| `OVERLAP` | 200 characters |
| `STEP` | 800 characters (size − overlap) |

Cuts happen at fixed offsets, so a chunk can begin or end mid-word — the 200-character overlap is what keeps
a sentence from being lost across a boundary. Each chunk carries `chunkIndex` (sequential from 0) and
`charCount`; empty text yields an empty array. Eight unit tests in `lib/chunker.test.ts` cover the size,
overlap and numbering.

### Upload pipeline

`POST /api/documents/upload` does the whole job in one request:

| Step | What happens |
| --- | --- |
| 1. Auth + quota | Clerk id → `prisma.User`; the plan's storage limit (`lib/plans.ts`) is checked against the sum of `fileSize` and the upload is rejected with **413** before anything is written |
| 2. Workspace | An optional `workspaceId` must belong to the user (else 404); without one the document is stored workspace-less |
| 3. Store | The binary goes into `fileBlob` (BYTEA) — there is no object storage |
| 4. Extract | `lib/extract-text.ts`: PDF through `pdf-parse`, OCR fallback when the text is under 20 characters or parsing fails; DOCX through mammoth; TXT/MD as UTF-8; PNG/JPEG/WebP through Tesseract |
| 5. Chunk + embed | `chunkText()`, then `generateEmbeddings()` — Gemini `gemini-embedding-001`, 3072 dimensions, at most 8 concurrent requests |
| 6. Write | One raw `INSERT` per chunk, filling both `embedding` (jsonb) and `embeddingVector` (`vector(3072)`) |
| 7. Notify | `upload_complete` notification with the chunk count and a link to the document |
| 8. Respond | An explicit field list — `fileBlob` and `textContent` never reach the response JSON |

If chunking or embedding throws, the document row is deleted again instead of leaving a half-indexed file
behind.

### Upload size limit

`lib/upload-limits.ts` is the single source of truth for the per-file ceiling:

| Constant | Value |
| --- | --- |
| `MAX_FILE_SIZE` | `10 * 1024 * 1024` bytes (10 MiB) |
| `MAX_FILE_SIZE_MB` | `10` — derived and used in user-facing messages |

The limit is enforced twice: `app/dashboard/upload/page.tsx` filters oversized files before they are
sent and shows *“is too large (max 10MB)”*, and `POST /api/documents/upload` re-checks it server-side,
returning **400** with `File too large (max 10MB)`. This per-file limit is separate from the plan
storage quota, which rejects with **413**.

### Re-indexing

`POST /api/documents/[id]/reindex` rebuilds one document's chunks and embeddings. The order is deliberate:

| Step | Detail |
| --- | --- |
| 1. Checks | Rate limited (`reindex` bucket); the document must belong to the user (404); no `textContent` → **400** |
| 2. Embed first | New embeddings are generated **before** anything is deleted |
| 3. All-null guard | If every embedding came back `null`, it returns **502** and the old chunks stay |
| 4. Atomic swap | The `DELETE` and the new `INSERT`s run in one `prisma.$transaction`, so a failure rolls back |
| 5. Partial embeddings | Chunks whose embedding failed are still inserted with content only, so the document is flagged "Needs re-index" rather than losing text |
| 6. Report | `reindex_complete` notification plus `{ success, chunkCount, embeddedCount }` — equal counts mean fully indexed |

You need this for documents uploaded before the pgvector column existed, or while Gemini was failing: their
chunks have no `embeddingVector`, so search cannot see them.

### Workspaces

Workspaces are a grouping on top of documents — there is no sharing and no per-workspace permissions:

| Rule | Where it lives |
| --- | --- |
| `Document.workspaceId` is optional; a document can sit outside every workspace | `prisma/schema.prisma` (`workspaceId String?`) |
| Upload accepts a `workspaceId` only if it belongs to the caller, otherwise 404 | `app/api/documents/upload/route.ts` |
| Moving a document validates the target workspace; `null` unassigns it | `PATCH /api/documents/[id]` |
| `GET /api/documents` returns **all** of the user's documents with their `workspaceId`, so filtering is client-side | `app/api/documents/route.ts` |
| Ask and semantic search narrow retrieval with an optional `workspaceId` | `/api/ask`, `/api/documents/semantic-search` |
| `GET /api/workspaces` includes a `_count` of documents per workspace | `app/api/workspaces/route.ts` |
| Deleting a workspace un-assigns its documents (`onDelete: SetNull`) — it never deletes them | `prisma/schema.prisma` |

## Features

### 📄 Document Management
- **Upload & Extract** — Upload PDF, DOCX, TXT, MD, and images; automatic text extraction with OCR fallback for scanned PDFs (Tesseract.js + pdfjs-dist)
- **File Storage** — Binaries stored in PostgreSQL (BYTEA), served via dedicated API endpoint
- **Workspaces** — Organize documents into workspaces with scoped search and filtering
- **Re-indexing** — One-click re-index to regenerate embeddings for documents uploaded before the feature existed

### 🔍 Semantic Search
- **Meaning-based search** — Vector embeddings via Google Gemini (`gemini-embedding-001`) find documents by meaning, not just keywords
- **Configurable** — Adjustable `TOP_K` (default 10) and minimum score threshold (0.3)
- **Document filtering** — Narrow search to specific documents or workspaces
- **URL-persisted queries** — Search query persists in URL params (`?q=`) for sharing and browser navigation

### 💬 Ask Nivah (RAG Chat)
- **Grounded Q&A** — Ask questions and get AI-generated answers sourced from your documents
- **Source citations** — Every answer links back to the source document with relevant chunks
- **Chat sessions** — Persistent session management with history; create, switch, and delete conversations
- **Context-aware** — Retrieves top 5 relevant chunks via semantic search before answering

### 🧠 Study Mode
- **Flashcards** — AI-generated flashcards from any document
- **Quizzes & MCQs** — Multiple-choice questions auto-generated from document content
- **Short Notes** — Concise summaries extracted for quick review

### ⚡ AI Actions
- **Summaries** — One-click document summarization
- **Compare Documents** — Side-by-side comparison of document content
- **Key Points Extraction** — Automatically extract key points from documents
- **FAQ Generation** — Generate frequently asked questions from document content

### 🔔 Notifications
- **Real-time alerts** — Bell dropdown with unread badge; notifications for uploads, summaries, and re-indexing
- **Mark as read** — Individual and mark-all-read support

### 🎨 User Experience
- **Dark Mode** — Light/dark theme toggle persisted to localStorage with flash-free inline script
- **Responsive Sidebar** — Hamburger menu on mobile, collapsible chevron on desktop
- **Auth Pages** — Branded custom sign-in/sign-up pages with email/password, Google SSO, GitHub SSO
- **Profile & Settings** — User profile page, settings with email notification and auto-sync toggles

---

## Design System

The interface is a **neo-brutalist editorial** system built on Tailwind v4 theme tokens. Tokens and
utilities live in `app/globals.css`; components consume those utilities instead of one-off gradients.

### Palette

Declared in `@theme inline` and remapped per theme under `[data-theme="dark"]` / `[data-theme="light"]`:

| Token | Dark | Light | Used for |
| --- | --- | --- | --- |
| `--color-primary` | `#630ed4` | `#630ed4` | Deep Nivah purple |
| `--color-primary-vivid` | `#7c3aed` | `#7c3aed` | Buttons, shadows, focus borders |
| `--color-secondary` | `#4b41e1` | `#4b41e1` | Indigo companion tone |
| `--color-outline` | `#7b7487` | `#7b7487` | Muted strokes |
| `--color-surface-elevated` | `#171021` | `#ffffff` | Card and input surfaces |
| `--color-border` | `#b9a7d6` | `#17121f` | 2px borders |
| `--shadow-card` | `4px 4px 0 0 #7c3aed` | `4px 4px 0 0 #630ed4` | Flat offset card shadow |

### Typography

| Role | Font | Class |
| --- | --- | --- |
| Body | Inter (`--font-inter`) | default `font-sans` |
| Display | Archivo Black (`--font-archivo`) | `.headline` |
| Labels | Inter 700, 0.22em tracking, uppercase | `.kicker` |

`.headline` is uppercase at `0.92` line-height with `font-synthesis-weight: none`. The display face is
imported at a **single weight (400)** in `app/layout.tsx`: Google's variable `Archivo` makes
`next/font` + Turbopack fail with *“queries have exactly one entry”*.

### Geometry

Neo-brutalism is enforced by the tokens: `--radius-sm` through `--radius-4xl` are all `0px`, so the
`rounded-*` utilities render square. Borders are 2px solid `--color-border`; depth comes from hard,
non-blurred shadows, not blur.

| Utility | Behaviour |
| --- | --- |
| `.brutal-card` | Bordered surface, `5px 5px 0` purple shadow, lifts 2px on hover |
| `.brutal-shadow` / `.brutal-shadow-sm` | 5px / 3px hard shadow |
| `.brutal-rule` | 2px top rule for section separators |
| `.brutal-input` | Square 2px input, 3px purple shadow on focus |
| `.card` | Same language for legacy cards, with hover lift |
| `.btn-primary` | Uppercase 2px button, `4px` shadow, presses down 2px when active |
| `.btn-ghost` | Transparent variant with a 3px shadow on hover |
| `.ai-border` | 4px-shadow panel used by AI surfaces |
| `.chip` | Square uppercase label pill |
| `.input-lg` | 3rem square input with purple focus shadow |

Page mastheads use the shared `PageHeader` component (`components/dashboard/PageHeader.tsx`):
optional kicker, display headline, description and actions, closed by a 2px rule.

### Theming

The active theme is an attribute on `<html>` (`data-theme="dark" | "light"`), not a class:

1. `app/layout.tsx` inlines a small script that reads `localStorage["nivah-theme"]` before hydration.
   With nothing stored it falls back to `prefers-color-scheme`, then writes the attribute.
2. `ThemeProvider` (`lib/theme-context.tsx`) starts at `"dark"` on server and client so the first render
   matches; after mount (`mounted` flag) it syncs from the DOM and, on toggle, writes both the attribute
   and `localStorage`.
3. `globals.css` replaces Tailwind's media-query `dark:` variant with
   `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))`, so `dark:` follows the
   in-app toggle instead of the OS.
4. `<html>` sets `suppressHydrationWarning` because the pre-hydration script changes the attribute before
   React runs.

The palette is declared per theme: `:root, [data-theme="dark"]` and `[data-theme="light"]`. Light mode
inverts the `zinc-*` scale (`zinc-950` becomes paper, `zinc-50` becomes ink), while `.text-on-brand`
keeps white text on saturated purple surfaces in both themes.

---

## Plans & Quotas

Plan limits live in a single source of truth, `lib/plans.ts`:

| Plan | Storage | AI connections | Price |
| --- | --- | --- | --- |
| Free | 500 MB | 3 | $0 |
| Pro | 50 GB | 10 | $9 / month |

The user's plan is stored on `User.plan` (default `"free"`). Uploads aggregate the user's existing
`Document.fileSize` and are rejected with **413** when the new file would exceed the plan limit;
the settings page shows the current plan and a storage-used bar.

---

## Tech Stack

### Core
| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) (Turbopack) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Language |
| [React 19](https://react.dev/) | UI library |

### Database & ORM
| Technology | Purpose |
|------------|---------|
| [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech) | Serverless PostgreSQL |
| [Prisma 7](https://www.prisma.io/) | ORM, migrations, type-safe queries |

### Authentication
| Technology | Purpose |
|------------|---------|
| [Clerk](https://clerk.com/) | Authentication (email/password, Google SSO, GitHub SSO) |
| Custom sign-in/sign-up pages | Branded auth UI with catch-all routes for SSO callbacks |

### AI & Embeddings
| Technology | Purpose |
|------------|---------|
| [Google Gemini](https://ai.google.dev/) (`gemini-embedding-001`, `gemini-3.1-flash-lite`) | Embeddings & text generation |
| [pgvector](https://github.com/pgvector/pgvector) | Postgres-side cosine similarity (`<=>` operator, `ORDER BY ... LIMIT`) |
| Custom chunker (1000 char, 200 overlap) | Document chunking for embedding |

### Document Processing
| Technology | Purpose |
|------------|---------|
| [pdf-parse](https://www.npmjs.com/package/pdf-parse) | PDF text extraction |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | OCR fallback for scanned documents |
| [pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist) | PDF rendering for OCR pipeline |
| [@napi-rs/canvas](https://www.npmjs.com/package/@napi-rs/canvas) | Page-to-PNG conversion for OCR |

### File Storage
| Technology | Purpose |
|------------|---------|
| PostgreSQL BYTEA | Binary file storage (no external S3/R2 dependency) |

### Deployment
| Technology | Purpose |
|------------|---------|
| [Vercel](https://vercel.com/) | Hosting & serverless functions, auto-deploy on git push |

### Testing & Quality
| Technology | Purpose |
|------------|---------|
| [Vitest](https://vitest.dev/) | Unit tests (`npm test`) |
| [ESLint](https://eslint.org/) | Linting |

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ask` | Grounded RAG — accepts `{ question, sessionId? }`, streams SSE events (`meta` / `delta` / `done` / `error`) |
| GET | `/api/chat/sessions` | List user's chat sessions (sorted by most recent) |
| POST | `/api/chat/sessions` | Create a new chat session |
| DELETE | `/api/chat/sessions/[id]` | Delete a chat session |
| GET | `/api/chat/sessions/[id]/messages` | Load messages for a session |
| GET | `/api/documents` | List the user's documents |
| DELETE | `/api/documents?id=…` | Delete a single document by id |
| POST | `/api/documents/upload` | Upload document (saves to BYTEA, extracts text, chunks, embeds) |
| POST | `/api/documents/search` | Keyword search — accepts `{ q }` |
| POST | `/api/documents/semantic-search` | Search — accepts `{ q, topK?, documentId? }`, returns `{ results }` |
| POST | `/api/documents/ai-actions` | Run `summarize` / `compare` / `faq` over `{ action, documentIds }` |
| POST | `/api/documents/export` | Export documents as markdown |
| PATCH | `/api/documents/[id]` | Update document title/workspace |
| DELETE | `/api/documents/[id]` | Delete a document |
| GET | `/api/documents/[id]/chunks` | List a document's chunks |
| GET | `/api/documents/[id]/file` | Serve raw file from BYTEA storage |
| POST | `/api/documents/[id]/reindex` | Delete and regenerate embeddings for a document |
| POST | `/api/documents/[id]/study` | Generate study content (flashcards / quiz) for a document |
| POST | `/api/documents/[id]/summarize` | Generate a summary for a document |
| GET | `/api/study` | List generated study content |
| GET | `/api/workspaces` | List workspaces |
| POST | `/api/workspaces` | Create a workspace |
| GET | `/api/workspaces/[id]` | Fetch one workspace |
| PATCH | `/api/workspaces/[id]` | Update a workspace |
| DELETE | `/api/workspaces/[id]` | Delete a workspace |
| GET | `/api/workspaces/[id]/documents` | Documents in a workspace, with chunk counts |
| GET | `/api/dashboard/stats` | Dashboard counters (documents, storage usage) |
| GET | `/api/notifications` | List notifications + unread count |
| POST | `/api/notifications` | Create a notification |
| PATCH | `/api/notifications/[id]/read` | Mark notification as read |
| PATCH | `/api/user/preferences` | Update email notifications / auto-sync settings |
| POST | `/api/user/delete` | Delete Clerk user + Prisma user (cascades to docs/chunks) |

### Rate limits

Per-user, fixed window of 60 s, defined in `lib/rate-limit.ts`:

| Endpoint | Requests / minute |
|--------|-------|
| `POST /api/documents/upload` | 10 |
| `POST /api/documents/[id]/reindex` | 10 |
| `POST /api/documents/ai-actions` | 10 |
| `POST /api/documents/[id]/summarize` | 10 |
| `POST /api/documents/[id]/study` | 20 |
| `POST /api/ask` | 30 |
| `POST /api/documents/export` | 30 |
| `POST /api/documents/search` | 60 |
| `POST /api/documents/semantic-search` | 60 |
| `GET /api/study` | 120 |

### Dashboard stats

`GET /api/dashboard/stats` powers the dashboard cards. Worth knowing what the names really mean:

| Field | Actually is |
| --- | --- |
| `totalDocuments` | All of the user's documents |
| `totalImages` | Documents whose MIME type is an image |
| `totalWords` | Word count across every non-null `textContent` |
| `storageBreakdown` | **Document counts** per category (PDF / DOCX / TXT-MD / Images / Other) — not bytes |
| `mostRecentUpload` | `{ title, fileName, createdAt }` of the newest document |
| `largestDocument` | Biggest by **extracted text length** (`charCount`), not file size |
| `mostCommonFileType` | `{ fileType, count }` with the highest document count |
| `topDocuments` | Top 5 documents by extracted text length |

### Notification types

`createNotification(userId, type, title, message?, link?)` is called with three type strings today:

| Type | Raised when |
| --- | --- |
| `upload_complete` | A document finished uploading and chunking |
| `reindex_complete` | Re-indexing regenerated a document's embeddings |
| `summary_ready` | A document summary finished generating |

In-app notifications are independent of the email-notification preference — that toggle only affects
email, not the bell.

### Semantic search response

`POST /api/documents/semantic-search` drops anything below `MIN_SCORE = 0.3` and caps `topK` at 50
(default 10):

```json
{
  "results": [
    {
      "id": "chunk-id",
      "documentId": "document-id",
      "title": "Quarterly report",
      "content": "…matched chunk text…",
      "chunkIndex": 3,
      "score": 0.82
    }
  ]
}
```

`score` is cosine similarity computed in Postgres (`1 - (embeddingVector <=> query)`), so it ranges 0–1.

### Ask Nivah streaming

`POST /api/ask` takes `{ question, sessionId?, workspaceId? }` and answers with `text/event-stream`, not JSON:

| Event | Payload |
| --- | --- |
| `meta` | `{ type: "meta", sessionId, sources }` — sent first; `sources` is deduplicated by document (`documentId`, `documentTitle`, `similarity`) |
| `delta` | `{ type: "delta", text }` — a growing slice of the answer |
| `done` | `{ type: "done" }` — the answer is complete |
| `error` | `{ type: "error", error }` — generation failed |

Retrieval is the top **5** chunks above `MIN_SCORE = 0.3`, generated by `gemini-3.1-flash-lite` at
temperature 0.5. A `sessionId` that does not exist returns **404** rather than silently starting a new
chat. The question and answer are written to `ChatMessage` only after the stream finishes — and an aborted
stream still persists the question plus whatever partial answer the user saw. Disconnects abort the Gemini
call through the request signal, so no orphaned generation keeps running.

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Clerk account
- Google Gemini API key

### Installation

```bash
git clone https://github.com/FarhanFarooqui122/nivah.git
cd nivah
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
GOOGLE_API_KEY=AIza...
```

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | Postgres/Neon connection — Prisma client and its pg adapter (`lib/prisma.ts`) |
| `GOOGLE_API_KEY` | Gemini: embeddings (`lib/embeddings.ts`, `gemini-embedding-001`, 3072-dim) and the answer model in `/api/ask` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client-side auth |
| `CLERK_SECRET_KEY` | Clerk server-side auth, read by Clerk's middleware in `proxy.ts` |

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | `prisma generate` + production build (fails on TypeScript errors) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run seed` | Seed the database (`prisma db seed`) |

### Tests

Vitest runs two suites with `npm test`. `vitest.config.ts` uses the Node environment, an `@` alias and
`**/*.test.{ts,tsx}`:

| Suite | Cases | What is asserted |
| --- | --- | --- |
| `lib/chunker.test.ts` | 8 | Max-size slicing, short text, empty text → `[]`, whitespace preserved, fixed-step slicing (1600 chars → a 1000-char and an 800-char chunk), sequential `chunkIndex`, text exactly `CHUNK_SIZE`, `charCount` |
| `lib/rate-limit.test.ts` | 4 | Requests are allowed up to the limit and `remaining` decrements, the next request is blocked, the bucket resets after the window, separate keys are independent |

The rate-limit tests use Vitest fake timers (`vi.useFakeTimers`) to advance the 60 s window without
sleeping.

### Database Setup

```bash
npx prisma migrate dev
npx prisma generate
```

Semantic search also relies on a partial index that ships as plain SQL (`prisma/add-index-embedding.sql`):

```sql
CREATE INDEX IF NOT EXISTS "DocumentChunk_user_embedding_idx"
ON "DocumentChunk" ("documentId") WHERE "embedding" IS NOT NULL;
```

Apply it once with `npx prisma db execute --file prisma/add-index-embedding.sql --schema prisma/schema.prisma`,
or paste it into the Neon SQL editor.

### Seed data

`npm run seed` fills an account with demo material for the presentation:

- workspace **Study Pack** ("Demo documents for the Nivah presentation")
- 4 documents — *Photosynthesis: The Light Reactions*, *Database Normalization: 1NF to 3NF*,
  *The French Revolution: 1789–1799* and *Machine Learning Fundamentals* — chunked and embedded
- a seeded chat session plus an in-app notification

It targets the most recently created user unless you pass `--clerkId=user_xxx`. You must sign in at
least once first; accounts that already have documents are skipped unless you add `--reset`.

---

## Project Structure

```
nivah/
├── app/
│   ├── api/                    # API routes
│   │   ├── ask/                # RAG chat endpoint
│   │   ├── chat/               # Chat session CRUD
│   │   ├── documents/          # Document upload, search, export, serve
│   │   ├── notifications/      # Notification CRUD
│   │   └── user/               # User preferences & account deletion
│   ├── dashboard/              # Dashboard pages
│   │   ├── ask/                # Ask Nivah RAG chat UI
│   │   ├── semantic-search/    # Semantic search page
│   │   ├── documents/          # Document list & detail views
│   │   ├── workspaces/         # Workspace management
│   │   ├── upload/             # Document upload page
│   │   ├── settings/           # User settings
│   │   ├── profile/            # User profile
│   │   ├── search/             # Global search
│   │   └── ai-connections/     # AI connections (cosmetic)
│   ├── sign-in/                # Custom sign-in (SSO catch-all)
│   └── sign-up/                # Custom sign-up (SSO catch-all)
├── components/
│   ├── dashboard/              # Sidebar, Header, NotificationsDropdown
│   │   └── Icons.tsx           # SVG icon components
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── embeddings.ts           # Gemini embedding generation
│   ├── chunker.ts              # Text chunking (1000 char, 200 overlap)
│   ├── extract-text.ts         # File text extraction + OCR pipeline
│   ├── notifications.ts        # Notification creation helper
│   ├── theme-context.tsx        # Dark/light theme context
│   ├── sidebar-context.tsx      # Sidebar state management
│   └── plans.ts                # Free/Pro plan configuration
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/             # Migration history
│   └── add-index-embedding.sql # Partial index on embeddings
├── public/                     # Static assets
├── next.config.ts              # Next.js configuration
└── package.json
```

---

## Database Schema

| Model | Key Fields |
|-------|-----------|
| **User** | `id`, `clerkId` (unique), `email`, `emailNotifications`, `autoSyncAiMemory` |
| **Document** | `id`, `title`, `fileName`, `fileType`, `fileSize`, `fileBlob` (BYTEA), `textContent`, `summary`, `userId`, `workspaceId` |
| **DocumentChunk** | `id`, `documentId`, `content`, `chunkIndex`, `charCount`, `embedding` (JSON) |
| **ChatSession** | `id`, `title`, `userId`, `workspaceId` |
| **ChatMessage** | `id`, `role` (USER/ASSISTANT), `content`, `sources` (JSON), `sessionId` |
| **Workspace** | `id`, `name`, `description`, `userId` |
| **Notification** | `id`, `userId`, `type`, `title`, `message`, `read`, `link` |
| **StudyContent** | `id`, `userId`, `documentId`, `type`, `content` (JSON) |

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Build fails: *“app/dashboard/error.tsx must be a Client Component”* | Next.js error boundaries are client components | Keep `"use client"` as the first line of `app/dashboard/error.tsx` |
| Build fails with *“queries have exactly one entry”* from `next/font` | Variable `Archivo` under Turbopack | Import `Archivo_Black` at `weight: "400"` (`app/layout.tsx`) |
| Prisma CLI cannot reach Neon | Full-verification URL (`sslmode=verify-full`, `channel_binding=require`) | Retry that CLI command with an `sslmode=require` override |
| Uploads succeed but semantic search misses them | Chunks have no `embeddingVector` — uploaded before pgvector existed, or while Gemini was failing | Re-index the document and confirm `embeddedCount === chunkCount` |
| PDF upload produces zero chunks | `pdf-parse` and its bundled `pdfjs-dist` versions diverged | Keep `pdfjs-dist@5.4.296` (see `package.json`) and both packages in `serverExternalPackages` |
| `429 Too Many Requests` | Per-user rate limit | Wait the `Retry-After` seconds; the buckets are listed under [Rate limits](#rate-limits) |
| `413 Storage limit reached` | Plan storage quota (500 MB / 50 GB) | Delete documents; Pro raises the ceiling. A single file over 10 MB is a separate **400** |

PDF extraction also falls back to OCR when less than 20 characters are extracted, so scanned documents
depend on the Tesseract path in `lib/extract-text.ts`.

---

## Known Issues

- **Semantic Search** — Uses pgvector `embeddingVector` column with Postgres-side cosine scan; no ANN index (pgvector caps HNSW/IVFFlat at 2000 dims, `gemini-embedding-001` outputs 3072) — fine to ~10K chunks, brute-force beyond that
- **AI Connections** — Page is purely cosmetic (no real OAuth integration)
- **Large Uploads** — Files >10MB may hit Neon BYTEA limits or Vercel serverless function timeouts

---

## Screenshots

> Screenshots coming soon. Until then, try the [live demo](https://nivah-one.vercel.app)!

---

## Roadmap

- **ANN vector indexing** — pgvector caps HNSW/IVFFlat at 2000 dims; exploring dimensionality reduction (e.g. 3072 → 1536) or external vector stores for sub-10K-chunk scaling
- **Real AI Connections** — OAuth integration for Drive, Notion, and OneDrive (page is currently cosmetic)
- **Multi-user workspaces** — Shared workspaces with roles and invite links
- **Bulk actions** — Multi-document export, batch re-index, and folder import
- **Mobile app** — Native companion app for document capture and quick search

---

## License

MIT

---

<div align="center">
  Made with 💜 · [Nivah](https://nivah-one.vercel.app)
</div>