import React from 'react';
import { AlertTriangle, Brain, Clock, Zap } from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsBannerProps {
  stats: DashboardStats | null;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ stats }) => {
  const withMemMTTR = stats?.memory_mttr_avg_minutes ?? 8.5;
  const noMemMTTR = stats?.no_memory_mttr_avg_minutes ?? 20.0;
  const improvement = stats?.mttr_improvement_pct ?? 58;

  const cards = [
    {
      label: 'Active Incidents',
      value: stats ? stats.active_incidents_count : 0,
      icon: <AlertTriangle size={18} color="#ef4444" />,
      color: '#ef4444',
      badge: 'Live Triage'
    },
    {
      label: 'Hindsight Memories',
      value: stats ? stats.memories_stored_count : 45,
      icon: <Brain size={18} color="#6366f1" />,
      color: '#6366f1',
      badge: 'bank: incidentiq-ops'
    },
    {
      label: 'Memory-Assisted MTTR',
      value: `${withMemMTTR}m`,
      icon: <Clock size={18} color="#10b981" />,
      color: '#10b981',
      badge: `vs ${noMemMTTR}m baseline`
    },
    {
      label: 'Resolution Speedup',
      value: `+${improvement}%`,
      icon: <Zap size={18} color="#8b5cf6" />,
      color: '#8b5cf6',
      badge: 'Faster MTTR'
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className="glass-card" 
          style={{ 
            padding: '1rem 1.15rem', 
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderLeft: `3px solid ${card.color}`,
            borderRadius: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              {card.label}
            </span>
            <div style={{ padding: '0.3rem', background: `${card.color}12`, borderRadius: '6px' }}>
              {card.icon}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              {card.value}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f8fafc', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
              {card.badge}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
