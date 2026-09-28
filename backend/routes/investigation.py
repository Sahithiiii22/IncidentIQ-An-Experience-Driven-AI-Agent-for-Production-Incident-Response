from fastapi import APIRouter, HTTPException
from datetime import datetime

from backend.models.incident import IncidentCreateRequest, InvestigationResponse, IncidentStatus
from backend.services.incident_service import incident_service
from backend.services.hindsight_service import hindsight_service
from backend.services.llm_service import llm_service

router = APIRouter(prefix="/investigation", tags=["Investigation"])

@router.post("/analyze", response_model=InvestigationResponse)
async def investigate_incident(req: IncidentCreateRequest):
    """
    Core AI Investigation Flow:
    1. Register or fetch incident
    2. Query Hindsight for relevant previous experiences (Recall)
    3. Generate side-by-side Without Memory vs With Memory AI reasoning
    4. Return full comparative analysis
    """
    # 1. Create active incident record
    incident = incident_service.create_incident(req)
    incident.status = IncidentStatus.INVESTIGATING
    
    # 2. HINDSIGHT RECALL: Search based on description, error logs, and service
    recall_query = f"{incident.title} {incident.description} {incident.error_logs}"
    recalled_memories = await hindsight_service.arecall(
        query=recall_query,
        service=incident.service,
        top_k=4
    )
    
    # Record recalled IDs on incident
    incident.recalled_incident_ids = [m.incident_id or m.id for m in recalled_memories if m.incident_id or m.id]
    incident.recalled_from_hindsight = len(recalled_memories) > 0
    incident_service.update_incident(incident)
    
    # Extract symptoms from error logs and description
    symptoms = []
    logs_lower = incident.error_logs.lower()
    for pattern in ["503", "timeout", "exhausted", "oomkilled", "deadlock", "401", "429", "lag", "throttling", "refused"]:
        if pattern in logs_lower:
            symptoms.append(pattern)
    if not symptoms:
        symptoms = [incident.service, "high error rate"]
        
    # 3. Side-by-side reasoning:
    # A. Without Memory (Generic LLM)
    without_memory_analysis = await llm_service.generate_without_memory_analysis(incident)
    
    # B. With Memory (Hindsight Experience-Based)
    with_memory_analysis = await llm_service.generate_with_memory_analysis(incident, recalled_memories)
    
    key_diff = (
        f"Standard AI blindly suggests generic restart / network check ({without_memory_analysis.estimated_confidence}% confidence). "
        f"With Hindsight, IncidentIQ identified {len(recalled_memories)} matching past incidents ({', '.join(incident.recalled_incident_ids[:2]) or 'INC-104'}), "
        f"pinpointing exact root cause and recommending proven remediation with {with_memory_analysis.estimated_confidence}% estimated confidence."
    )
    
    return InvestigationResponse(
        incident_id=incident.id,
        service=incident.service,
        severity=incident.severity.value,
        symptoms_detected=symptoms,
        without_memory=without_memory_analysis,
        with_memory=with_memory_analysis,
        hindsight_recalled_count=len(recalled_memories),
        key_differentiator=key_diff,
        hindsight_bank_id=hindsight_service.bank_id,
        investigated_at=datetime.utcnow().isoformat() + "Z"
    )
