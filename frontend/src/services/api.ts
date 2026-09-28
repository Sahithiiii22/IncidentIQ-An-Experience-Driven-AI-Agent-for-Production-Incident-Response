import {
  Incident,
  InvestigationResponse,
  DashboardStats,
  MemoryItem,
  TimelineEvent,
  SeverityLevel
} from '../types';

const API_BASE = '/api/v1';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/incidents/stats/summary`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/incidents`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function createIncident(data: {
  title: string;
  description: string;
  severity: SeverityLevel;
  service: string;
  error_logs: string;
}): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create incident');
  return res.json();
}

export async function investigateIncident(data: {
  title: string;
  description: string;
  severity: SeverityLevel;
  service: string;
  error_logs: string;
}): Promise<InvestigationResponse> {
  const res = await fetch(`${API_BASE}/investigation/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to investigate incident');
  return res.json();
}

export async function resolveAndLearn(data: {
  incident_id: string;
  actual_root_cause: string;
  actual_fix: string;
  outcome: string;
  resolution_notes?: string;
  resolution_time_minutes?: number;
  lessons_learned?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/memory/resolve-and-learn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to resolve and retain experience');
  return res.json();
}

export async function fetchBankMemories(): Promise<MemoryItem[]> {
  const res = await fetch(`${API_BASE}/memory/bank/memories`);
  if (!res.ok) throw new Error('Failed to fetch Hindsight memories');
  return res.json();
}

export async function queryRecall(query: string, service?: string): Promise<MemoryItem[]> {
  const res = await fetch(`${API_BASE}/memory/recall`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, service, top_k: 5 })
  });
  if (!res.ok) throw new Error('Failed to recall from Hindsight');
  return res.json();
}

export async function queryReflect(query: string): Promise<{ query: string; reflection: string; bank_id: string }> {
  const res = await fetch(`${API_BASE}/memory/reflect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Failed to reflect on operational mental model');
  return res.json();
}

export async function fetchMemoryTimeline(): Promise<{ bank_id: string; total_events: number; timeline: TimelineEvent[] }> {
  const res = await fetch(`${API_BASE}/memory/timeline`);
  if (!res.ok) throw new Error('Failed to fetch memory timeline');
  return res.json();
}

export async function runDemoScenario(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/run-scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to run demo scenario');
  return res.json();
}
