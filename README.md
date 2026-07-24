# Nivah

**AI-powered document intelligence platform.** Upload documents, search by meaning, ask questions with grounded AI answers, generate study materials, and keep everything organized in workspaces.

<p align="center">
  <a href="https://nivah-one.vercel.app">🌐 Live Demo</a>
  &nbsp;|&nbsp;
  <a href="#features">Features</a>
  &nbsp;|&nbsp;
  <a href="#tech-stack">Tech Stack</a>
  &nbsp;|&nbsp;
  <a href="#getting-started">Getting Started</a>
  &nbsp;|&nbsp;
  <a href="#api-routes">API Routes</a>
</p>

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
| Cosine similarity (in-memory) | Semantic search scoring, clamped to [0, 1] |
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
| POST | `/api/ask` | Grounded RAG — accepts `{ question, sessionId? }`, returns `{ answer, sources, sessionId }` |
| GET | `/api/chat/sessions` | List user's chat sessions (sorted by most recent) |
| POST | `/api/chat/sessions` | Create a new chat session |
| DELETE | `/api/chat/sessions/[id]` | Delete a chat session |
| GET | `/api/chat/sessions/[id]/messages` | Load messages for a session |
| POST | `/api/documents/upload` | Upload document (saves to BYTEA, extracts text, chunks, embeds) |
| POST | `/api/documents/semantic-search` | Search — accepts `{ q, topK?, documentId? }`, returns `{ results }` |
| POST | `/api/documents/[id]/reindex` | Delete and regenerate embeddings for a document |
| PATCH | `/api/documents/[id]` | Update document title/workspace |
| GET | `/api/documents/[id]/file` | Serve raw file from BYTEA storage |
| POST | `/api/documents/export` | Export documents as markdown |
| GET | `/api/notifications` | List notifications + unread count |
| POST | `/api/notifications` | Create a notification |
| PATCH | `/api/notifications/[id]/read` | Mark notification as read |
| PATCH | `/api/user/preferences` | Update email notifications / auto-sync settings |
| POST | `/api/user/delete` | Delete Clerk user + Prisma user (cascades to docs/chunks) |

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

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

```bash
npx prisma migrate dev
npx prisma generate
```

### Testing

```bash
npm test          # Run tests
npm run test:watch  # Watch mode
```

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
│   ├── cosine-similarity.ts    # Cosine similarity computation
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

## Known Issues

- **Middleware** — Uses deprecated `middleware.ts` convention; should migrate to `proxy`
- **Semantic Search** — Purely in-memory (no pgvector) — won't scale beyond ~10K chunks
- **AI Connections** — Page is purely cosmetic (no real OAuth integration)
- **Large Uploads** — Files >10MB may hit Neon BYTEA limits or Vercel serverless function timeouts
- **Rate Limiting** — No rate limiting on API routes

---

## License

MIT