# Caseflow – Smart Legal Intake & Client Workspace

An AI-powered legal intake and client workspace that combines conversational intake, document management, two-way communication, and structured case summaries for law firms.

## Features

- **AI Conversational Intake** — Chat-style intake with dynamic follow-up questions
- **Automatic Case Analysis** — Extracts facts, classifies legal issues, scores viability, generates summaries
- **Shared Case Workspace** — Chat, documents, and AI summary in one place
- **Two-Way Messaging** — Real-time-ish polling between client and lawyer
- **Document Upload** — Drag-and-drop with AI summarization per document
- **Lawyer Dashboard** — Filter/search all cases by status and viability
- **Role Toggle** — Switch between client and lawyer views from the header

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL via Supabase |
| AI | OpenAI GPT-4o |
| File Storage | Local filesystem (`/public/uploads/`) |
| Icons | Lucide React |

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd intaker
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Get your project URL and anon key from **Settings → API**

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # optional, for bypassing RLS
OPENAI_API_KEY=sk-your-openai-key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Load demo data

Visit [http://localhost:3000/lawyer](http://localhost:3000/lawyer) and click **Load Demo** to seed 4 sample cases, or run:

```bash
npm run seed
```

> Note: The seed script requires the dev server to be running.

## Usage

### Client Flow

1. Go to `/` and enter your name
2. You'll be redirected to a private case chat (`/client/case/[id]`)
3. Describe your legal situation naturally
4. AI asks follow-up questions and analyzes after 5+ messages
5. View case workspace and upload documents via `/client/case/[id]/documents`

### Lawyer Flow

1. Click **Lawyer View** toggle (top-right) or go to `/lawyer`
2. See all incoming cases with AI summaries and viability scores
3. Click any case to open the workspace
4. Left pane: message the client
5. Right pane (top): AI summary + status controls + extracted facts
6. Right pane (bottom): documents with AI summarization
7. Use **AI Suggest Reply** to generate a draft message

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing / client intake start
│   ├── client/
│   │   └── case/[id]/
│   │       ├── page.tsx            # Client chat workspace
│   │       └── documents/page.tsx  # Client documents + summary
│   ├── lawyer/
│   │   ├── page.tsx                # Lawyer dashboard
│   │   └── case/[id]/page.tsx      # Lawyer workspace (split layout)
│   └── api/
│       ├── cases/                  # CRUD for cases
│       ├── messages/               # Messaging API
│       ├── documents/              # File upload + management
│       ├── ai/
│       │   ├── intake/             # AI-powered intake chat
│       │   ├── analyze/            # Full case analysis trigger
│       │   └── suggest-reply/      # Lawyer reply suggestions
│       └── seed/                   # Demo data seeder
├── components/
│   ├── ui/                         # Button, Badge, Card
│   ├── layout/                     # Header with role toggle
│   ├── client/                     # IntakeChat
│   ├── lawyer/                     # CaseCard
│   └── workspace/                  # ChatPane, SummaryPane, DocumentPane
└── lib/
    ├── types.ts                    # TypeScript types
    ├── supabase.ts                 # Supabase client
    ├── db.ts                       # Database helpers
    └── openai.ts                   # AI service layer
```

## AI Prompts

All AI prompts are in `src/lib/openai.ts`:

| Function | Purpose |
|----------|---------|
| `generateIntakeResponse` | Conversational intake questions |
| `extractFacts` | Parties, timeline, events, damages, jurisdiction |
| `classifyLegalIssue` | Category + subcategory |
| `assessViability` | Strong / Medium / Weak + reasoning |
| `generateSummary` | Lawyer-ready intake summary |
| `summarizeDocument` | Document summary + tags |
| `suggestLawyerReply` | Draft reply for lawyer |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role (bypasses RLS) |
| `OPENAI_API_KEY` | Yes | OpenAI API key (GPT-4o) |

## Notes

- **No authentication** — designed for MVP demo. Add Supabase Auth for production.
- **File storage** — files saved to `public/uploads/[caseId]/`. Use Supabase Storage or S3 for production.
- **Polling** — messages poll every 5 seconds. Use Supabase Realtime for production.
- **AI costs** — each intake message triggers one OpenAI call. Full analysis (after 5 messages) triggers 4 parallel calls.
