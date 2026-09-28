from fastapi import APIRouter, HTTPException
from typing import List

from backend.models.incident import Incident, IncidentCreateRequest, DashboardStats
from backend.services.incident_service import incident_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[Incident])
async def list_incidents():
    """Retrieve all incidents (active, investigating, and historical/resolved)."""
    return incident_service.get_all_incidents()

@router.get("/stats/summary", response_model=DashboardStats)
async def get_dashboard_stats():
    """Retrieve DevOps incident and learning stats for the dashboard."""
    return incident_service.get_dashboard_stats()

@router.get("/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str):
    """Retrieve a specific incident by ID."""
    inc = incident_service.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return inc

@router.post("", response_model=Incident)
async def create_incident(req: IncidentCreateRequest):
    """Create a new live incident."""
    return incident_service.create_incident(req)
