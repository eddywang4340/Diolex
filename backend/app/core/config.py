# app/core/config.py
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field

# Get the project root directory (3 levels up from this file)
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"

class Settings(BaseSettings):
    model_config = {
        "env_file": str(ENV_FILE),
        "extra": "ignore"
    }
    
    # Database
    DATABASE_URL: str = Field(..., description="Database connection URL")

settings = Settings()