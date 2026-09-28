import React from 'react';
import { Brain, Cpu, ArrowDown, ArrowRight, CheckCircle2, Shield, RefreshCw, Zap, Layers, Sparkles } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const steps = [
    {
      num: '1',
      title: 'OBSERVE',
      desc: 'Telemetry, error traces, and user impact ingested via Incident Console.',
      color: '#38bdf8'
    },
    {
      num: '2',
      title: 'RECALL',
      desc: 'Multi-strategy query against Hindsight memory bank retrieves historical incidents & fixes.',
      color: '#a855f7'
    },
    {
      num: '3',
      title: 'REASON',
      desc: 'LLM synthesizes current telemetry with recalled Hindsight experiences.',
      color: '#6366f1'
    },
    {
      num: '4',
      title: 'RECOMMEND',
      desc: 'Delivers concrete, verified remediation steps with AI-estimated confidence and evidence.',
      color: '#10b981'
    },
    {
      num: '5',
      title: 'RESOLVE',
      desc: 'SRE verifies and executes the action plan; records resolution outcome & MTTR.',
      color: '#f59e0b'
    },
    {
      num: '6',
      title: 'LEARN',
      desc: 'Retains structured Incident, Operational, and Rule memories back into Hindsight for future recall.',
      color: '#ec4899'
    }
  ];

  return (
    <div className="animate-fade-in">
      
      {/* Overview Banner */}
      <div className="glass-card mb-6" style={{ padding: '1.5rem 1.75rem', background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)', borderColor: '#c7d2fe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: '#e0e7ff', borderRadius: '10px' }}>
            <Layers size={24} color="#4f46e5" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>IncidentIQ System Architecture</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              How Hindsight Long-Term Memory powers experience-driven self-learning incident response
            </p>
          </div>
        </div>
      </div>

      {/* The 6-Stage Core Loop Cards */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
        The Self-Learning Operational Loop
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {steps.map((s, idx) => (
          <div 
            key={idx} 
            className="glass-card" 
            style={{ 
              padding: '1.25rem 1rem', 
              borderTop: `3px solid ${s.color}`,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: `${s.color}15`,
                border: `1px solid ${s.color}`,
                color: s.color,
                fontWeight: 800,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.6rem'
              }}
            >
              {s.num}
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: s.color, marginBottom: '0.35rem' }}>
              {s.title}
            </h4>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Interactive ASCII & Diagram Card */}
      <div className="glass-card glass-card-glow mb-6" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Component Interaction Model</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dual-Layer Memory & Reasoning Orchestration</span>
          </div>
          <span className="badge badge-hindsight" style={{ padding: '0.35rem 0.75rem' }}>
            <Brain size={14} /> Hindsight = Long-Term Memory Layer
          </span>
        </div>

        {/* Visual Workflow Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', maxWidth: '820px', margin: '0 auto' }}>
          
          {/* User / SRE */}
          <div style={{ padding: '0.75rem 2rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
            👨‍💻 SRE / DEVOPS ENGINEER
          </div>

          <ArrowDown size={20} color="#6366f1" />

          {/* Incident Console */}
          <div style={{ padding: '0.85rem 2.5rem', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', color: '#1d4ed8' }}>
            🚨 INCIDENTIQ CONSOLE (Logs, Traces, Service Context)
          </div>

          <ArrowDown size={20} color="#6366f1" />

          {/* Central AI Agent */}
          <div style={{ padding: '1rem 3rem', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: '12px', fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', textAlign: 'center', boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)' }}>
            🤖 INCIDENTIQ AUTONOMOUS AGENT
          </div>

          {/* Split into Hindsight Memory & LLM Reasoning */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%', marginTop: '0.5rem' }}>
            
            {/* Left: Hindsight Memory Layer */}
            <div style={{ padding: '1.25rem', background: '#f5f3ff', border: '2px solid #c4b5fd', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#6d28d9', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                <Brain size={18} /> HINDSIGHT MEMORY (Vectorize)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginBottom: '0.5rem' }}>
                ⚡ LONG-TERM OPERATIONAL MEMORY
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Multi-strategy Recall across historical incidents, verified fixes, and learned operational rules.
              </p>
            </div>

            {/* Right: LLM Reasoning */}
            <div style={{ padding: '1.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#1d4ed8', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                <Cpu size={18} /> LLM REASONING ENGINE
              </div>
              <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600, marginBottom: '0.5rem' }}>
                🧠 Synthesis & Root Cause Triage
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Analyzes live telemetry together with recalled memories to output high-confidence actionable remediation.
              </p>
            </div>

          </div>

          <ArrowDown size={20} color="#10b981" />

          {/* Experience-Based Recommendation */}
          <div style={{ padding: '0.85rem 2.5rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', color: '#047857', textAlign: 'center' }}>
            🎯 EXPERIENCE-BASED RECOMMENDATION (92% Confidence + Past Fix)
          </div>

          <ArrowDown size={20} color="#ec4899" />

          {/* Retention Back into Hindsight */}
          <div style={{ padding: '0.85rem 2.5rem', background: '#fdf2f8', border: '1px dashed #f472b6', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', color: '#be185d', textAlign: 'center', width: '100%' }}>
            🔄 HINDSIGHT RETAIN: Confirmed Fix & Operational Lessons Saved to Long-Term Memory
          </div>

        </div>
      </div>

    </div>
  );
};
