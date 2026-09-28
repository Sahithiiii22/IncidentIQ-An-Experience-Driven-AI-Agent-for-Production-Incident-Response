import React from 'react';
import { Shield, Brain, Sparkles, Activity, Play, Zap } from 'lucide-react';

interface HeaderProps {
  onOpenDemo: () => void;
  hindsightConnected: boolean;
  llmProvider: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDemo,
  hindsightConnected,
  llmProvider,
}) => {
  return (
    <header className="glass-card mb-6" style={{ padding: '1rem 1.75rem', background: '#ffffff', borderColor: '#e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
            }}
          >
            <Shield size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
                IncidentIQ
              </h1>
              <span className="badge badge-hindsight" style={{ fontSize: '0.7rem' }}>
                <Brain size={13} />
                HINDSIGHT MEMORY
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Self-Learning AI Agent for Production Incident Response
            </p>
          </div>
        </div>

        {/* Live Status Indicators & Demo Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          
          {/* Hindsight Bank Indicator */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: '#f8fafc', 
              padding: '0.45rem 0.85rem', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Bank:</span>
            <span className="mono" style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 700 }}>incidentiq-ops</span>
          </div>

          {/* LLM Engine Indicator */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: '#f8fafc', 
              padding: '0.45rem 0.85rem', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            <Zap size={14} color="#7c3aed" />
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>LLM:</span>
            <span className="mono" style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 700 }}>{llmProvider || 'openai/gpt-oss-120b'}</span>
          </div>

          {/* RUN HINDSIGHT DEMO Button */}
          <button 
            onClick={onOpenDemo}
            className="btn btn-primary"
            style={{
              padding: '0.55rem 1.15rem',
              fontWeight: 700
            }}
          >
            <Play size={14} fill="#ffffff" />
            RUN HINDSIGHT DEMO
          </button>

        </div>

      </div>
    </header>
  );
};
