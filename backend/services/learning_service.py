import logging
from typing import List, Dict, Any

from backend.models.incident import ResolveIncidentRequest, LearningResolutionResponse, MemoryType, IncidentStatus
from backend.services.hindsight_service import hindsight_service
from backend.services.incident_service import incident_service

logger = logging.getLogger("IncidentIQ.LearningService")

class LearningService:
    def __init__(self):
        pass

    async def process_resolution_and_learn(self, req: ResolveIncidentRequest) -> LearningResolutionResponse:
        incident = incident_service.get_incident(req.incident_id)
        if not incident:
            raise ValueError(f"Incident {req.incident_id} not found")

        # 1. Update incident state
        incident.status = IncidentStatus.RESOLVED if req.outcome.lower() == "resolved" else IncidentStatus.NOT_RESOLVED
        incident.root_cause = req.actual_root_cause
        incident.fix_applied = req.actual_fix
        incident.outcome = req.outcome
        incident.resolution_time_minutes = req.resolution_time_minutes or 10
        
        # 2. Extract lessons
        extracted_lessons: List[str] = []
        if req.lessons_learned and req.lessons_learned.strip():
            extracted_lessons.append(req.lessons_learned.strip())
        
        # Auto-synthesized operational lesson if not provided
        auto_rule = f"When {incident.service} encounters '{incident.title}', verify root cause '{req.actual_root_cause}' and apply: '{req.actual_fix}'."
        if auto_rule not in extracted_lessons:
            extracted_lessons.append(auto_rule)
            
        incident.lessons_learned = extracted_lessons
        incident_service.update_incident(incident)

        # 3. Retain experience to Hindsight Long-Term Memory
        retained_memories = []
        
        # A. Primary Incident Experience Memory
        mem1 = await hindsight_service.aretain(
            incident_id=incident.id,
            title=f"Resolved: {incident.title}",
            service=incident.service,
            memory_type=MemoryType.INCIDENT,
            content=(
                f"Incident {incident.id}: {incident.title}\n"
                f"Service: {incident.service} | Severity: {incident.severity}\n"
                f"Symptoms: {incident.description}\n"
                f"Error Logs: {incident.error_logs}\n"
                f"Confirmed Root Cause: {req.actual_root_cause}\n"
                f"Effective Fix: {req.actual_fix}\n"
                f"Outcome: {req.outcome} (MTTR: {req.resolution_time_minutes} min)\n"
                f"Lesson: {'; '.join(extracted_lessons)}"
            ),
            symptoms=[s.strip() for s in incident.description.split(".") if s.strip()],
            root_cause=req.actual_root_cause,
            fix_applied=req.actual_fix,
            outcome=req.outcome,
            resolution_time_minutes=req.resolution_time_minutes,
            lesson=extracted_lessons[0] if extracted_lessons else "",
            tags=["resolved-experience", incident.service.lower().replace(" ", "-"), incident.severity.lower()]
        )
        retained_memories.append(mem1)

        # B. Operational SRE Knowledge Memory
        mem2 = await hindsight_service.aretain(
            incident_id=incident.id,
            title=f"SRE Operational Pattern: {incident.service} Remediation",
            service=incident.service,
            memory_type=MemoryType.OPERATIONAL,
            content=(
                f"Operational Pattern for {incident.service}: "
                f"Observed error signature: '{incident.error_logs[:120]}...'. "
                f"Verified fix: '{req.actual_fix}'. "
                f"Avoid generic restarts; fix directly targeted the root cause: {req.actual_root_cause}."
            ),
            symptoms=[incident.service, "production-incident"],
            root_cause=req.actual_root_cause,
            fix_applied=req.actual_fix,
            outcome=req.outcome,
            resolution_time_minutes=req.resolution_time_minutes,
            lesson=extracted_lessons[0] if extracted_lessons else "",
            tags=["operational-pattern", "sre-playbook"]
        )
        retained_memories.append(mem2)

        # C. Learning Memory (Reflective Rule)
        mem3 = await hindsight_service.aretain(
            incident_id=incident.id,
            title=f"Learned Rule for {incident.service}",
            service=incident.service,
            memory_type=MemoryType.LEARNING,
            content=(
                f"Learned Experience: {extracted_lessons[0]}. "
                f"Resolved with MTTR of {req.resolution_time_minutes}m."
            ),
            root_cause=req.actual_root_cause,
            fix_applied=req.actual_fix,
            outcome=req.outcome,
            resolution_time_minutes=req.resolution_time_minutes,
            lesson=extracted_lessons[0],
            tags=["learning-rule", "self-learning"]
        )
        retained_memories.append(mem3)

        logger.info(f"Retained {len(retained_memories)} memories into Hindsight for incident {incident.id}")

        return LearningResolutionResponse(
            success=True,
            incident_id=incident.id,
            retained_memories=retained_memories,
            extracted_lessons=extracted_lessons,
            hindsight_bank=hindsight_service.bank_id,
            message="Incident resolved and new experience retained into Hindsight long-term memory.",
            mttr_reduction_est_pct=45
        )

learning_service = LearningService()
