import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Filter, Search, Tag, ExternalLink, ShieldAlert } from 'lucide-react';
import { Incident } from '../types';

interface DashboardOverviewProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  incidents,
  onSelectIncident
}) => {
  const [filterService, setFilterService] = useState<string>('All');
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const services = ['All', ...Array.from(new Set(incidents.map(i => i.service)))];

  const filtered = incidents.filter(inc => {
    if (filterService !== 'All' && inc.service !== filterService) return false;
    if (filterSeverity !== 'All' && inc.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.id.toLowerCase().includes(q) ||
        inc.service.toLowerCase().includes(q) ||
        (inc.root_cause && inc.root_cause.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="animate-fade-in">
      
      {/* Controls & Filter Bar */}
      <div className="glass-card mb-6" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search incidents by ID, title, service, root cause..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Service Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Service:</label>
            <select 
              value={filterService} 
              onChange={(e) => setFilterService(e.target.value)}
              style={{ width: 'auto', minWidth: '140px' }}
            >
              {services.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Severity:</label>
            <select 
              value={filterSeverity} 
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{ width: 'auto', minWidth: '130px' }}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

        </div>
      </div>

      {/* Incidents Table / Cards Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No incidents match your filter criteria.
          </div>
        ) : (
          filtered.map((inc) => (
            <div 
              key={inc.id} 
              className="glass-card" 
              style={{ 
                padding: '1.25rem 1.5rem',
                borderLeft: `4px solid ${
                  inc.severity === 'Critical' ? '#f43f5e' :
                  inc.severity === 'High' ? '#f59e0b' : '#3b82f6'
                }`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                
                {/* ID, Title, Status */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <span className="mono" style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.9rem' }}>
                      {inc.id}
                    </span>
                    <span className={`badge ${
                      inc.severity === 'Critical' ? 'badge-critical' :
                      inc.severity === 'High' ? 'badge-high' : 'badge-medium'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="badge badge-resolved">
                      {inc.status}
                    </span>
                    {inc.recalled_from_hindsight && (
                      <span className="badge badge-memory-recalled">
                        Recalled From Hindsight
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {inc.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Service: <strong style={{ color: 'var(--text-primary)' }}>{inc.service}</strong>
                  </div>
                </div>

                {/* MTTR & Inspect Action */}
                <div style={{ textAlign: 'right' }}>
                  {inc.resolution_time_minutes && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontSize: '0.85rem', fontWeight: 600, justifyContent: 'flex-end', marginBottom: '0.4rem' }}>
                      <Clock size={15} /> MTTR: {inc.resolution_time_minutes} min
                    </div>
                  )}
                  <button 
                    onClick={() => onSelectIncident(inc)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
                  >
                    View Context <ExternalLink size={13} />
                  </button>
                </div>

              </div>

              {/* Description */}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                {inc.description}
              </p>

              {/* Root Cause & Fix Details if Resolved */}
              {inc.root_cause && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                      Identified Root Cause
                    </span>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                      {inc.root_cause}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                      Remediation Fix Applied
                    </span>
                    <p style={{ fontSize: '0.82rem', color: '#047857', marginTop: '0.15rem' }}>
                      {inc.fix_applied}
                    </p>
                  </div>
                </div>
              )}

              {/* Lessons Learned */}
              {inc.lessons_learned && inc.lessons_learned.length > 0 && (
                <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#4f46e5' }}>
                  <Tag size={13} color="#6366f1" />
                  <span><strong>Hindsight Lesson:</strong> {inc.lessons_learned[0]}</span>
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
};
