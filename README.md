# Nivah

**AI-powered document intelligence platform.** Upload documents, search by meaning, ask questions with grounded AI answers, generate study materials, and keep everything organized in workspaces.

**Live:** https://nivah-one.vercel.app

---

## Features

- **Semantic Search** — Vector embeddings (Gemini) for meaning-based document search
- **Ask Nivah** — Grounded RAG chat with source citations
- **Document Upload** — PDF, DOCX, TXT, MD, images with automatic text extraction & OCR fallback
- **Study Mode** — AI-generated flashcards, quizzes, MCQs, and short notes from any document
- **AI Summaries** — One-click document summarization
- **AI Actions** — Compare documents, extract key points, generate FAQs
- **Workspaces** — Organize documents into workspaces with scoped search
- **Notifications** — Real-time bell with upload/summary/re-index alerts
- **Settings** — Dark mode toggle, email notification preferences, auto-sync
- **Chat History** — Persistent session management across conversations
- **Authentication** — Clerk-powered (email/password, Google SSO, GitHub)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL via Neon |
| ORM | Prisma 7 |
| Auth | Clerk |
| AI | Google Gemini (`gemini-embedding-001`, `gemini-3.1-flash-lite`) |
| Embeddings | In-memory cosine similarity |
| OCR | Tesseract.js + pdfjs-dist |
| File Storage | PostgreSQL BYTEA |
| Deployment | Vercel (auto-deploy on push) |

## Getting Started

```bash
npm install
cp .env.local.example .env.local  # fill in your keys
npm run dev
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `GOOGLE_API_KEY` | Google Gemini API key |

## Project Structure

```
app/
├── (auth)/           # Custom sign-in/sign-up pages
├── api/              # API routes (ask, documents, chat, notifications, etc.)
├── dashboard/        # Dashboard pages (documents, search, settings, etc.)
components/
├── dashboard/        # Sidebar, Header
├── Icons.tsx         # SVG icon components
lib/
├── prisma.ts         # Prisma client
├── embeddings.ts     # Gemini embedding
├── chunker.ts        # Text chunking
├── cosine-similarity.ts
├── extract-text.ts   # File text extraction + OCR
├── notifications.ts  # Notification helper
├── theme-context.tsx # Dark/light theme
├── sidebar-context.tsx
└── plans.ts          # Free/Pro plan config
prisma/
├── schema.prisma
└── migrations/
```

## License

MIT
