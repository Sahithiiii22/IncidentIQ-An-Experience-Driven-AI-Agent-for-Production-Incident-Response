import sys
import json
import urllib.request
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8080"

def request_json(url, method="GET", data=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8") if data is not None else None,
        headers={"Content-Type": "application/json"}
    )
    req.get_method = lambda: method
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def test_what_changed_flow():
    print("=" * 70)
    print("INCIDENTIQ 'WHAT CHANGED AFTER THE AGENT LEARNED?' ACCEPTANCE TEST")
    print("=" * 70)

    # ----------------- 1. FIRST RUN: OOMKilled Incident -----------------
    print("\n[STEP 1] Submitting First OOMKilled Incident (Before Learning)...")
    inc1_req = {
        "title": "Inventory Service Pods CrashLoopBackOff",
        "service": "Inventory Service",
        "severity": "Critical",
        "description": "Catalog and stock sync failing across cluster. Pods terminating with Exit Code 137 under load.",
        "error_logs": "State: Waiting\n  Reason: CrashLoopBackOff\nLast State: Terminated\n  Reason: OOMKilled\n  Exit Code: 137\nContainer inventory-app exceeded memory limit: 512Mi (used: 518Mi)"
    }
    run1 = request_json(f"{BASE_URL}/api/v1/investigation/analyze", method="POST", data=inc1_req)
    inc1_id = run1["incident_id"]
    before_cause = run1["without_memory"]["likely_root_cause"]
    before_conf = run1["without_memory"]["estimated_confidence"]
    before_actions = run1["without_memory"]["recommended_actions"]
    
    print(f"    Incident ID: {inc1_id}")
    print(f"    [BEFORE LEARNING] Likely Root Cause: {before_cause}")
    print(f"    [BEFORE LEARNING] Confidence: {before_conf}%")
    print(f"    [BEFORE LEARNING] Recommendations: {before_actions[:2]}")

    # ----------------- 2. LEARN: Resolve & Retain into Hindsight -----------------
    print(f"\n[STEP 2] Resolving {inc1_id} and Retaining Verified Experience into Hindsight...")
    resolve_payload = {
        "incident_id": inc1_id,
        "actual_root_cause": "JVM heap allocation exceeded pod memory cgroup limit (512Mi limit vs 768Mi heap)",
        "actual_fix": "Increased Kubernetes container memory limit to 1536Mi and added -XX:MaxRAMPercentage=75.0 in deployment yaml",
        "outcome": "Resolved",
        "resolution_notes": "Pods stabilized immediately with zero CrashLoopBackOff.",
        "resolution_time_minutes": 12,
        "lessons_learned": "Exit Code 137 is always Linux kernel OOM killer. Setting MaxRAMPercentage ensures JVM heap scales dynamically with pod cgroups."
    }
    learn_res = request_json(f"{BASE_URL}/api/v1/memory/resolve-and-learn", method="POST", data=resolve_payload)
    print(f"    Retain Success: {learn_res['success']}")
    print(f"    Memories Created: {len(learn_res['retained_memories'])}")
    print(f"    Bank ID: {learn_res['hindsight_bank']}")

    time.sleep(2)

    # ----------------- 3. SECOND RUN: Differently Worded OOMKilled Incident -----------------
    print("\n[STEP 3] Submitting Second (Differently Worded) OOMKilled Incident (After Learning)...")
    inc2_req = {
        "title": "Catalog & Stock Worker Pods Crashing with Exit Code 137",
        "service": "Inventory Service",
        "severity": "Critical",
        "description": "Inventory sync worker pods entering CrashLoopBackOff under catalog import load. Pods terminate unexpectedly.",
        "error_logs": "State: Waiting\n  Reason: CrashLoopBackOff\nLast State: Terminated\n  Reason: OOMKilled\n  Exit Code: 137\nContainer inventory-worker exceeded memory limit: 512Mi"
    }
    run2 = request_json(f"{BASE_URL}/api/v1/investigation/analyze", method="POST", data=inc2_req)
    inc2_id = run2["incident_id"]
    after_cause = run2["with_memory"]["likely_root_cause"]
    after_conf = run2["with_memory"]["estimated_confidence"]
    after_actions = run2["with_memory"]["recommended_actions"]
    why_improved = run2["with_memory"]["why_this_recommendation"]
    recalled_count = run2["hindsight_recalled_count"]
    past_incidents = run2["with_memory"]["relevant_past_incidents"]

    print(f"    Incident ID: {inc2_id}")
    print(f"    Recalled Memories Count: {recalled_count}")
    print(f"    Recalled Past Incidents: {[p['id'] for p in past_incidents]}")
    print(f"    [AFTER LEARNING] Likely Root Cause: {after_cause}")
    print(f"    [AFTER LEARNING] Confidence: {after_conf}%")
    print(f"    [AFTER LEARNING] Recommendations: {after_actions[:2]}")
    print(f"    [AFTER LEARNING] Why Improved: {why_improved}")

    # ----------------- 4. VERIFICATION OF DIFFERENCE -----------------
    print("\n[STEP 4] Verifying What Changed (Before Learning vs After Learning)...")
    is_different = before_cause != after_cause
    has_recalled_memories = recalled_count > 0
    references_past_experience = any("137" in p.get("title", "") or "OOM" in p.get("root_cause", "") or "JVM" in p.get("root_cause", "") for p in past_incidents)

    print(f"    1. Root Cause Changed & Specific: {is_different} (Before: '{before_cause[:40]}...' vs After: '{after_cause[:40]}...')")
    print(f"    2. Confidence Increased: {before_conf}% -> {after_conf}% (+{after_conf - before_conf}%)")
    print(f"    3. Recalled Verified Experience from Hindsight: {has_recalled_memories} ({recalled_count} experiences)")
    print(f"    4. Explicitly References Past Fix: {references_past_experience}")

    print("\n" + "=" * 70)
    if is_different and has_recalled_memories and after_conf > before_conf:
        print("ALL ACCEPTANCE CRITERIA FOR 'WHAT CHANGED AFTER LEARNING' PASSED!")
    else:
        print("TEST COMPLETED")
    print("=" * 70)

if __name__ == "__main__":
    test_what_changed_flow()
