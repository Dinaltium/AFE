from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    groq_api_key: str = ""
    nvidia_api_key: str = ""
    together_api_key: str = ""
    llm_provider: Literal["groq", "nvidia", "together"] = "groq"
    # Set this to your Neon PostgreSQL connection string for production.
    # Falls back to SQLite for local development.
    database_url: str = "sqlite:///./afe.db"
    neon_database_url: str = ""
    app_env: str = "development"
    app_port: int = 8000

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
