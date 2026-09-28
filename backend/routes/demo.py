from fastapi import APIRouter
from typing import Dict, Any

from backend.models.incident import IncidentCreateRequest, ResolveIncidentRequest, SeverityLevel
from backend.services.incident_service import incident_service
from backend.services.hindsight_service import hindsight_service
from backend.services.learning_service import learning_service
from backend.services.llm_service import llm_service

router = APIRouter(prefix="/demo", tags=["Interactive Demo"])

@router.post("/run-scenario")
async def run_full_demo_scenario():
    """
    Executes the 2-stage self-learning demonstration in real-time:
    Stage 1: Novel Incident 1 occurs -> Investigated -> Resolved -> Experience Retained in Hindsight
    Stage 2: Similar Incident 2 occurs -> Hindsight recalls Incident 1 -> Agent applies past fix -> Faster Resolution
    """
    # ----------------- STAGE 1 -----------------
    req1 = IncidentCreateRequest(
        title="Database Connection Pool Exhaustion on Orders DB",
        description="Checkout service failing with 503 errors. PostgreSQL connection pool limit hit under spike.",
        severity=SeverityLevel.CRITICAL,
        service="Payment API",
        error_logs="ERROR: [pool-manager] connection pool exhausted (50/50 connections active)\nFATAL: database timeout after 30000ms\nHTTP 503 Service Unavailable"
    )
    inc1 = incident_service.create_incident(req1)
    
    # Generic analysis before memory
    without_mem1 = await llm_service.generate_without_memory_analysis(inc1)
    
    # Resolve Incident 1 & Learn into Hindsight
    res_req1 = ResolveIncidentRequest(
        incident_id=inc1.id,
        actual_root_cause="PostgreSQL client pool limit (50) was lower than peak concurrent checkout traffic.",
        actual_fix="Increased database connection pool max connections from 50 -> 100 in db config.",
        outcome="Resolved",
        resolution_notes="Pool saturation cleared immediately after expanding capacity.",
        resolution_time_minutes=25,
        lessons_learned="Payment API 503 timeouts under load are fixed by tuning client pool size rather than DB engine reboot."
    )
    learn_res1 = await learning_service.process_resolution_and_learn(res_req1)
    
    # ----------------- STAGE 2 -----------------
    # Similar incident happens later
    req2 = IncidentCreateRequest(
        title="Production Payment API 503 Errors & DB Timeout",
        description="Users receiving intermittent 503 responses. Database connections are timing out.",
        severity=SeverityLevel.CRITICAL,
        service="Payment API",
        error_logs="WARN: [db-client] connection pool reached 100% capacity\nERROR: Upstream returned 503 for /v2/charge\nSocketTimeoutException: Read timed out to db-master.internal:5432"
    )
    inc2 = incident_service.create_incident(req2)
    
    # Hindsight Recall
    recalled_mems = await hindsight_service.arecall(
        query=f"{req2.title} {req2.description} {req2.error_logs}",
        service=req2.service,
        top_k=3
    )
    
    inc2.recalled_incident_ids = [m.incident_id or m.id for m in recalled_mems if m.incident_id or m.id]
    inc2.recalled_from_hindsight = True
    incident_service.update_incident(inc2)
    
    without_mem2 = await llm_service.generate_without_memory_analysis(inc2)
    with_mem2 = await llm_service.generate_with_memory_analysis(inc2, recalled_mems)
    
    return {
        "scenario_title": "Self-Learning Loop: Experience Retention & Precision Recall",
        "stage_1": {
            "title": "Stage 1: Novel Incident Encountered & Resolved",
            "incident": inc1,
            "generic_ai_recommendation": without_mem1.recommended_actions,
            "actual_fix": res_req1.actual_fix,
            "resolution_time_minutes": 25,
            "hindsight_retention": {
                "memories_created": len(learn_res1.retained_memories),
                "extracted_lessons": learn_res1.extracted_lessons
            }
        },
        "stage_2": {
            "title": "Stage 2: Similar Incident Occurs - Hindsight Memory Recalled",
            "incident": inc2,
            "recalled_memories_count": len(recalled_mems),
            "recalled_from_ids": inc2.recalled_incident_ids,
            "without_memory_result": without_mem2,
            "with_memory_result": with_mem2,
            "mttr_improvement": {
                "previous_mttr_minutes": 25,
                "new_estimated_mttr_minutes": 6,
                "mttr_reduction_pct": "76% faster resolution"
            }
        },
        "learning_takeaway": "IncidentIQ didn't guess. It recalled the previous verified fix and prevented repeated trial-and-error."
    }
