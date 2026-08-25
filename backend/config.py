import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Billa ai"
    AI_NAME: str = "Billa ai"
    DEFAULT_USER_NAME: str = "Api"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8080
    
    # Database settings
    MONGODB_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "billa_ai"
    USE_LOCAL_FALLBACK: bool = True  # If MongoDB server is down, fallback to persistent JSON storage
    
    # LLM Settings
    DEFAULT_LLM_PROVIDER: str = "gemini"  # "gemini", "openai", "groq"
    
    # Google Gemini (100% Free via Google AI Studio)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    
    # OpenAI (ChatGPT)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Groq
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
