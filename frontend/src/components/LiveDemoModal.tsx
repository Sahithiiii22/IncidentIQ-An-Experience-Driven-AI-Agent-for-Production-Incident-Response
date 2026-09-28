import React, { useState } from 'react';
import { X, Play, Brain, CheckCircle2, Sparkles, ArrowRight, Zap, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { runDemoScenario } from '../services/api';

interface LiveDemoModalProps {
  onClose: () => void;
  onDemoCompleted: () => void;
}

export const LiveDemoModal: React.FC<LiveDemoModalProps> = ({ onClose, onDemoCompleted }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [demoData, setDemoData] = useState<any | null>(null);
  const [activeStage, setActiveStage] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const handleRunDemo = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const data = await runDemoScenario();
      setDemoData(data);
      setActiveStage(2);
      
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch (err) {}

      onDemoCompleted();
    } catch (err: any) {
      setError(err.message || 'Demo scenario execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '840px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.55rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '10px' }}>
              <Play size={20} fill="#ffffff" color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>IncidentIQ 60-Second Hackathon Demo</h2>
                <span className="badge badge-hindsight">Hindsight Self-Learning</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Demonstrating Incident Ingestion → Experience Retention → Precision Recall
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Initial Prompt or Results */}
        {!demoData ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eef2ff', border: '2px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <Brain size={32} color="#6366f1" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Experience-Driven Self-Learning in Action
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 1.75rem auto', lineHeight: '1.5' }}>
              Click the button below to run an automated simulation. IncidentIQ will encounter a novel database bottleneck, learn the solution, and then instantly recall that experience when a similar outage strikes.
            </p>

            <button 
              onClick={handleRunDemo}
              disabled={isRunning}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                padding: '0.9rem 2.2rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
                border: 'none'
              }}
            >
              {isRunning ? (
                <>
                  <div className="spinner"></div>
                  Executing Self-Learning Simulation...
                </>
              ) : (
                <>
                  <Play size={18} fill="#ffffff" />
                  START 1-CLICK DEMO
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Takeaway Banner */}
            <div style={{ padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)', border: '1px solid #a7f3d0', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <ShieldCheck size={20} color="#059669" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#047857' }}>
                  Demonstrated Learning Result
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                "{demoData.learning_takeaway}"
              </p>
            </div>

            {/* STAGE 1: Novel Incident Encountered & Resolved */}
            <div className="glass-card" style={{ padding: '1.25rem', borderColor: '#fecaca', background: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-critical">1. Novel Incident</span>
                  <span className="mono" style={{ fontWeight: 700, color: '#b91c1c' }}>{demoData.stage_1.incident.id}</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MTTR: 25 min</span>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                {demoData.stage_1.incident.title}
              </h4>
              
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                Fix Applied: <strong style={{ color: 'var(--text-primary)' }}>{demoData.stage_1.actual_fix}</strong>
              </div>

              <div style={{ padding: '0.65rem 0.85rem', background: '#ffffff', borderRadius: '6px', border: '1px dashed #bfdbfe', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain size={16} color="#4f46e5" />
                <span style={{ fontSize: '0.78rem', color: '#1e40af' }}>
                  <strong>NEW EXPERIENCE LEARNED:</strong> Retained {demoData.stage_1.hindsight_retention.memories_created} structured memory units in Hindsight bank.
                </span>
              </div>
            </div>

            {/* Transition Indicator */}
            <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#059669', fontWeight: 700, fontSize: '0.88rem' }}>
              <div style={{ width: '60px', height: '1px', background: '#a7f3d0' }}></div>
              <span>Time Passes ➔ Similar Incident Strikes</span>
              <div style={{ width: '60px', height: '1px', background: '#a7f3d0' }}></div>
            </div>

            {/* STAGE 2: Similar Incident with Hindsight Recall */}
            <div className="glass-card glass-card-emerald" style={{ padding: '1.25rem', borderColor: '#a7f3d0', background: '#f0fdf4' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-memory-recalled">2. Recalled from Hindsight</span>
                  <span className="mono" style={{ fontWeight: 700, color: '#047857' }}>{demoData.stage_2.incident.id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontWeight: 800, fontSize: '0.9rem' }}>
                  <Clock size={16} /> MTTR: 6 min ({demoData.stage_2.mttr_improvement.mttr_reduction_pct})
                </div>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#065f46', marginBottom: '0.3rem' }}>
                {demoData.stage_2.incident.title}
              </h4>

              <div style={{ padding: '0.75rem 0.85rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  SIMILAR INCIDENT FOUND IN HINDSIGHT ({demoData.stage_2.recalled_from_ids.join(', ')})
                </div>
                <p style={{ fontSize: '0.82rem', color: '#065f46' }}>
                  {demoData.stage_2.with_memory_result.why_this_recommendation}
                </p>
              </div>

              {/* Action Plan */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                  Instant Remediation Plan:
                </span>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {demoData.stage_2.with_memory_result.recommended_actions[0]}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                onClick={onClose} 
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.5rem' }}
              >
                Close Demo & Explore Console
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
