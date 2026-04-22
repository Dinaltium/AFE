# AFE — Autonomous Finance Engine

> Agentic AI that auto-splits gig worker income, vets deals, and logs every financial decision transparently.

## Structure

```
afe/
├── apps/
│   └── web/              # Next.js 15 — dashboard UI
├── services/
│   └── engine/           # Python FastAPI — AI engine
├── .github/
│   └── workflows/        # CI — lint, test, typecheck
└── package.json          # pnpm workspace root
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Python 3.12+

## Deploy

- **Vercel (web)**: see `apps/web/README_VERCEL.md`
- **Hugging Face (engine, Docker Space)**: see `services/engine/README_HUGGINGFACE.md`

### Engine (FastAPI)
```bash
cd services/engine
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # add your API key
uvicorn src.main:app --reload --port 8000
# Docs at http://localhost:8000/docs
```

### Web (Next.js)
```bash
pnpm install                     # from repo root
pnpm dev                         # starts apps/web on :3000
```

## Three User Profiles

| User | Type | Demo Payment |
|------|------|-------------|
| Aarav | YouTuber / Creator | ₹50,000 brand deal |
| Priya | Freelance Designer | ₹80,000 invoice |
| Rohan | Consultant | ₹1,20,000 retainer |

## Core Engine Flow

```
Payment arrives
  → Architect (LLM)          reads context, designs split plan + confidence score
  → Confidence Router         auto_execute | pending_approval | flagged
  → Builder (Deterministic)   pure math, same input = same output always
  → Glass Box Logger          immutable audit trail, plain-English entries
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 App Router, TailwindCSS, Shadcn/ui, Recharts |
| State | Zustand |
| Linting | Biome |
| Package manager | pnpm |
| Backend | Python FastAPI, Pydantic v2, SQLModel |
| AI | Claude API (primary), OpenAI API (fallback) |
| Database | SQLite (dev) → Neon Postgres (prod) |
| CI | GitHub Actions |

## Team

| Role | Owns |
|------|------|
| Lead + Pitcher | Integration, demo script, repo, deployment |
| Frontend Dev | apps/web — UI components, dashboard |
| Backend Bridge | apps/web — API routes, server actions |
| AI / ML | services/engine — FastAPI, LLM, Builder |

**Commit every 2 hours. Never push broken code to main. One person owns integration.**
