import logging
import uuid
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from src.core.config import settings
from src.core.database import create_db_and_tables
from src.routers import split, audit, vet, users

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(request_id)s | %(name)s | %(message)s",
)

class ContextGateMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Add request_id to logging context via a filter or extra record
        # For simplicity in this demo, we'll just log with the extra field
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # This allows the format string to find 'request_id' in the log record
        old_factory = logging.getLogRecordFactory()
        def record_factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            record.request_id = request_id
            return record
        logging.setLogRecordFactory(record_factory)
        
        response = await call_next(request)
        
        process_time = (time.time() - start_time) * 1000
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        
        return response

app = FastAPI(
    title="AFE — Autonomous Finance Engine",
    description="Agentic AI that auto-splits gig worker income, vets deals, and logs every decision.",
    version="1.0.0",
)

app.add_middleware(ContextGateMiddleware)
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
    logging.info(f"Database: {db_type}", extra={"request_id": "STARTUP"})
    try:
        create_db_and_tables()
        logging.info("Tables ready", extra={"request_id": "STARTUP"})
    except Exception as exc:
        logging.error(f"Could not connect to database on startup: {exc}", extra={"request_id": "STARTUP"})


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
