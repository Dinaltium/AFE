from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    groq_api_key: str = ""
    llm_provider: Literal["anthropic", "openai", "groq"] = "groq"
    # Set this to your Neon PostgreSQL connection string for production.
    # Falls back to SQLite for local development.
    database_url: str = "sqlite:///./afe.db"
    neon_database_url: str = ""
    app_env: str = "development"
    app_port: int = 8000

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
