import React, { useState } from 'react';
import { 
  Search, 
  Brain, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw,
  CheckCircle,
  Save,
  XCircle,
  RefreshCw,
  Zap,
  Columns
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SeverityLevel, InvestigationResponse } from '../types';
import { investigateIncident, resolveAndLearn } from '../services/api';

interface PresetsType {
  name: string;
  title: string;
  service: string;
  severity: SeverityLevel;
  description: string;
  logs: string;
}

const PRESETS: PresetsType[] = [
  {
    name: '🔥 Payment API 503 (Pool Exhaustion)',
    title: 'Payment API returning 503 errors',
    service: 'Payment API',
    severity: 'Critical',
    description: 'Customers unable to complete checkout. Error rate increased with database connection timeouts.',
    logs: 'connection pool exhausted\nPostgreSQL timeout\nHTTP 503'
  },
  {
    name: '⚡ Kubernetes Pod OOMKilled',
    title: 'Inventory Service Pods CrashLoopBackOff',
    service: 'Inventory Service',
    severity: 'Critical',
    description: 'Catalog and stock sync failing across cluster. Pods terminating with Exit Code 137 under load.',
    logs: 'State: Waiting\n  Reason: CrashLoopBackOff\nLast State: Terminated\n  Reason: OOMKilled\n  Exit Code: 137\nContainer inventory-app exceeded memory limit: 512Mi (used: 518Mi)'
  },
  {
    name: '🔒 Auth JWKS 401 Spike',
    title: 'Authentication Failures After Key Rotation',
    service: 'Auth Service',
    severity: 'High',
    description: 'Downstream microservices rejecting user JWT tokens following scheduled key rotation.',
    logs: 'ERROR [jwt-validator] Invalid signature for token with kid "auth-key-2026-b"\nJWKS cache missing key id "auth-key-2026-b"\nHTTP 401 Unauthorized for gateway traffic'
  },
  {
    name: '🌐 CoreDNS Lookup Timeout',
    title: 'Intermittent DNS Lookup Timeouts in EKS',
    service: 'CoreDNS',
    severity: 'Critical',
    description: 'Internal microservice-to-microservice gRPC calls failing with host lookup timeout.',
    logs: 'ERROR [client] dial tcp: lookup auth-service.prod.svc.cluster.local: i/o timeout\nCoreDNS CPU throttling at 99.8%'
  }
];

interface Props {
  onIncidentResolved: () => void;
}

export const InvestigationConsole: React.FC<Props> = ({ onIncidentResolved }) => {
  const [title, setTitle] = useState<string>('');
  const [service, setService] = useState<string>('');
  const [severity, setSeverity] = useState<SeverityLevel>('Critical');
  const [description, setDescription] = useState<string>('');
  const [errorLogs, setErrorLogs] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [investigationStep, setInvestigationStep] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<InvestigationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'after' | 'before' | 'split'>('after');

  const [resolutionChoice, setResolutionChoice] = useState<'Resolved' | 'Not Resolved' | null>(null);
  const [actualRootCause, setActualRootCause] = useState<string>('');
  const [actualFix, setActualFix] = useState<string>('');
  const [whatFailed, setWhatFailed] = useState<string>('');
  const [resolutionTime, setResolutionTime] = useState<number>(12);
  const [lessonLearned, setLessonLearned] = useState<string>('');
  const [isSavingExperience, setIsSavingExperience] = useState(false);
  const [learnedConfirmation, setLearnedConfirmation] = useState<any | null>(null);
  const [isSimilarIncidentTest, setIsSimilarIncidentTest] = useState(false);

  const applyPreset = (p: PresetsType) => {
    setTitle(p.title);
    setService(p.service);
    setSeverity(p.severity);
    setDescription(p.description);
    setErrorLogs(p.logs);
    setAnalysisResult(null);
    setResolutionChoice(null);
    setLearnedConfirmation(null);
    setIsSimilarIncidentTest(false);
  };

  const handleInvestigate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !service.trim() || !description.trim()) {
      setError('Please provide Incident Title, Affected Service, and Description.');
      return;
    }
    
    setIsLoading(true);
    setInvestigationStep(1);
    setError(null);
    setAnalysisResult(null);
    setResolutionChoice(null);

    const timer1 = setTimeout(() => setInvestigationStep(2), 500);
    const timer2 = setTimeout(() => setInvestigationStep(3), 1100);
    const timer3 = setTimeout(() => setInvestigationStep(4), 1700);

    try {
      const res = await investigateIncident({
        title,
        description,
        severity,
        service,
        error_logs: errorLogs
      });
      
      setAnalysisResult(res);
      setActualRootCause(res.with_memory.likely_root_cause);
      setActualFix(res.with_memory.recommended_actions[0]?.replace(/^\d+\.\s*/, '') || 'Increased pool connections from 50 to 100 in config');
      setLessonLearned(`When ${res.service} encounters '${res.symptoms_detected.slice(0, 2).join(', ')}', inspect connection pool limits before restarting.`);
    } catch (err: any) {
      setError(err.message || 'Investigation failed');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsLoading(false);
      setInvestigationStep(0);
    }
  };

  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisResult) return;
    setIsSavingExperience(true);
    setError(null);

    try {
      const combinedFix = resolutionChoice === 'Resolved' ? actualFix : `Failed attempt: ${whatFailed}. Final Fix: ${actualFix}`;
      const result = await resolveAndLearn({
        incident_id: analysisResult.incident_id,
        actual_root_cause: actualRootCause,
        actual_fix: combinedFix,
        outcome: resolutionChoice || 'Resolved',
        resolution_notes: whatFailed ? `What failed: ${whatFailed}` : 'Remediation applied successfully.',
        resolution_time_minutes: resolutionTime,
        lessons_learned: lessonLearned
      });

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (err) {}

      setLearnedConfirmation({
        ...result,
        incident_title: title,
        service,
        actualRootCause,
        actualFix: combinedFix,
        outcome: resolutionChoice
      });
      setResolutionChoice(null);
      onIncidentResolved();
    } catch (err: any) {
      setError(err.message || 'Failed to save experience to Hindsight');
    } finally {
      setIsSavingExperience(false);
    }
  };

  const handleRunSimilarIncident = () => {
    if (service.toLowerCase().includes('inventory') || (title + description).toLowerCase().includes('oom')) {
      setTitle('Catalog & Stock Worker Pods Crashing with Exit Code 137');
      setService('Inventory Service');
      setSeverity('Critical');
      setDescription('Inventory sync worker pods entering CrashLoopBackOff under catalog import load. Pods terminate unexpectedly.');
      setErrorLogs('State: Waiting\n  Reason: CrashLoopBackOff\nLast State: Terminated\n  Reason: OOMKilled\n  Exit Code: 137\nContainer inventory-worker exceeded memory limit: 512Mi');
    } else if (service.toLowerCase().includes('auth') || (title + description).toLowerCase().includes('jwt')) {
      setTitle('User Authorization Errors After Certificate Rollover');
      setService('Auth Service');
      setSeverity('High');
      setDescription('API Gateway rejecting valid user tokens with HTTP 401 following scheduled certificate refresh.');
      setErrorLogs('ERROR [jwt-validator] Invalid signature for token with kid "auth-key-2026-c"\nJWKS cache missing key id "auth-key-2026-c"\nHTTP 401 Unauthorized');
    } else {
      setTitle('Payment API returning 503 errors — Connection Saturation Spike');
      setService('Payment API');
      setSeverity('Critical');
      setDescription('Payment gateway returning intermittent 503 errors and DB connection timeouts during morning rush.');
      setErrorLogs('connection pool exhausted\nPostgreSQL timeout\nHTTP 503\nUpstream timeout on /v2/charge');
    }
    setAnalysisResult(null);
    setResolutionChoice(null);
    setIsSimilarIncidentTest(true);
    window.scrollTo({ top: 80, behavior: 'smooth' });
  };

  return (
    <div className="animate-fade-in">
      
      {/* 1. QUICK PRESETS BAR */}
      <div className="glass-card mb-4" style={{ padding: '0.85rem 1.25rem', background: '#ffffff', borderColor: '#e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
            <Zap size={16} color="#6366f1" />
            <span>Quick Presets:</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="btn"
                style={{
                  fontSize: '0.76rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  borderColor: title === p.title ? '#6366f1' : '#e2e8f0',
                  background: title === p.title ? '#eef2ff' : '#f8fafc',
                  color: title === p.title ? '#4f46e5' : '#475569',
                  fontWeight: title === p.title ? 700 : 500,
                  border: '1px solid'
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. REPORT INCIDENT CONSOLE */}
      <div 
        className="glass-card mb-5" 
        style={{ 
          padding: '1.4rem 1.6rem', 
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 12px -2px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', background: '#fee2e2', borderRadius: '8px' }}>
              <AlertCircle size={20} color="#dc2626" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Report Production Incident
                </h2>
                {isSimilarIncidentTest && (
                  <span className="badge badge-memory-recalled" style={{ fontSize: '0.68rem' }}>
                    Similar Incident Test
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                Query Hindsight long-term operational memory and reason with Groq LLM.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.73rem', color: '#64748b' }}>
            <Brain size={13} color="#6366f1" />
            <span>Bank: <strong style={{ color: '#4f46e5' }}>incidentiq-ops</strong></span>
          </div>
        </div>

        <form onSubmit={handleInvestigate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem', marginBottom: '0.9rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Incident Title
              </label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Payment API 503 During Peak Traffic"
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Affected Service
              </label>
              <input 
                type="text" 
                value={service} 
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g., Payment API"
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Severity
              </label>
              <select 
                value={severity} 
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              >
                <option value="Critical">🔴 Critical (P1)</option>
                <option value="High">🟠 High (P2)</option>
                <option value="Medium">🟡 Medium (P3)</option>
                <option value="Low">🔵 Low (P4)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '0.9rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
              Incident Description & User Impact
            </label>
            <textarea 
              rows={2}
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Customers unable to complete payments. Checkout service latency spiked."
              required 
            />
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
              Observed Error Logs / Stack Traces
            </label>
            <textarea 
              rows={3}
              className="mono-input"
              value={errorLogs} 
              onChange={(e) => setErrorLogs(e.target.value)}
              placeholder="e.g., HTTP 503 Service Unavailable, connection pool exhausted..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn btn-investigate"
              disabled={isLoading}
              style={{ padding: '0.75rem 1.85rem', fontSize: '0.95rem' }}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Investigating...
                </>
              ) : (
                <>
                  <Search size={16} />
                  INVESTIGATE INCIDENT
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}
      </div>

      {/* 3. INVESTIGATION PROGRESS STEPPER */}
      {isLoading && (
        <div className="glass-card mb-5 animate-fade-in" style={{ padding: '1.25rem 1.5rem', background: '#ffffff', border: '1px solid #c7d2fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4f46e5', margin: 0 }}>
              Investigating Incident...
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.76rem' }}>
            <div style={{ color: investigationStep >= 1 ? '#4f46e5' : '#94a3b8', fontWeight: investigationStep === 1 ? 700 : 500 }}>
              1. Analyzing Telemetry
            </div>
            <div style={{ color: investigationStep >= 2 ? '#7c3aed' : '#94a3b8', fontWeight: investigationStep === 2 ? 700 : 500 }}>
              2. Querying Hindsight
            </div>
            <div style={{ color: investigationStep >= 3 ? '#059669' : '#94a3b8', fontWeight: investigationStep === 3 ? 700 : 500 }}>
              3. Recalling Precedents
            </div>
            <div style={{ color: investigationStep >= 4 ? '#047857' : '#94a3b8', fontWeight: investigationStep === 4 ? 700 : 500 }}>
              4. Groq Reasoning
            </div>
          </div>
        </div>
      )}

      {/* 4. LEARNED CONFIRMATION BANNER */}
      {learnedConfirmation && (
        <div className="glass-card mb-5 animate-fade-in" style={{ padding: '1.25rem 1.5rem', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.4rem', background: '#10b981', borderRadius: '8px' }}>
                <CheckCircle2 size={20} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#065f46', fontWeight: 800, margin: 0 }}>
                    🧠 EXPERIENCE LEARNED
                  </h3>
                  <span className="badge badge-memory-recalled" style={{ fontSize: '0.68rem' }}>Stored in Hindsight</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#047857', margin: '0.2rem 0 0 0' }}>
                  Added verified resolution for <strong>{learnedConfirmation.service}</strong> to memory bank <strong>incidentiq-ops</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={handleRunSimilarIncident}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.82rem', fontWeight: 700 }}
            >
              <RefreshCw size={14} />
              🔄 RUN SIMILAR INCIDENT
            </button>
          </div>
        </div>
      )}

      {/* 5. INVESTIGATION RESULTS */}
      {analysisResult && (
        <div className="animate-fade-in">
          
          {/* RECALLED HINDSIGHT MEMORIES (Compact & Clean) */}
          {analysisResult.with_memory.relevant_past_incidents.length > 0 && (
            <div className="glass-card mb-5" style={{ padding: '1.15rem 1.4rem', borderColor: '#c7d2fe', background: '#f5f3ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Brain size={18} color="#7c3aed" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#4c1d95', margin: 0 }}>
                    Recalled Hindsight Memories ({analysisResult.with_memory.relevant_past_incidents.length})
                  </h3>
                </div>
                <span className="badge badge-hindsight" style={{ fontSize: '0.68rem' }}>
                  bank: {analysisResult.hindsight_bank_id}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {analysisResult.with_memory.relevant_past_incidents.map((mem, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '0.85rem 1rem',
                      background: '#ffffff',
                      border: '1px solid #ddd6fe',
                      borderRadius: '8px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span className="mono" style={{ fontWeight: 800, color: '#4f46e5' }}>{mem.id}</span>
                      <span className="badge badge-resolved" style={{ fontSize: '0.62rem' }}>
                        Match {Math.round((mem.similarity_score || 0.95) * 100)}%
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem' }}>{mem.title}</div>
                    <div style={{ color: '#b91c1c', marginBottom: '0.2rem' }}><strong>Cause:</strong> {mem.root_cause}</div>
                    <div style={{ color: '#047857' }}><strong>Fix:</strong> {mem.fix_applied}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIGNATURE SECTION: 🔄 WHAT CHANGED AFTER THE AGENT LEARNED? */}
          <div 
            className="glass-card mb-5" 
            style={{ 
              padding: '1.4rem 1.6rem', 
              background: '#ffffff', 
              border: '1px solid #c7d2fe',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.08)'
            }}
          >
            {/* Header & Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e1b4b', margin: 0 }}>
                  🔄 WHAT CHANGED AFTER THE AGENT LEARNED?
                </h3>
                <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                  How persistent Hindsight operational memory transforms triage quality.
                </p>
              </div>

              {/* View Toggle */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('before')}
                  className="btn"
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    background: viewMode === 'before' ? '#fee2e2' : 'transparent',
                    color: viewMode === 'before' ? '#b91c1c' : '#64748b',
                    border: viewMode === 'before' ? '1px solid #fca5a5' : '1px solid transparent'
                  }}
                >
                  BEFORE LEARNING
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('after')}
                  className="btn"
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    background: viewMode === 'after' ? '#eef2ff' : 'transparent',
                    color: viewMode === 'after' ? '#4338ca' : '#64748b',
                    border: viewMode === 'after' ? '1px solid #c7d2fe' : '1px solid transparent'
                  }}
                >
                  AFTER LEARNING
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className="btn"
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    background: viewMode === 'split' ? '#f0fdf4' : 'transparent',
                    color: viewMode === 'split' ? '#15803d' : '#64748b',
                    border: viewMode === 'split' ? '1px solid #86efac' : '1px solid transparent'
                  }}
                >
                  <Columns size={13} style={{ marginRight: '0.25rem' }} />
                  SIDE-BY-SIDE
                </button>
              </div>
            </div>

            {/* Quick Explanation */}
            <div style={{ padding: '0.55rem 0.85rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: '#475569' }}>
              <Sparkles size={14} color="#6366f1" />
              <span><strong>How IncidentIQ Learns:</strong> Before learning, the agent reasons from current telemetry alone. After learning, it recalls verified experiences from previous incidents in Hindsight.</span>
            </div>

            {/* View Render */}
            {viewMode === 'before' && (
              <div className="animate-fade-in" style={{ padding: '1rem 1.15rem', background: '#fffafa', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span className="badge badge-critical" style={{ fontSize: '0.68rem' }}>BEFORE LEARNING (Cold Triage)</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#dc2626' }}>
                    Confidence: {analysisResult.without_memory.estimated_confidence}%
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#991b1b' }}>Likely Cause:</strong> {analysisResult.without_memory.likely_root_cause}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>
                  <strong>Recommendation:</strong> {analysisResult.without_memory.recommended_actions.join(' • ')}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic' }}>
                  "{analysisResult.without_memory.reasoning}"
                </div>
              </div>
            )}

            {viewMode === 'after' && (
              <div className="animate-fade-in" style={{ padding: '1rem 1.15rem', background: '#f5f3ff', border: '1px solid #c7d2fe', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span className="badge badge-hindsight" style={{ fontSize: '0.68rem' }}>
                    <Brain size={12} /> AFTER LEARNING (Experience-Driven)
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>
                    Confidence: {analysisResult.with_memory.estimated_confidence}%
                  </span>
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#4f46e5' }}>Pinpointed Cause:</strong> {analysisResult.with_memory.likely_root_cause}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' }}>
                  {analysisResult.with_memory.recommended_actions.map((act, i) => (
                    <div key={i} style={{ fontSize: '0.82rem', color: '#064e3b', background: '#ecfdf5', padding: '0.45rem 0.65rem', borderRadius: '5px', border: '1px solid #a7f3d0' }}>
                      {act}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#475569', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #ddd6fe' }}>
                  <strong style={{ color: '#7c3aed' }}>Why It Improved:</strong> {analysisResult.with_memory.why_this_recommendation}
                </div>
              </div>
            )}

            {viewMode === 'split' && (
              <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                {/* Cold Analysis */}
                <div style={{ padding: '1rem', background: '#fffafa', border: '1px solid #fecaca', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>BEFORE LEARNING</span>
                    <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.85rem' }}>{analysisResult.without_memory.estimated_confidence}%</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', marginBottom: '0.4rem', color: '#0f172a' }}>
                    <strong>Cause:</strong> {analysisResult.without_memory.likely_root_cause}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#475569' }}>
                    <strong>Actions:</strong> {analysisResult.without_memory.recommended_actions.join('; ')}
                  </div>
                </div>

                {/* Experienced Analysis */}
                <div style={{ padding: '1rem', background: '#f5f3ff', border: '1px solid #c7d2fe', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="badge badge-hindsight" style={{ fontSize: '0.65rem' }}>AFTER LEARNING</span>
                    <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.85rem' }}>{analysisResult.with_memory.estimated_confidence}%</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: '#0f172a' }}>
                    <strong>Cause:</strong> {analysisResult.with_memory.likely_root_cause}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#064e3b' }}>
                    <strong>Target Fix:</strong> {analysisResult.with_memory.recommended_actions[0]}
                  </div>
                </div>
              </div>
            )}

            {/* WHAT CHANGED METRICS GRID */}
            <div style={{ paddingTop: '0.85rem', borderTop: '1px dashed #e2e8f0' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.65rem' }}>
                📊 WHAT CHANGED?
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
                <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.74rem' }}>
                  <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '0.2rem' }}>Root-Cause Specificity</div>
                  <div style={{ color: '#059669', fontWeight: 600 }}>Pinpointed exact resource bottleneck ↑</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.74rem' }}>
                  <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '0.2rem' }}>Evidence Sources</div>
                  <div style={{ color: '#059669', fontWeight: 600 }}>Telemetry + {analysisResult.with_memory.relevant_past_incidents.length} Hindsight memories ↑</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.74rem' }}>
                  <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '0.2rem' }}>Relevant Experiences</div>
                  <div style={{ color: '#059669', fontWeight: 600 }}>{analysisResult.with_memory.relevant_past_incidents.length} verified past incidents ↑</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.74rem' }}>
                  <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '0.2rem' }}>AI Confidence</div>
                  <div style={{ color: '#059669', fontWeight: 600 }}>{analysisResult.without_memory.estimated_confidence}% ➔ {analysisResult.with_memory.estimated_confidence}% ↑</div>
                </div>
              </div>
            </div>

          </div>

          {/* 6. USER RESOLUTION & TEACH HINDSIGHT */}
          <div 
            className="glass-card mb-6" 
            style={{ 
              padding: '1.4rem 1.6rem', 
              borderColor: '#a7f3d0',
              background: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: resolutionChoice ? '1rem' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="#059669" />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Did this recommendation resolve the incident?
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    Record verified outcome to teach Hindsight long-term memory.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setResolutionChoice('Resolved')}
                  className={`btn ${resolutionChoice === 'Resolved' ? 'btn-success' : 'btn-outline'}`}
                  style={{ padding: '0.5rem 1.15rem', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <CheckCircle2 size={14} /> RESOLVED
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionChoice('Not Resolved')}
                  className={`btn ${resolutionChoice === 'Not Resolved' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.5rem 1.15rem', fontSize: '0.82rem', fontWeight: 700, background: resolutionChoice === 'Not Resolved' ? '#dc2626' : undefined }}
                >
                  <XCircle size={14} /> NOT RESOLVED
                </button>
              </div>
            </div>

            {resolutionChoice && (
              <form onSubmit={handleSaveExperience} className="animate-fade-in" style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                      Actual Root Cause
                    </label>
                    <input 
                      type="text" 
                      value={actualRootCause}
                      onChange={(e) => setActualRootCause(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                      Actual Fix Applied
                    </label>
                    <input 
                      type="text" 
                      value={actualFix}
                      onChange={(e) => setActualFix(e.target.value)}
                      required
                    />
                  </div>

                  {resolutionChoice === 'Not Resolved' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.25rem' }}>
                        What Failed?
                      </label>
                      <input 
                        type="text" 
                        value={whatFailed}
                        onChange={(e) => setWhatFailed(e.target.value)}
                        placeholder="e.g., Restarting pods failed."
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                        Resolution Time (Minutes)
                      </label>
                      <input 
                        type="number" 
                        min={1} 
                        value={resolutionTime}
                        onChange={(e) => setResolutionTime(parseInt(e.target.value) || 10)}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.25rem' }}>
                    Lesson Learned (Stored as SRE rule in Hindsight)
                  </label>
                  <textarea 
                    rows={2}
                    value={lessonLearned}
                    onChange={(e) => setLessonLearned(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={isSavingExperience}
                    style={{ padding: '0.7rem 1.6rem', fontSize: '0.9rem', fontWeight: 800 }}
                  >
                    {isSavingExperience ? (
                      <>
                        <div className="spinner" style={{ borderTopColor: '#ffffff' }}></div>
                        Retaining to Hindsight...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        SAVE EXPERIENCE TO HINDSIGHT
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
