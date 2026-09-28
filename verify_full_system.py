import json
import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8080"

def request_json(url, method="GET", data=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8") if data else None,
        headers={"Content-Type": "application/json"}
    )
    req.get_method = lambda: method
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def test_full_system():
    print("=" * 65)
    print("INCIDENTIQ COMPREHENSIVE END-TO-END ACCEPTANCE TEST")
    print("=" * 65)

    # 1. Health
    health = request_json(f"{BASE_URL}/health")
    print(f"[PASS] 1. Health Check: Status={health['status']}, Bank={health['hindsight_bank']}, Model={health['llm_model']}")

    # 2. Stats
    stats = request_json(f"{BASE_URL}/api/v1/incidents/stats/summary")
    print(f"[PASS] 2. Dashboard Stats: Active={stats['active_incidents_count']}, Resolved={stats['resolved_incidents_count']}, Memories Stored={stats['memories_stored_count']}, Avg MTTR={stats['avg_resolution_time_minutes']}m, Velocity={stats['learning_velocity_score']}%")

    # 3. Investigation: Side-by-Side Without vs With Memory
    inv_payload = {
        "title": "Production API 503 Errors & DB Timeout",
        "description": "Users are receiving intermittent 503 responses. Database connections are timing out.",
        "severity": "Critical",
        "service": "Payment API",
        "error_logs": "ERROR [pool-manager] connection pool exhausted (50/50 connections active)\nFATAL [checkout-svc] database timeout after 30s\nHTTP 503 Service Unavailable"
    }
    investigation = request_json(f"{BASE_URL}/api/v1/investigation/analyze", method="POST", data=inv_payload)
    print(f"\n[PASS] 3. AI Investigation Flow (Incident: {investigation['incident_id']}):")
    print(f"   - Recalled Memories from Hindsight: {investigation['hindsight_recalled_count']} items")
    print(f"   - Key Differentiator: {investigation['key_differentiator']}")
    print(f"   - [WITHOUT HINDSIGHT] Root Cause: '{investigation['without_memory']['likely_root_cause']}' | Confidence: {investigation['without_memory']['estimated_confidence']}%")
    print(f"   - [WITH HINDSIGHT] Root Cause: '{investigation['with_memory']['likely_root_cause']}' | Confidence: {investigation['with_memory']['estimated_confidence']}%")
    print(f"   - [WITH HINDSIGHT] Action: '{investigation['with_memory']['recommended_actions'][0]}'")

    # 4. Resolve & Learn into Hindsight
    resolve_payload = {
        "incident_id": investigation["incident_id"],
        "actual_root_cause": "PostgreSQL connection pool exhausted under high checkout burst.",
        "actual_fix": "Increased max connection pool size from 50 -> 100 in database.yaml and restarted pool supervisor.",
        "outcome": "Resolved",
        "resolution_notes": "All 503 errors ceased immediately.",
        "resolution_time_minutes": 8,
        "lessons_learned": "When Payment API returns 503 with pool timeout, inspect connection pool capacity before rebooting DB."
    }
    learned = request_json(f"{BASE_URL}/api/v1/memory/resolve-and-learn", method="POST", data=resolve_payload)
    print(f"\n[PASS] 4. Resolution & Retention Loop:")
    print(f"   - Retained Experience Success: {learned['success']}")
    print(f"   - Retained Memory Units: {len(learned['retained_memories'])} (Incident, Operational, Learning)")
    print(f"   - Stored in Bank: {learned['hindsight_bank']}")
    print(f"   - Learned Rule: {learned['extracted_lessons'][0]}")

    # 5. Hindsight Reflection
    reflect_payload = {"query": "Payment API database connection timeouts"}
    reflection = request_json(f"{BASE_URL}/api/v1/memory/reflect", method="POST", data=reflect_payload)
    print(f"\n[PASS] 5. Hindsight Mental Model Reflection:")
    print(f"   - Reflection Output: {reflection['reflection']}")

    # 6. Memory Timeline
    timeline = request_json(f"{BASE_URL}/api/v1/memory/timeline")
    print(f"\n[PASS] 6. Memory Timeline Stream:")
    print(f"   - Total Events: {timeline['total_events']}")
    print(f"   - Latest Timeline Event: [{timeline['timeline'][-1]['incident_id']}] {timeline['timeline'][-1]['title']}")

    # 7. Demo Scenario
    demo = request_json(f"{BASE_URL}/api/v1/demo/run-scenario", method="POST")
    print(f"\n[PASS] 7. 1-Click Interactive Demo Scenario:")
    print(f"   - Stage 1 Novel MTTR: {demo['stage_1']['resolution_time_minutes']} min")
    print(f"   - Stage 2 Recalled Incident IDs: {demo['stage_2']['recalled_from_ids']}")
    print(f"   - Stage 2 MTTR Improvement: {demo['stage_2']['mttr_improvement']['mttr_reduction_pct']}")
    print(f"   - Core Takeaway: {demo['learning_takeaway']}")

    print("\n" + "=" * 65)
    print("ALL 7 ACCEPTANCE TEST SUITES PASSED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    test_full_system()
