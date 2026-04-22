# AFE — Autonomous Finance Engine

> Agentic AI that auto-splits gig worker income, vets deals, and logs every financial decision transparently.

## Problem statement

Independent workers (creators, freelancers, consultants) receive irregular income across multiple sources and must make fast, high-stakes decisions:

- What is the **true take‑home** after tax/GST/TDS considerations?
- How should revenue be **split with collaborators** fairly and consistently?
- Is an incoming offer **market‑fair**, or is it underpriced/overscoped?

Today these are handled with spreadsheets, ad-hoc rules, and inconsistent judgement, which leads to under‑saving for taxes, collaborator disputes, and accepting underpriced work.

**AFE** addresses this by combining a deterministic finance “builder” (repeatable math) with an AI “architect” and “vetting” agent (decision support) and a “glass box” audit trail (explainability).

## Outcomes

- **Consistency**: identical inputs produce identical split outputs
- **Transparency**: every action has a human-readable audit log entry
- **Control**: confidence routing supports auto‑execute vs pending approval vs flagged
- **Speed**: users can process payments and vet deals in seconds

## Structure

```
afe/
├── apps/
│   └── web/              # Next.js — dashboard UI
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

## Architecture (high level)

```
Web (Next.js)
  ├─ Auth (NextAuth)
  ├─ Server actions (DB writes/reads)
  └─ Engine proxy calls (ENGINE_URL)

Engine (FastAPI)
  ├─ /split  → architect + router + builder
  ├─ /vet    → vetting agent
  └─ /audit  → glass box log
```

## Demo user profiles

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
| Frontend | Next.js App Router, TailwindCSS, shadcn/ui, Recharts |
| State | Zustand |
| Linting | Biome |
| Package manager | pnpm |
| Backend | Python FastAPI, Pydantic v2, SQLModel |
| AI | Multi-provider (Groq/NVIDIA/Together) in engine |
| Database | SQLite (dev) → Neon Postgres (prod) |
| CI | GitHub Actions |

## Security & operations notes

- **Secrets**: never commit `.env` / `.env.local`. Use Vercel env vars and Hugging Face Space Secrets.
- **Auditability**: engine and web record human-readable reasoning for key actions.
- **Health checks**: engine exposes `GET /health`; web build should pass `pnpm -C apps/web build`.

## Team

| Role | Owns |
|------|------|
| Lead + Pitcher | Integration, demo script, repo, deployment |
| Frontend Dev | apps/web — UI components, dashboard |
| Backend Bridge | apps/web — API routes, server actions |
| AI / ML | services/engine — FastAPI, LLM, Builder |

**Commit every 2 hours. Never push broken code to main. One person owns integration.**
