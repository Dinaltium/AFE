from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.core.database import create_db_and_tables
from src.routers import split, audit, vet, users

app = FastAPI(
    title="AFE — Autonomous Finance Engine",
    description="Agentic AI that auto-splits gig worker income, vets deals, and logs every decision.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db_type = "Neon (PostgreSQL)" if "neon.tech" in settings.database_url else "SQLite"
    print(f"[AFE] Database: {db_type}")
    try:
        create_db_and_tables()
        print("[AFE] Tables ready")
    except Exception as exc:
        print(f"[AFE] WARNING: Could not connect to database on startup: {exc}")
        print("[AFE] Engine will start anyway — DB-dependent endpoints will fail until connectivity is restored.")


@app.get("/", tags=["health"])
def root():
    return {"status": "AFE engine running", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


app.include_router(split.router)
app.include_router(audit.router)
app.include_router(vet.router)
app.include_router(users.router)
