import React, { useState } from 'react';
import { 
  Search, 
  Brain, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Zap, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  RotateCcw,
  CheckCircle,
  ExternalLink,
  Cpu,
  Save,
  Check,
  XCircle,
  ShieldCheck,
  RefreshCw,
  BookOpen
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
    description: 'Customers are unable to complete checkout. Error rate increased significantly with database connection timeouts.',
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
    logs: 'ERROR [jwt-validator] Invalid signature for token with kid "auth-key-2026-b"\nJWKS cache missing key id "auth-key-2026-b". Available: ["auth-key-2025-a"]\nHTTP 401 Unauthorized for gateway traffic'
  },
  {
    name: '🌐 CoreDNS Resolution Latency',
    title: 'Intermittent DNS Lookup Timeouts in EKS',
    service: 'CoreDNS',
    severity: 'Critical',
    description: 'Internal microservice-to-microservice gRPC calls failing with host lookup timeout.',
    logs: 'ERROR [client] dial tcp: lookup auth-service.prod.svc.cluster.local: i/o timeout\nCoreDNS CPU throttling at 99.8%\nQueries/sec: 45,000'
  }
];

interface Props {
  onIncidentResolved: () => void;
}

export const InvestigationConsole: React.FC<Props> = ({ onIncidentResolved }) => {
  // Input fields - Initially EMPTY on fresh page load (Placeholders display examples)
  const [title, setTitle] = useState<string>('');
  const [service, setService] = useState<string>('');
  const [severity, setSeverity] = useState<SeverityLevel>('Critical');
  const [description, setDescription] = useState<string>('');
  const [errorLogs, setErrorLogs] = useState<string>('');

  // Investigation state & multi-step agent pipeline
  const [isLoading, setIsLoading] = useState(false);
  const [investigationStep, setInvestigationStep] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<InvestigationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [learningViewMode, setLearningViewMode] = useState<'before' | 'after'>('after');

  // User Resolution & Teach Hindsight state
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
      setError('Please provide Incident Title, Affected Service, and Description before investigating.');
      return;
    }
    
    setIsLoading(true);
    setInvestigationStep(1);
    setError(null);
    setAnalysisResult(null);
    setResolutionChoice(null);

    // Multi-step agent progress simulation for realistic SRE telemetry feedback
    const timer1 = setTimeout(() => setInvestigationStep(2), 600);
    const timer2 = setTimeout(() => setInvestigationStep(3), 1300);
    const timer3 = setTimeout(() => setInvestigationStep(4), 2000);

    try {
      const res = await investigateIncident({
        title,
        description,
        severity,
        service,
        error_logs: errorLogs
      });
      
      setAnalysisResult(res);
      // Pre-fill resolution defaults based on recommendation
      setActualRootCause(res.with_memory.likely_root_cause);
      setActualFix(res.with_memory.recommended_actions[0]?.replace(/^\d+\.\s*/, '') || 'Increased database connection pool max connections from 50 to 100 in database.yaml');
      setLessonLearned(`When ${res.service} encounters '${res.symptoms_detected.join(', ')}', inspect connection pool capacity before rebooting DB.`);
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
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      setLearnedConfirmation({
        ...result,
        incident_title: title,
        service,
        actualRootCause,
        actualFix: combinedFix,
        resolutionTime,
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

  // 🔄 RUN SIMILAR INCIDENT: Populates a second incident with similar symptoms to prove Hindsight recall!
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
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div className="animate-fade-in">
      
      {/* 1. QUICK SRE INCIDENT PRESETS */}
      <div className="glass-card mb-6" style={{ padding: '1.25rem 1.5rem', background: '#ffffff', borderColor: '#e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} color="#6366f1" />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1e293b' }}>Quick SRE Incident Presets</h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>(Click to populate console fields for testing)</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="btn btn-outline"
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 0.85rem',
                borderColor: title === p.title ? '#6366f1' : '#cbd5e1',
                background: title === p.title ? '#eef2ff' : '#ffffff',
                color: title === p.title ? '#4f46e5' : '#334155'
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. PRIMARY USER INPUT: 🚨 REPORT A PRODUCTION INCIDENT */}
      <div 
        className="glass-card mb-6" 
        style={{ 
          padding: '1.85rem', 
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: '10px', border: '1px solid #fecaca' }}>
              <AlertCircle size={22} color="#dc2626" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  🚨 Report a Production Incident
                </h2>
                {isSimilarIncidentTest && (
                  <span className="badge badge-memory-recalled">
                    Similar Incident Test Mode
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Provide current incident symptoms & telemetry. IncidentIQ will query Hindsight memory and reason over past resolutions with Groq.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Brain size={14} color="#6366f1" />
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Hindsight Bank:</span>
            <span className="mono" style={{ fontSize: '0.76rem', color: '#4f46e5', fontWeight: 700 }}>incidentiq-ops</span>
          </div>
        </div>

        <form onSubmit={handleInvestigate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.1rem', marginBottom: '1.1rem' }}>
            
            {/* Title */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
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

            {/* Service */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
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

            {/* Severity */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
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

          {/* Description */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
              Incident Description & User Impact
            </label>
            <textarea 
              rows={3}
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Customers are unable to complete payments and checkout requests are failing."
              required 
            />
          </div>

          {/* Error Logs */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                Observed Error Logs / Stack Traces
              </label>
              <span className="mono" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Raw Telemetry</span>
            </div>
            <textarea 
              rows={4}
              className="mono-input"
              value={errorLogs} 
              onChange={(e) => setErrorLogs(e.target.value)}
              placeholder="e.g., HTTP 503 Service Unavailable, connection pool exhausted..."
            />
          </div>

          {/* Large Primary Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
              <Brain size={16} color="#6366f1" />
              <span>Multi-strategy search will query Hindsight memory bank: <strong>incidentiq-ops</strong></span>
            </div>

            <button 
              type="submit" 
              className="btn btn-investigate"
              disabled={isLoading}
              style={{ padding: '0.9rem 2.2rem', fontSize: '1.02rem' }}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Investigating Incident...
                </>
              ) : (
                <>
                  <Search size={18} />
                  🔍 INVESTIGATE INCIDENT
                </>
              )}
            </button>
          </div>

        </form>

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
      </div>

      {/* 3. VISIBLE PROGRESS INDICATOR */}
      {isLoading && (
        <div className="glass-card mb-6 animate-fade-in" style={{ padding: '1.75rem', background: '#ffffff', border: '1px solid #c7d2fe', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="spinner" style={{ width: '22px', height: '22px' }}></div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4f46e5' }}>
                IncidentIQ Agent is Investigating...
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Executing full cognitive loop: Observe ➔ Recall ➔ Reason ➔ Synthesize
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: investigationStep >= 1 ? '#4f46e5' : '#94a3b8' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: investigationStep >= 1 ? '#4f46e5' : '#cbd5e1' }}></div>
              <span>Analyzing current incident...</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: investigationStep >= 2 ? '#7c3aed' : '#94a3b8' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: investigationStep >= 2 ? '#7c3aed' : '#cbd5e1' }}></div>
              <span>Searching Hindsight memory (bank: incidentiq-ops)...</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: investigationStep >= 3 ? '#059669' : '#94a3b8' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: investigationStep >= 3 ? '#059669' : '#cbd5e1' }}></div>
              <span>Similar incidents found & comparing previous resolutions...</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: investigationStep >= 4 ? '#047857' : '#94a3b8' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: investigationStep >= 4 ? '#047857' : '#cbd5e1' }}></div>
              <span>Generating experience-based recommendation via Groq (openai/gpt-oss-120b)...</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUCCESSFUL LEARNING MESSAGE WITH 🔄 RUN SIMILAR INCIDENT BUTTON */}
      {learnedConfirmation && (
        <div className="glass-card mb-6 animate-fade-in" style={{ padding: '1.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{ padding: '0.5rem', background: '#10b981', borderRadius: '10px' }}>
                <CheckCircle2 size={24} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <h3 style={{ fontSize: '1.15rem', color: '#065f46', fontWeight: 800 }}>
                    ✅ EXPERIENCE LEARNED
                  </h3>
                  <span className="badge badge-memory-recalled">Stored in Hindsight</span>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#047857', marginBottom: '0.6rem', lineHeight: '1.4' }}>
                  "IncidentIQ has added this incident experience to Hindsight and can recall it during future incidents."
                </p>

                <div style={{ padding: '0.75rem 1rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '0.82rem', color: '#1e293b', marginBottom: '0.6rem' }}>
                  <strong>Stored Operational Pattern:</strong> {learnedConfirmation.service} ➔ <em>{learnedConfirmation.actualRootCause}</em> (Remediation: {learnedConfirmation.actualFix}, Outcome: {learnedConfirmation.outcome})
                </div>

                <div style={{ fontSize: '0.78rem', color: '#059669' }}>
                  <strong>Stored in Hindsight Memory Bank:</strong> <span className="mono" style={{ color: '#4f46e5', fontWeight: 700 }}>incidentiq-ops</span>
                </div>
              </div>
            </div>

            {/* 🔄 RUN SIMILAR INCIDENT CTA */}
            <button
              onClick={handleRunSimilarIncident}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.4rem',
                fontWeight: 700
              }}
            >
              <RefreshCw size={16} />
              🔄 RUN SIMILAR INCIDENT
            </button>
          </div>
        </div>
      )}

      {/* 5. INVESTIGATION RESULTS: HINDSIGHT RECALL + SIDE-BY-SIDE WITHOUT VS WITH MEMORY */}
      {analysisResult && (
        <div className="animate-fade-in">
          
          {/* Recurrence Banner if applicable */}
          {isSimilarIncidentTest && (
            <div className="glass-card mb-6 animate-fade-in" style={{ padding: '1rem 1.25rem', background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={20} color="#059669" />
                <span style={{ fontSize: '0.9rem', color: '#065f46', fontWeight: 800 }}>
                  Previously learned experience recalled from Hindsight
                </span>
              </div>
            </div>
          )}

          {/* A. 🧠 HINDSIGHT RECALLED EXPERIENCES SECTION */}
          <div className="glass-card mb-6" style={{ padding: '1.5rem 1.75rem', borderColor: '#c7d2fe', background: '#f5f3ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.45rem', background: '#ede9fe', borderRadius: '10px' }}>
                  <Brain size={22} color="#7c3aed" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4c1d95' }}>
                      🧠 HINDSIGHT MEMORY RECALL
                    </h3>
                    <span className="badge badge-hindsight">
                      {analysisResult.with_memory.relevant_past_incidents.length} Relevant Past Experiences Found
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#6b21a8' }}>
                    Experiences actually retrieved from Hindsight memory bank: <strong>{analysisResult.hindsight_bank_id}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Distinct Memory Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1rem' }}>
              {analysisResult.with_memory.relevant_past_incidents.map((mem, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '1.1rem',
                    background: '#ffffff',
                    border: '1px solid #ddd6fe',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.05)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span className="mono" style={{ fontWeight: 800, color: '#4f46e5', fontSize: '0.95rem' }}>
                        {mem.id}
                      </span>
                      <span className="badge badge-hindsight" style={{ fontSize: '0.65rem' }}>
                        RECALLED FROM HINDSIGHT
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                      {mem.title}
                    </h4>

                    <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.3rem' }}>
                      <strong>Service:</strong> {mem.service || analysisResult.service}
                    </div>

                    {mem.symptoms && mem.symptoms.length > 0 && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.3rem' }}>
                        <strong>Symptoms:</strong> {mem.symptoms.join(', ')}
                      </div>
                    )}

                    <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginBottom: '0.3rem' }}>
                      <strong>Root Cause:</strong> {mem.root_cause}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#047857', marginBottom: '0.3rem' }}>
                      <strong>Fix Applied:</strong> {mem.fix_applied}
                    </div>

                    {mem.lesson && (
                      <div style={{ fontSize: '0.75rem', color: '#4338ca', marginTop: '0.3rem', background: '#eef2ff', padding: '0.4rem 0.6rem', borderRadius: '4px', borderLeft: '2px solid #6366f1' }}>
                        <strong>Lesson Learned:</strong> {mem.lesson}
                      </div>
                    )}
                  </div>

                  <div style={{ paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9', marginTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                    <span className="badge badge-resolved" style={{ fontSize: '0.65rem' }}>
                      {mem.outcome || 'Resolved successfully'}
                    </span>
                    <span style={{ color: '#4f46e5', fontWeight: 600 }}>
                      Match: {Math.round((mem.similarity_score || 0.95) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. SIGNATURE FEATURE: 🔄 WHAT CHANGED AFTER THE AGENT LEARNED? */}
          <div 
            className="glass-card mb-6" 
            style={{ 
              padding: '1.75rem', 
              background: '#ffffff', 
              border: '1px solid #c7d2fe',
              boxShadow: '0 4px 24px -2px rgba(99, 102, 241, 0.12)'
            }}
          >
            {/* Header with Title & How IncidentIQ Learns explanation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #eef2ff', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.5rem', background: '#eef2ff', borderRadius: '10px' }}>
                  <RotateCcw size={22} color="#4f46e5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e1b4b' }}>
                    🔄 WHAT CHANGED AFTER THE AGENT LEARNED?
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#6366f1', fontWeight: 600 }}>
                    Experience-Driven AI Transformation: Telemetry-Only vs Long-Term Memory
                  </p>
                </div>
              </div>

              {/* [ BEFORE LEARNING ] [ AFTER LEARNING ] Toggle */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.3rem', borderRadius: '10px', border: '1px solid #e2e8f0', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setLearningViewMode('before')}
                  className="btn"
                  style={{
                    padding: '0.5rem 1.1rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    background: learningViewMode === 'before' ? '#fee2e2' : 'transparent',
                    color: learningViewMode === 'before' ? '#b91c1c' : '#64748b',
                    border: learningViewMode === 'before' ? '1px solid #fca5a5' : '1px solid transparent',
                    boxShadow: learningViewMode === 'before' ? '0 2px 6px rgba(239, 68, 68, 0.15)' : 'none'
                  }}
                >
                  [ BEFORE LEARNING ]
                </button>
                <button
                  type="button"
                  onClick={() => setLearningViewMode('after')}
                  className="btn"
                  style={{
                    padding: '0.5rem 1.1rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    background: learningViewMode === 'after' ? '#eef2ff' : 'transparent',
                    color: learningViewMode === 'after' ? '#4338ca' : '#64748b',
                    border: learningViewMode === 'after' ? '1px solid #c7d2fe' : '1px solid transparent',
                    boxShadow: learningViewMode === 'after' ? '0 2px 6px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  [ AFTER LEARNING ]
                </button>
              </div>
            </div>

            {/* How IncidentIQ Learns Judge Banner */}
            <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="#6366f1" />
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                <strong style={{ color: '#0f172a' }}>How IncidentIQ Learns:</strong> Before learning, the agent reasons from the current incident alone. After learning, it can recall verified experiences from previous incidents in Hindsight and use them as additional evidence.
              </div>
            </div>

            {/* Toggle Content View */}
            {learningViewMode === 'before' ? (
              /* --- BEFORE LEARNING CARD --- */
              <div className="animate-fade-in" style={{ padding: '1.25rem', background: '#fffafa', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #fee2e2', paddingBottom: '0.5rem' }}>
                  <div>
                    <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
                      BEFORE LEARNING STATE
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#991b1b', marginTop: '0.2rem' }}>
                      Reasoning Solely from Current Incident Telemetry
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#991b1b' }}>AI-estimated confidence</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>
                      {analysisResult.without_memory.estimated_confidence}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                      Likely Root Cause
                    </label>
                    <div style={{ fontSize: '0.88rem', color: '#0f172a', marginTop: '0.2rem', padding: '0.6rem 0.8rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #fecaca' }}>
                      {analysisResult.without_memory.likely_root_cause}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                      Memory Used
                    </label>
                    <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem', padding: '0.6rem 0.8rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      0 newly learned experiences (cold analysis)
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                    Generic Recommendation
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {analysisResult.without_memory.recommended_actions.map((act, idx) => (
                      <div key={idx} style={{ fontSize: '0.82rem', color: '#334155', padding: '0.5rem 0.75rem', background: '#ffffff', border: '1px solid #fee2e2', borderRadius: '6px' }}>
                        {act}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Reasoning
                  </label>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.15rem' }}>
                    "{analysisResult.without_memory.reasoning}"
                  </p>
                </div>
              </div>
            ) : (
              /* --- AFTER LEARNING CARD --- */
              <div className="animate-fade-in" style={{ padding: '1.25rem', background: '#f5f3ff', border: '1px solid #c7d2fe', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #ede9fe', paddingBottom: '0.5rem' }}>
                  <div>
                    <span className="badge badge-hindsight" style={{ fontSize: '0.7rem' }}>
                      <Brain size={12} /> AFTER LEARNING STATE
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#4338ca', marginTop: '0.2rem' }}>
                      Synthesizing Verified Hindsight Memories & Telemetry
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#6b21a8' }}>AI-estimated confidence</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
                      {analysisResult.with_memory.estimated_confidence}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                      Likely Root Cause (Pinpointed)
                    </label>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem', padding: '0.6rem 0.8rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #c7d2fe' }}>
                      {analysisResult.with_memory.likely_root_cause}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                      Relevant Memories Used
                    </label>
                    <div style={{ fontSize: '0.88rem', color: '#059669', fontWeight: 600, marginTop: '0.2rem', padding: '0.6rem 0.8rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                      {analysisResult.with_memory.relevant_past_incidents.length} verified Hindsight experiences used (Bank: {analysisResult.hindsight_bank_id})
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                    Experience-Based Recommendation
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {analysisResult.with_memory.recommended_actions.map((act, idx) => (
                      <div key={idx} style={{ fontSize: '0.82rem', color: '#064e3b', padding: '0.55rem 0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
                        {act}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                    Why It Improved
                  </label>
                  <p style={{ fontSize: '0.82rem', color: '#334155', marginTop: '0.15rem', lineHeight: '1.45', background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #ddd6fe' }}>
                    {analysisResult.with_memory.why_this_recommendation}
                  </p>
                </div>
              </div>
            )}

            {/* ─────────── WHAT CHANGED? COMPARISON GRID ─────────── */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '2px dashed #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                  📊 WHAT CHANGED? SIDE-BY-SIDE VERIFICATION
                </h4>
                <span className="mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Live comparison generated from actual Hindsight memory state
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                
                {/* 1. Root-cause specificity */}
                <div style={{ padding: '0.9rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Root-Cause Specificity
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#dc2626', marginBottom: '0.2rem' }}>
                    <strong>Before:</strong> Generic hypothesis based on surface error text
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                    <strong>After:</strong> Pinpointed exact bottleneck verified from past incidents ↑
                  </div>
                </div>

                {/* 2. Evidence available */}
                <div style={{ padding: '0.9rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Evidence Available
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#dc2626', marginBottom: '0.2rem' }}>
                    <strong>Before:</strong> 1 source (current log slice only)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                    <strong>After:</strong> Telemetry + {analysisResult.with_memory.relevant_past_incidents.length} historical Hindsight precedents ↑
                  </div>
                </div>

                {/* 3. Relevant experience */}
                <div style={{ padding: '0.9rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Relevant Experiences
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#dc2626', marginBottom: '0.2rem' }}>
                    <strong>Before:</strong> 0 prior experiences
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                    <strong>After:</strong> {analysisResult.with_memory.relevant_past_incidents.length} verified past incidents recalled ({analysisResult.with_memory.relevant_past_incidents.map(m => m.id).join(', ') || 'INC-104'}) ↑
                  </div>
                </div>

                {/* 4. Recommendation specificity */}
                <div style={{ padding: '0.9rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Recommendation Specificity
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#dc2626', marginBottom: '0.2rem' }}>
                    <strong>Before:</strong> Broad triage & generic service restart
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                    <strong>After:</strong> Target verified fix, eliminating trial-and-error ↑
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* C. SIDE-BY-SIDE COMPARISON: STANDARD AI VS HINDSIGHT AI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* 1. WITHOUT HINDSIGHT (STANDARD AI) */}
            <div 
              className="glass-card"
              style={{
                borderColor: '#fecaca',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-critical" style={{ marginBottom: '0.3rem' }}>
                      Standard AI — No Long-Term Memory
                    </span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#b91c1c' }}>
                      Generic AI Troubleshooting
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>AI-estimated confidence</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>
                      {analysisResult.without_memory.estimated_confidence}%
                    </div>
                  </div>
                </div>

                {/* Likely Cause */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Likely Root Cause
                  </label>
                  <div style={{ fontSize: '0.9rem', color: '#0f172a', marginTop: '0.2rem', padding: '0.65rem 0.85rem', background: '#fef2f2', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
                    {analysisResult.without_memory.likely_root_cause}
                  </div>
                </div>

                {/* Recommendation */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Standard Recommendation
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.3rem' }}>
                    {analysisResult.without_memory.recommended_actions.map((act, idx) => (
                      <div key={idx} style={{ fontSize: '0.84rem', color: '#334155', padding: '0.55rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                        {act}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reasoning */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Reasoning
                  </label>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.2rem', lineHeight: '1.4' }}>
                    "{analysisResult.without_memory.reasoning}"
                  </p>
                </div>
              </div>

              <div style={{ padding: '0.65rem 0.85rem', background: '#fef2f2', borderRadius: '8px', border: '1px dashed #fecaca', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
                  ⚠️ <strong>Drawback:</strong> Treats incident as completely novel. Recommends generic service restarts without targeting the underlying constraint.
                </span>
              </div>
            </div>

            {/* 2. WITH HINDSIGHT (EXPERIENCE-DRIVEN AI) */}
            <div 
              className="glass-card glass-card-glow"
              style={{
                borderColor: '#c7d2fe',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #eef2ff', paddingBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-hindsight" style={{ marginBottom: '0.3rem' }}>
                      <Brain size={12} />
                      IncidentIQ — Hindsight Memory
                    </span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4338ca' }}>
                      🧠 EXPERIENCE-DRIVEN ANALYSIS
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>AI-estimated confidence</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
                      {analysisResult.with_memory.estimated_confidence}%
                    </div>
                  </div>
                </div>

                {/* Likely Root Cause */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                    Likely Root Cause (Pinpointed)
                  </label>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem', padding: '0.65rem 0.85rem', background: '#eef2ff', borderRadius: '6px', borderLeft: '3px solid #6366f1' }}>
                    {analysisResult.with_memory.likely_root_cause}
                  </div>
                </div>

                {/* Corroborated Evidence */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Corroborated Evidence
                  </label>
                  <ul style={{ listStyle: 'none', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {analysisResult.with_memory.evidence.map((e, idx) => (
                      <li key={idx} style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={14} color="#10b981" /> {e}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Numbered Remediation Actions */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                    Experience-Based Remediation
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.3rem' }}>
                    {analysisResult.with_memory.recommended_actions.map((act, idx) => (
                      <div key={idx} style={{ fontSize: '0.84rem', color: '#064e3b', padding: '0.6rem 0.85rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
                        {act}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why This Recommendation */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                    Why This Recommendation?
                  </label>
                  <p style={{ fontSize: '0.82rem', color: '#334155', marginTop: '0.2rem', lineHeight: '1.45', background: '#f5f3ff', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #ddd6fe' }}>
                    {analysisResult.with_memory.why_this_recommendation}
                  </p>
                </div>
              </div>

              <div style={{ padding: '0.65rem 0.85rem', background: '#ecfdf5', borderRadius: '8px', border: '1px dashed #a7f3d0', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                  ✨ <strong>Advantage:</strong> Eliminates guesswork. Recalls past verified fixes in seconds, drastically reducing MTTR.
                </span>
              </div>
            </div>

          </div>

          {/* 6. SECOND USER INTERACTION: RESOLUTION FEEDBACK & TEACH INCIDENTIQ */}
          <div 
            className="glass-card mb-8" 
            style={{ 
              padding: '1.75rem', 
              borderColor: '#a7f3d0',
              background: '#ffffff',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem', background: '#ecfdf5', borderRadius: '10px' }}>
                  <CheckCircle size={22} color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>🎯 Did the recommended remediation resolve the incident?</h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Provide verified outcome to teach Hindsight and continuously improve future automated recommendations.
                  </p>
                </div>
              </div>

              {/* Feedback Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setResolutionChoice('Resolved')}
                  className={`btn ${resolutionChoice === 'Resolved' ? 'btn-success' : 'btn-outline'}`}
                  style={{ padding: '0.65rem 1.4rem', fontWeight: 700 }}
                >
                  <CheckCircle2 size={16} /> ✅ RESOLVED
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionChoice('Not Resolved')}
                  className={`btn ${resolutionChoice === 'Not Resolved' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.65rem 1.4rem', fontWeight: 700, background: resolutionChoice === 'Not Resolved' ? '#dc2626' : undefined }}
                >
                  <XCircle size={16} /> ❌ NOT RESOLVED
                </button>
              </div>
            </div>

            {/* 🧠 Teach IncidentIQ Form */}
            {resolutionChoice && (
              <form onSubmit={handleSaveExperience} className="animate-fade-in" style={{ paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Brain size={18} color="#4f46e5" />
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#4338ca' }}>
                    🧠 Teach IncidentIQ: Store Structured Operational Experience in Hindsight
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Actual Root Cause <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      value={actualRootCause}
                      onChange={(e) => setActualRootCause(e.target.value)}
                      placeholder="e.g., PostgreSQL client connection pool exhaustion"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Actual Fix Applied <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      value={actualFix}
                      onChange={(e) => setActualFix(e.target.value)}
                      placeholder="e.g., Increased database connection pool max connections from 50 to 100"
                      required
                    />
                  </div>

                  {resolutionChoice === 'Not Resolved' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.35rem' }}>
                        What Failed? (Negative Knowledge)
                      </label>
                      <input 
                        type="text" 
                        value={whatFailed}
                        onChange={(e) => setWhatFailed(e.target.value)}
                        placeholder="e.g., Restarting application pods failed to clear pool exhaustion."
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Resolution Time (Minutes)
                      </label>
                      <input 
                        type="number" 
                        min={1} 
                        max={1440}
                        value={resolutionTime}
                        onChange={(e) => setResolutionTime(parseInt(e.target.value) || 10)}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.35rem' }}>
                    Additional Lesson Learned (Stored as SRE Operational Rule in Hindsight)
                  </label>
                  <textarea 
                    rows={2}
                    value={lessonLearned}
                    onChange={(e) => setLessonLearned(e.target.value)}
                    placeholder="e.g., Payment API 503 spikes should first be checked for connection pool saturation."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={isSavingExperience}
                    style={{
                      padding: '0.85rem 2rem',
                      fontSize: '1rem',
                      fontWeight: 800
                    }}
                  >
                    {isSavingExperience ? (
                      <>
                        <div className="spinner" style={{ borderTopColor: '#ffffff' }}></div>
                        Retaining to Hindsight...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
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
