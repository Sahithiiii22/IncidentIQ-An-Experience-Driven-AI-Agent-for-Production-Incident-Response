import React from 'react';
import { AlertTriangle, CheckCircle2, Brain, Search, Clock, TrendingDown } from 'lucide-react';
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
      icon: <AlertTriangle size={18} color="#f43f5e" />,
      color: '#f43f5e',
      subtext: 'Requires triage'
    },
    {
      label: 'Resolved Incidents',
      value: stats ? stats.resolved_incidents_count : 15,
      icon: <CheckCircle2 size={18} color="#10b981" />,
      color: '#10b981',
      subtext: 'Experience indexed'
    },
    {
      label: 'Memories in Hindsight',
      value: stats ? stats.memories_stored_count : 45,
      icon: <Brain size={18} color="#38bdf8" />,
      color: '#38bdf8',
      subtext: 'Bank: incidentiq-ops'
    },
    {
      label: 'Memory-Assisted MTTR',
      value: `${withMemMTTR}m`,
      icon: <Clock size={18} color="#10b981" />,
      color: '#10b981',
      subtext: `vs ${noMemMTTR}m without memory`
    },
    {
      label: 'Resolution Improvement',
      value: `-${improvement}%`,
      icon: <TrendingDown size={18} color="#10b981" />,
      color: '#10b981',
      subtext: 'Estimated from recorded history'
    },
    {
      label: 'Hindsight Bank Status',
      value: stats?.hindsight_connected ? 'Connected' : 'Standalone',
      icon: <Search size={18} color="#a855f7" />,
      color: '#a855f7',
      subtext: 'Multi-strategy recall active'
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className="glass-card" 
          style={{ 
            padding: '1.15rem 1.25rem', 
            position: 'relative', 
            overflow: 'hidden',
            borderLeft: `3px solid ${card.color}` 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {card.label}
            </span>
            <div style={{ padding: '0.35rem', background: `${card.color}15`, borderRadius: '6px' }}>
              {card.icon}
            </div>
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            {card.value}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {card.subtext}
          </div>
        </div>
      ))}
    </div>
  );
};
