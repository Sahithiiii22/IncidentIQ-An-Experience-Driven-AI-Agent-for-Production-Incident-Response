import os
import json
import logging
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

from backend.config import settings
from backend.models.incident import MemoryItem, MemoryType

logger = logging.getLogger("IncidentIQ.Hindsight")

class HindsightService:
    def __init__(self):
        self.bank_id = settings.HINDSIGHT_BANK_ID
        self.api_url = settings.HINDSIGHT_API_URL
        self.api_key = settings.HINDSIGHT_API_KEY
        self.client = None
        self.connected_to_server = False
        
        # Local persistent memory bank store for quick offline access and fallback
        self.storage_dir = settings.DATA_DIR
        os.makedirs(self.storage_dir, exist_ok=True)
        self.storage_file = os.path.join(self.storage_dir, "hindsight_bank.json")
        self.local_memories: List[Dict[str, Any]] = []
        self._load_local_store()
        
        self._init_client()

    def _init_client(self):
        try:
            from hindsight_client import Hindsight
            self.client = Hindsight(
                base_url=self.api_url,
                api_key=self.api_key if self.api_key else None,
                timeout=30.0
            )
            self.connected_to_server = True
            logger.info(f"Connected to live Hindsight API at {self.api_url} (Bank: {self.bank_id})")
        except Exception as e:
            logger.warning(f"Hindsight client initialization warning: {e}")
            self.connected_to_server = False

    def _load_local_store(self):
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, "r", encoding="utf-8") as f:
                    self.local_memories = json.load(f)
            except Exception as e:
                logger.error(f"Failed to read local memories: {e}")
                self.local_memories = []
        else:
            self.local_memories = []

    def _save_local_store(self):
        try:
            with open(self.storage_file, "w", encoding="utf-8") as f:
                json.dump(self.local_memories, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save local memories: {e}")

    async def aretain(
        self,
        content: str,
        title: str,
        service: str,
        memory_type: MemoryType = MemoryType.INCIDENT,
        incident_id: Optional[str] = None,
        symptoms: Optional[List[str]] = None,
        root_cause: Optional[str] = None,
        fix_applied: Optional[str] = None,
        outcome: Optional[str] = None,
        resolution_time_minutes: Optional[int] = None,
        lesson: Optional[str] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Retain an incident experience into Vectorize Hindsight long-term memory (async).
        """
        doc_id = incident_id or f"MEM-{len(self.local_memories) + 101}"
        memory_id = f"MEM-{len(self.local_memories) + 101}"
        created_at = datetime.utcnow().isoformat() + "Z"
        
        # Prepare structured metadata for Hindsight
        h_metadata = {
            "incident_id": incident_id or doc_id,
            "title": title or "",
            "service": service or "",
            "status": outcome or "Resolved",
            "root_cause": root_cause or "",
            "fix_applied": fix_applied or "",
            "resolution_time": str(resolution_time_minutes or 10),
            "lesson": lesson or ""
        }
        if metadata:
            h_metadata.update({k: str(v) for k, v in metadata.items()})

        h_tags = tags or []
        if service:
            h_tags.append(service.lower().replace(" ", "-"))
        if memory_type:
            h_tags.append(str(memory_type).lower())

        structured_content = (
            f"Incident {incident_id or doc_id} on {service}: {title}\n"
            f"Symptoms: {', '.join(symptoms or [])}\n"
            f"Confirmed Root Cause: {root_cause}\n"
            f"Remediation Applied: {fix_applied}\n"
            f"Outcome: {outcome} (MTTR: {resolution_time_minutes} min)\n"
            f"Lesson Learned: {lesson}\n"
            f"Details: {content}"
        )

        # 1. Call real Hindsight API aretain with structured debug logs
        print("[HINDSIGHT] RETAIN START")
        print(f"[HINDSIGHT] BANK: {self.bank_id}")
        print(f"[HINDSIGHT] DOCUMENT/EXPERIENCE ID: {doc_id}")
        
        live_retain_success = False
        if self.client:
            try:
                res = await self.client.aretain(
                    bank_id=self.bank_id,
                    content=structured_content,
                    document_id=doc_id,
                    tags=list(set(h_tags)),
                    metadata=h_metadata
                )
                live_retain_success = True
                self.connected_to_server = True
                print("[HINDSIGHT] RETAIN SUCCESS")
                logger.info(f"Retained memory {doc_id} into live Hindsight API: {res}")
            except Exception as e:
                print(f"[HINDSIGHT] RETAIN FAILED: {type(e).__name__}: {str(e)}")
                logger.warning(f"Could not complete live retain on Hindsight API: {e}")

        # 2. Local memory entry
        mem_data = {
            "id": memory_id,
            "bank_id": self.bank_id,
            "incident_id": incident_id or doc_id,
            "memory_type": memory_type.value if hasattr(memory_type, "value") else str(memory_type),
            "title": title,
            "service": service,
            "content": content,
            "symptoms": symptoms or [],
            "root_cause": root_cause,
            "fix_applied": fix_applied,
            "outcome": outcome or "Resolved",
            "resolution_time_minutes": resolution_time_minutes,
            "lesson": lesson,
            "tags": list(set(h_tags)),
            "metadata": h_metadata,
            "created_at": created_at,
            "live_synced": live_retain_success
        }

        # Check existing by incident_id + type
        existing_idx = -1
        if incident_id:
            for idx, item in enumerate(self.local_memories):
                if item.get("incident_id") == incident_id and item.get("memory_type") == mem_data["memory_type"]:
                    existing_idx = idx
                    break

        if existing_idx >= 0:
            mem_data["id"] = self.local_memories[existing_idx]["id"]
            self.local_memories[existing_idx] = mem_data
        else:
            self.local_memories.insert(0, mem_data)

        self._save_local_store()
        return mem_data

    def retain(self, *args, **kwargs):
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(asyncio.run, self.aretain(*args, **kwargs))
                    return future.result()
            else:
                return loop.run_until_complete(self.aretain(*args, **kwargs))
        except Exception:
            return asyncio.run(self.aretain(*args, **kwargs))

    async def arecall(
        self,
        query: str,
        service: Optional[str] = None,
        top_k: int = 4
    ) -> List[MemoryItem]:
        """
        Query Hindsight Recall for relevant previous experiences (async).
        Uses real Hindsight API recall when available and distinct historical matching.
        """
        sanitized_query = query.replace("\n", " ").strip()
        if len(sanitized_query) > 120:
            sanitized_query = sanitized_query[:117] + "..."

        print("[HINDSIGHT] RECALL START")
        print(f"[HINDSIGHT] BANK: {self.bank_id}")
        print(f"[HINDSIGHT] QUERY: {sanitized_query}")

        live_recalled_items: List[MemoryItem] = []
        seen_incident_ids = set()

        # 1. Try Live Hindsight API arecall
        if self.client:
            try:
                recall_res = await self.client.arecall(
                    bank_id=self.bank_id,
                    query=f"{query} {service or ''}",
                    budget="mid"
                )
                self.connected_to_server = True
                
                if hasattr(recall_res, "results") and recall_res.results:
                    for r in recall_res.results:
                        meta = getattr(r, "metadata", {}) or {}
                        inc_id = meta.get("incident_id")
                        
                        text = getattr(r, "text", "")
                        r_score = 0.95
                        if hasattr(r, "scores") and r.scores and hasattr(r.scores, "final"):
                            r_score = min(0.99, max(0.60, float(r.scores.final)))

                        # Extract details from metadata or parsed text
                        r_title = meta.get("title")
                        r_cause = meta.get("root_cause")
                        r_fix = meta.get("fix_applied")
                        r_lesson = meta.get("lesson")
                        r_service = meta.get("service") or service or "Service"
                        r_outcome = meta.get("status") or "Resolved"
                        r_time = int(meta.get("resolution_time") or 12)

                        # Match with local catalog if needed for full title/symptoms
                        matching_local = next((m for m in self.local_memories if m.get("incident_id") == inc_id), None)
                        if matching_local:
                            r_title = r_title or matching_local.get("title", f"Incident {inc_id}")
                            r_cause = r_cause or matching_local.get("root_cause")
                            r_fix = r_fix or matching_local.get("fix_applied")
                            r_lesson = r_lesson or matching_local.get("lesson")
                            r_symptoms = matching_local.get("symptoms", [])
                        else:
                            r_title = r_title or f"Historical Incident: {r_cause or service or 'Outage'}"
                            r_symptoms = [s.strip() for s in text.split("\n") if s.strip()][:3]

                        target_id = inc_id or getattr(r, "document_id", None) or f"INC-{abs(hash(text)) % 900 + 100}"
                        if target_id not in seen_incident_ids:
                            seen_incident_ids.add(target_id)
                            live_recalled_items.append(MemoryItem(
                                id=getattr(r, "id", f"MEM-{len(live_recalled_items)+1}"),
                                bank_id=self.bank_id,
                                incident_id=target_id,
                                memory_type=MemoryType.INCIDENT,
                                title=r_title,
                                service=r_service,
                                content=text,
                                symptoms=r_symptoms,
                                root_cause=r_cause or "Identified root cause from past incident",
                                fix_applied=r_fix or "Applied verified remediation",
                                outcome=r_outcome,
                                resolution_time_minutes=r_time,
                                lesson=r_lesson or "Verified operational rule from past incident.",
                                similarity_score=round(r_score, 2),
                                created_at=getattr(r, "mentioned_at", datetime.utcnow().isoformat()) or datetime.utcnow().isoformat(),
                                tags=getattr(r, "tags", []) or []
                            ))
                            if len(live_recalled_items) >= top_k:
                                break

                    if live_recalled_items:
                        print(f"[HINDSIGHT] RESULTS: {len(live_recalled_items)}")
                        print("[HINDSIGHT] RECALL SUCCESS")
                        logger.info(f"Recalled {len(live_recalled_items)} distinct experiences from live Hindsight API")
                        return live_recalled_items
                    else:
                        print("[HINDSIGHT] RESULTS: 0")
                        print("[HINDSIGHT] RECALL SUCCESS (0 results)")
            except Exception as e:
                print(f"[HINDSIGHT] RECALL FAILED: {type(e).__name__}: {str(e)}")
                logger.warning(f"Live Hindsight recall query encountered exception: {e}")

        # 2. Fallback / Multi-strategy search on cached bank memories
        query_text = f"{query} {service or ''}".lower()
        query_words = set(re.findall(r"\b\w{3,}\b", query_text))
        
        scored_items = []
        for item in self.local_memories:
            score = 0.0
            item_service = (item.get("service") or "").lower()
            item_title = (item.get("title") or "").lower()
            item_cause = (item.get("root_cause") or "").lower()
            item_fix = (item.get("fix_applied") or "").lower()
            item_content = (item.get("content") or "").lower()
            symptoms = [s.lower() for s in item.get("symptoms") or []]
            tags = [t.lower() for t in item.get("tags") or []]
            
            if service and item_service and (service.lower() in item_service or item_service in service.lower()):
                score += 0.35
            
            sre_patterns = [
                ("connection pool", 0.50),
                ("pool exhausted", 0.55),
                ("503", 0.40),
                ("timeout", 0.30),
                ("oom", 0.45),
                ("oomkilled", 0.50),
                ("deadlock", 0.45),
                ("dns", 0.40),
                ("jwt", 0.40)
            ]
            for pat, weight in sre_patterns:
                if pat in query_text and (pat in item_title or pat in item_cause or pat in item_content or any(pat in s for s in symptoms)):
                    score += weight

            for word in query_words:
                if word in ["error", "service", "failed", "production", "issue"]:
                    continue
                if word in item_cause:
                    score += 0.15
                if word in item_title:
                    score += 0.12
                if any(word in s for s in symptoms):
                    score += 0.12
                if word in item_fix:
                    score += 0.08
                if any(word in t for t in tags):
                    score += 0.10

            score = min(0.99, max(0.10, score))
            
            if score > 0.25:
                memory_item = MemoryItem(
                    id=item.get("id"),
                    bank_id=item.get("bank_id", self.bank_id),
                    incident_id=item.get("incident_id"),
                    memory_type=MemoryType(item.get("memory_type", "Incident")),
                    title=item.get("title", "Historical Incident"),
                    service=item.get("service", "Unknown"),
                    content=item.get("content", ""),
                    symptoms=item.get("symptoms", []),
                    root_cause=item.get("root_cause"),
                    fix_applied=item.get("fix_applied"),
                    outcome=item.get("outcome", "Resolved"),
                    resolution_time_minutes=item.get("resolution_time_minutes", 12),
                    lesson=item.get("lesson"),
                    similarity_score=round(score, 2),
                    created_at=item.get("created_at", datetime.utcnow().isoformat()),
                    tags=item.get("tags", [])
                )
                scored_items.append((score, memory_item))

        scored_items.sort(key=lambda x: x[0], reverse=True)
        
        distinct_recalled: List[MemoryItem] = []
        for score, mem in scored_items:
            inc_id = mem.incident_id or mem.id
            if inc_id not in seen_incident_ids:
                seen_incident_ids.add(inc_id)
                distinct_recalled.append(mem)
                if len(distinct_recalled) >= top_k:
                    break

        return distinct_recalled

    def recall(self, *args, **kwargs) -> List[MemoryItem]:
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(asyncio.run, self.arecall(*args, **kwargs))
                    return future.result()
            else:
                return loop.run_until_complete(self.arecall(*args, **kwargs))
        except Exception:
            return asyncio.run(self.arecall(*args, **kwargs))

    def reflect(self, query: str) -> str:
        """
        Synthesize mental model across Hindsight memories.
        """
        recalled = self.recall(query, top_k=3)
        if not recalled:
            return "No historical operational patterns recorded yet in Hindsight for this query."
        
        lessons = [m.lesson for m in recalled if m.lesson]
        fixes = [f"{m.incident_id}: {m.fix_applied}" for m in recalled if m.fix_applied]
        
        synthesis = f"Operational Reflection across {len(recalled)} Hindsight memories: "
        if fixes:
            synthesis += f"Key historical remediations: {'; '.join(fixes)}. "
        if lessons:
            synthesis += f"Learned operational rules: {'; '.join(lessons[:2])}"
        return synthesis

    def get_all_memories(self) -> List[Dict[str, Any]]:
        return self.local_memories

    def get_stats(self) -> Dict[str, Any]:
        types = {}
        for m in self.local_memories:
            m_type = m.get("memory_type", "Incident")
            types[m_type] = types.get(m_type, 0) + 1
        return {
            "bank_id": self.bank_id,
            "total_memories": len(self.local_memories),
            "by_type": types,
            "connected_to_live_server": self.connected_to_server,
            "api_url": self.api_url
        }

hindsight_service = HindsightService()
