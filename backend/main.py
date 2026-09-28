import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

from backend.config import settings
from backend.routes.incidents import router as incidents_router
from backend.routes.investigation import router as investigation_router
from backend.routes.memory import router as memory_router
from backend.routes.demo import router as demo_router
from backend.services.incident_service import incident_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("IncidentIQ")

app = FastAPI(
    title="IncidentIQ API",
    description="An Experience-Driven AI Agent for Self-Learning Production Incident Response powered by Hindsight",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(investigation_router, prefix=settings.API_V1_STR)
app.include_router(memory_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "app": "IncidentIQ",
        "description": "Experience-Driven AI Incident Response Agent with Hindsight Long-Term Memory",
        "status": "healthy",
        "hindsight_bank": settings.HINDSIGHT_BANK_ID,
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "hindsight_bank": settings.HINDSIGHT_BANK_ID,
        "hindsight_server_url": settings.HINDSIGHT_API_URL,
        "llm_model": settings.LLM_MODEL
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
