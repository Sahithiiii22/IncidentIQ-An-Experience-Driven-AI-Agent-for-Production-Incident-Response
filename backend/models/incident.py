from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime

class SeverityLevel(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class IncidentStatus(str, Enum):
    ACTIVE = "Active"
    INVESTIGATING = "Investigating"
    RESOLVED = "Resolved"
    NOT_RESOLVED = "Not Resolved"

class MemoryType(str, Enum):
    INCIDENT = "Incident"
    OPERATIONAL = "Operational"
    LEARNING = "Learning"

class IncidentCreateRequest(BaseModel):
    title: str = Field(..., description="Short descriptive title of the incident")
    description: str = Field(..., description="Detailed description of the observed issue")
    severity: SeverityLevel = Field(default=SeverityLevel.HIGH)
    service: str = Field(..., description="Affected microservice or infrastructure component")
    error_logs: str = Field(default="", description="Stack traces, error logs, or metrics excerpts")

class Incident(BaseModel):
    id: str
    title: str
    description: str
    severity: SeverityLevel
    service: str
    error_logs: str
    timestamp: str
    status: IncidentStatus = IncidentStatus.ACTIVE
    
    # Post-investigation & resolution attributes
    root_cause: Optional[str] = None
    fix_applied: Optional[str] = None
    outcome: Optional[str] = None
    resolution_time_minutes: Optional[int] = None
    lessons_learned: List[str] = Field(default_factory=list)
    recalled_from_hindsight: bool = False
    recalled_incident_ids: List[str] = Field(default_factory=list)

class MemoryItem(BaseModel):
    id: str
    bank_id: str = "incidentiq-ops"
    incident_id: Optional[str] = None
    memory_type: MemoryType = MemoryType.INCIDENT
    title: str
    service: str
    content: str
    symptoms: List[str] = Field(default_factory=list)
    root_cause: Optional[str] = None
    fix_applied: Optional[str] = None
    outcome: Optional[str] = None
    resolution_time_minutes: Optional[int] = None
    lesson: Optional[str] = None
    similarity_score: float = 0.0
    created_at: str
    tags: List[str] = Field(default_factory=list)

class GenericAnalysis(BaseModel):
    likely_root_cause: str
    evidence: List[str]
    recommended_actions: List[str]
    reasoning: str
    estimated_confidence: int = 40
    approach_type: str = "Without Memory (Standard Generic AI)"

class ExperienceAnalysis(BaseModel):
    likely_root_cause: str
    evidence: List[str]
    recommended_actions: List[str]
    why_this_recommendation: str
    relevant_memories: List[MemoryItem] = Field(default_factory=list)
    relevant_past_incidents: List[Dict[str, Any]] = Field(default_factory=list)
    estimated_confidence: int = 92
    potential_risks: List[str] = Field(default_factory=list)
    approach_type: str = "With Hindsight (Experience-Driven Memory)"

class InvestigationResponse(BaseModel):
    incident_id: str
    service: str
    severity: str
    symptoms_detected: List[str]
    without_memory: GenericAnalysis
    with_memory: ExperienceAnalysis
    hindsight_recalled_count: int
    key_differentiator: str
    hindsight_bank_id: str
    investigated_at: str

class ResolveIncidentRequest(BaseModel):
    incident_id: str
    actual_root_cause: str
    actual_fix: str
    outcome: str = "Resolved"
    resolution_notes: Optional[str] = ""
    resolution_time_minutes: Optional[int] = 12
    lessons_learned: Optional[str] = ""

class LearningResolutionResponse(BaseModel):
    success: bool
    incident_id: str
    retained_memories: List[Dict[str, Any]]
    extracted_lessons: List[str]
    hindsight_bank: str
    message: str
    mttr_reduction_est_pct: int = 45

class DashboardStats(BaseModel):
    active_incidents_count: int
    resolved_incidents_count: int
    historical_incidents_count: int
    memories_stored_count: int
    similar_incidents_found_count: int
    avg_resolution_time_minutes: float
    memory_mttr_avg_minutes: float = 8.5
    no_memory_mttr_avg_minutes: float = 22.0
    mttr_improvement_pct: int = 61
    learning_velocity_score: int
    hindsight_connected: bool
    llm_provider: str
