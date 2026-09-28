import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "IncidentIQ"
    API_V1_STR: str = "/api/v1"
    
    # Hindsight Configuration
    HINDSIGHT_API_URL: str = os.getenv("HINDSIGHT_API_URL", "http://localhost:8888")
    HINDSIGHT_API_KEY: str = os.getenv("HINDSIGHT_API_KEY", "")
    HINDSIGHT_BANK_ID: str = os.getenv("HINDSIGHT_BANK_ID", "incidentiq-ops")
    
    # LLM Configuration (Groq / OpenAI compatible)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.groq.com/openai/v1" if os.getenv("GROQ_API_KEY") else "https://api.openai.com/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile" if os.getenv("GROQ_API_KEY") else "gpt-4o-mini")
    
    # Storage
    DATA_DIR: str = os.getenv("DATA_DIR", os.path.join(os.path.dirname(__file__), "data"))
    
    PORT: int = int(os.getenv("PORT", "8080"))

settings = Settings()
