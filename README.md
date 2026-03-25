# Caseflow — Smart Legal Intake & Client Workspace

AI-powered legal intake and triage with a shared workspace between clients and law firms.

## Features

- **Conversational Intake** — AI-guided interview that extracts structured legal facts
- **AI Analysis** — Automatic classification, viability scoring, and case summaries
- **Shared Workspace** — Split-view with chat, documents, and AI-generated summaries
- **Document Management** — Upload and tag documents with AI summarization
- **Lawyer Dashboard** — Case list with filtering, status management, and key metrics

## Tech Stack

- **Frontend:** React / Next.js 15 (App Router)
- **Backend:** Next.js API Routes
- **Database:** SQLite (via better-sqlite3)
- **AI:** OpenAI API (GPT-4o-mini)
- **Styling:** Tailwind CSS v4

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key. The app works without one (using mock AI responses for demo).

### 3. Seed demo data (optional)

```bash
npm run seed
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Flow

1. Start as **Client** — click "New Case" to begin intake
2. Describe your legal situation in the chat
3. AI asks follow-up questions to gather facts
4. After ~5 messages, AI auto-generates case analysis
5. Toggle to **Lawyer** view to see the case dashboard
6. Open a case workspace to review summary, chat with client, and manage documents

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── cases/          # CRUD for cases
│   │   │   └── [id]/
│   │   │       ├── messages/   # Chat messages
│   │   │       ├── documents/  # File uploads
│   │   │       ├── analyze/    # AI analysis
│   │   │       └── status/     # Status updates
│   │   └── upload/         # File serving
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ChatPanel.tsx       # Chat interface
│   ├── CaseSummary.tsx     # AI-generated summary display
│   ├── CaseWorkspace.tsx   # Split-view workspace
│   ├── ClientDashboard.tsx # Client case list
│   ├── DocumentPanel.tsx   # Document upload & list
│   ├── LawyerDashboard.tsx # Lawyer case dashboard
│   └── StatusBadge.tsx     # Status & viability badges
└── lib/
    ├── ai.ts               # OpenAI integration + mock responses
    ├── db.ts               # SQLite database layer
    └── types.ts            # TypeScript types
```
