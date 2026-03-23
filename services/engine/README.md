# AFE Engine — Python FastAPI

## Structure

```
services/engine/
├── src/
│   ├── main.py              # FastAPI app entry point
│   ├── core/
│   │   ├── config.py        # Settings from .env (pydantic-settings)
│   │   └── database.py      # SQLite + SQLModel setup
│   ├── models/
│   │   ├── schemas.py       # All Pydantic + SQLModel models
│   │   └── users.py         # Mock user profiles (Aarav, Priya, Rohan)
│   ├── services/
│   │   ├── architect.py     # LLM call — Claude/OpenAI
│   │   ├── builder.py       # Deterministic split math
│   │   ├── router.py        # Confidence routing (auto/pending/flagged)
│   │   ├── glass_box.py     # Audit trail logger
│   │   └── vetting.py       # Deal vetting agent
│   └── routers/
│       ├── split.py         # POST /split/
│       ├── audit.py         # GET  /audit/
│       ├── vet.py           # POST /vet/
│       └── users.py         # GET  /users/
└── tests/
    └── test_engine.py       # 8 tests — Builder + Router
```

## Setup

```bash
cd services/engine
python3 -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # add ANTHROPIC_API_KEY
```

## Run

```bash
uvicorn src.main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive API docs.

## Test

```bash
pytest tests/ -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /split/ | Process a payment — runs full Architect → Builder → Glass Box flow |
| GET | /audit/ | Fetch Glass Box audit log (optional ?user_id= filter) |
| POST | /vet/ | Vet a deal — returns Fair Value Score 0–100 |
| GET | /users/ | List all user profiles |
| GET | /users/{id} | Get a specific user profile |
