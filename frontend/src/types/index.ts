export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'Active' | 'Investigating' | 'Resolved' | 'Not Resolved';
export type MemoryType = 'Incident' | 'Operational' | 'Learning';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  service: string;
  error_logs: string;
  timestamp: string;
  status: IncidentStatus;
  root_cause?: string;
  fix_applied?: string;
  outcome?: string;
  resolution_time_minutes?: number;
  lessons_learned: string[];
  recalled_from_hindsight: boolean;
  recalled_incident_ids: string[];
}

export interface MemoryItem {
  id: string;
  bank_id: string;
  incident_id?: string;
  memory_type: MemoryType;
  title: string;
  service: string;
  content: string;
  symptoms: string[];
  root_cause?: string;
  fix_applied?: string;
  outcome?: string;
  resolution_time_minutes?: number;
  lesson?: string;
  similarity_score: number;
  created_at: string;
  tags: string[];
}

export interface GenericAnalysis {
  likely_root_cause: string;
  evidence: string[];
  recommended_actions: string[];
  reasoning: string;
  estimated_confidence: number;
  approach_type: string;
}

export interface PastIncidentInfo {
  id: string;
  title: string;
  service?: string;
  symptoms?: string[];
  root_cause: string;
  fix_applied: string;
  outcome: string;
  lesson?: string;
  similarity_score: number;
}

export interface ExperienceAnalysis {
  likely_root_cause: string;
  evidence: string[];
  recommended_actions: string[];
  why_this_recommendation: string;
  relevant_memories: MemoryItem[];
  relevant_past_incidents: PastIncidentInfo[];
  estimated_confidence: number;
  potential_risks: string[];
  approach_type: string;
}

export interface InvestigationResponse {
  incident_id: string;
  service: string;
  severity: string;
  symptoms_detected: string[];
  without_memory: GenericAnalysis;
  with_memory: ExperienceAnalysis;
  hindsight_recalled_count: number;
  key_differentiator: string;
  hindsight_bank_id: string;
  investigated_at: string;
}

export interface DashboardStats {
  active_incidents_count: number;
  resolved_incidents_count: number;
  historical_incidents_count: number;
  memories_stored_count: number;
  similar_incidents_found_count: number;
  avg_resolution_time_minutes: number;
  memory_mttr_avg_minutes: number;
  no_memory_mttr_avg_minutes: number;
  mttr_improvement_pct: number;
  learning_velocity_score: number;
  hindsight_connected: boolean;
  llm_provider: string;
}

export interface TimelineEvent {
  incident_id: string;
  title: string;
  service: string;
  severity: string;
  status: string;
  root_cause?: string;
  fix_applied?: string;
  outcome?: string;
  resolution_time_minutes?: number;
  lessons_learned: string[];
  recalled_from_hindsight: boolean;
  recalled_incident_ids: string[];
  timestamp: string;
}
