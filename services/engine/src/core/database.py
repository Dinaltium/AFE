from sqlmodel import SQLModel, create_engine, Session
from src.core.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")

if _is_sqlite:
    _engine_kwargs: dict = {"connect_args": {"check_same_thread": False}}
else:
    # PostgreSQL / Neon — pre-ping detects dropped connections and reconnects;
    # TCP keepalives prevent the SSL link from being closed while idle.
    _engine_kwargs = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "connect_args": {
            "sslmode": "require",
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        },
    }

engine = create_engine(settings.database_url, **_engine_kwargs)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
