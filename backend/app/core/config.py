# app/core/config.py
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

    DATABASE_URL: str


settings = Settings()