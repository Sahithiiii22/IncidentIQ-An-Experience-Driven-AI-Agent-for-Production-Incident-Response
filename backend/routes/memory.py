from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from backend.models.incident import ResolveIncidentRequest, LearningResolutionResponse, MemoryItem
from backend.services.hindsight_service import hindsight_service
from backend.services.learning_service import learning_service
from backend.services.incident_service import incident_service

router = APIRouter(prefix="/memory", tags=["Memory & Learning"])

class RecallQueryRequest(BaseModel):
    query: str
    service: Optional[str] = None
    top_k: int = 5

class ReflectQueryRequest(BaseModel):
    query: str

@router.get("/bank/status")
async def get_bank_status():
    """Get Hindsight bank statistics and health information."""
    return hindsight_service.get_stats()

@router.get("/bank/memories")
async def get_all_bank_memories():
    """Retrieve all retained memories in the active Hindsight bank."""
    return hindsight_service.get_all_memories()

@router.post("/recall", response_model=List[MemoryItem])
async def recall_memories(req: RecallQueryRequest):
    """Direct query into Hindsight memory bank."""
    return await hindsight_service.arecall(query=req.query, service=req.service, top_k=req.top_k)

@router.post("/reflect")
async def reflect_operational_insights(req: ReflectQueryRequest):
    """Generate synthesized operational reflection across Hindsight memory bank."""
    recalled = await hindsight_service.arecall(query=req.query, top_k=3)
    if not recalled:
        reflection = "No historical operational patterns recorded yet in Hindsight for this query."
    else:
        lessons = [m.lesson for m in recalled if m.lesson]
        fixes = [f"{m.incident_id}: {m.fix_applied}" for m in recalled if m.fix_applied]
        reflection = f"Operational Reflection across {len(recalled)} Hindsight memories: "
        if fixes:
            reflection += f"Key historical remediations: {'; '.join(fixes)}. "
        if lessons:
            reflection += f"Learned operational rules: {'; '.join(lessons[:2])}"
            
    return {
        "query": req.query,
        "reflection": reflection,
        "bank_id": hindsight_service.bank_id
    }

@router.post("/resolve-and-learn", response_model=LearningResolutionResponse)
async def resolve_and_learn(req: ResolveIncidentRequest):
    """
    Mark an incident as resolved, extract structured operational knowledge,
    and retain the new experience into Hindsight memory bank.
    """
    try:
        return await learning_service.process_resolution_and_learn(req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to learn resolution: {str(e)}")

@router.get("/timeline")
async def get_memory_timeline():
    """
    Returns visual timeline data demonstrating how past incidents
    stored memories and how subsequent incidents recalled them to resolve faster.
    """
    incidents = incident_service.get_all_incidents()
    # Sort by ID or timestamp
    sorted_inc = sorted(incidents, key=lambda x: x.id)
    
    timeline_events = []
    for inc in sorted_inc:
        timeline_events.append({
            "incident_id": inc.id,
            "title": inc.title,
            "service": inc.service,
            "severity": inc.severity,
            "status": inc.status,
            "root_cause": inc.root_cause,
            "fix_applied": inc.fix_applied,
            "outcome": inc.outcome,
            "resolution_time_minutes": inc.resolution_time_minutes,
            "lessons_learned": inc.lessons_learned,
            "recalled_from_hindsight": inc.recalled_from_hindsight,
            "recalled_incident_ids": inc.recalled_incident_ids,
            "timestamp": inc.timestamp
        })
        
    return {
        "bank_id": hindsight_service.bank_id,
        "total_events": len(timeline_events),
        "timeline": timeline_events
    }
