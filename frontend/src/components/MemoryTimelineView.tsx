import React, { useState, useEffect } from 'react';
import { Clock, Brain, ArrowDown, CheckCircle2, Zap, Sparkles, TrendingDown, Shield } from 'lucide-react';
import { TimelineEvent } from '../types';
import { fetchMemoryTimeline } from '../services/api';

export const MemoryTimelineView: React.FC = () => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchMemoryTimeline();
        setTimelineEvents(res.timeline);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="animate-fade-in">
      
      {/* Intro Banner */}
      <div className="glass-card mb-6" style={{ padding: '1.5rem 1.75rem', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', borderColor: '#bfdbfe' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.45rem', background: '#dbeafe', borderRadius: '10px' }}>
                <Clock size={24} color="#2563eb" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Continuous SRE Memory Timeline</h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Visualizing how IncidentIQ builds long-term operational memory with Hindsight and cuts resolution times.
            </p>
          </div>

          {/* MTTR Drop Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.6rem 1rem', borderRadius: '10px' }}>
            <TrendingDown size={22} color="#059669" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>Learning Efficiency</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065f46' }}>-64% MTTR Reduction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Flagship Exemplar Narrative Box: INC-104 -> INC-118 */}
      <div className="glass-card glass-card-glow mb-8" style={{ padding: '1.75rem', borderLeft: '4px solid #6366f1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Sparkles size={18} color="#6366f1" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#4338ca' }}>
            Flagship Learning Trajectory: First Encounter vs Recalled Resolution
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          {/* INC-104 Card */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="mono" style={{ fontWeight: 800, color: '#b91c1c' }}>INC-104</span>
              <span className="badge badge-critical">Novel Occurrence (No Memory)</span>
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Database Connection Timeout on Checkout Gateway
            </h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              Investigation required manual triaging & pool tuning. MTTR took <strong>14 minutes</strong>.
            </div>
            <div style={{ padding: '0.6rem', background: '#ffffff', borderRadius: '6px', border: '1px dashed #fca5a5', fontSize: '0.78rem', color: '#991b1b' }}>
              🧠 <strong>Stored into Hindsight:</strong> "Payment API 503s are solved by increasing client pool max capacity from 50 to 100."
            </div>
          </div>

          {/* Evolution Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.3rem' }}>
              <Brain size={16} /> Hindsight Recalls Experience
            </div>
            <div style={{ width: '100%', height: '2px', background: 'linear-gradient(to right, #6366f1, #10b981)' }}></div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Zero trial-and-error</span>
          </div>

          {/* INC-118 Card */}
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="mono" style={{ fontWeight: 800, color: '#047857' }}>INC-118</span>
              <span className="badge badge-memory-recalled">Recalled INC-104</span>
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#065f46', marginBottom: '0.3rem' }}>
              Payment API 503 - DB Connection Saturation
            </h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              Agent instantly recalled INC-104, recommended pool expansion immediately. Resolved in <strong>9 minutes</strong>!
            </div>
            <div style={{ padding: '0.6rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '0.78rem', color: '#047857' }}>
              ⚡ <strong>Outcome:</strong> 35% faster MTTR with 92% AI-estimated confidence.
            </div>
          </div>

        </div>
      </div>

      {/* Chronological Vertical Timeline Feed */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
        Historical Incident & Learning Stream
      </h3>

      <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {timelineEvents.map((evt, idx) => (
          <div key={idx} style={{ position: 'relative' }}>
            
            {/* Timeline Node Dot */}
            <div 
              style={{
                position: 'absolute',
                left: '-2.45rem',
                top: '0.4rem',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: evt.recalled_from_hindsight ? '#10b981' : '#6366f1',
                boxShadow: evt.recalled_from_hindsight ? '0 0 8px #10b981' : '0 0 8px #6366f1',
                border: '2px solid #ffffff'
              }}
            />

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="mono" style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.88rem' }}>
                    {evt.incident_id}
                  </span>
                  <span className="badge badge-resolved" style={{ fontSize: '0.65rem' }}>
                    {evt.status}
                  </span>
                  {evt.recalled_from_hindsight && (
                    <span className="badge badge-memory-recalled" style={{ fontSize: '0.65rem' }}>
                      Recalled From Hindsight
                    </span>
                  )}
                </div>
                {evt.resolution_time_minutes && (
                  <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                    MTTR: {evt.resolution_time_minutes} min
                  </span>
                )}
              </div>

              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {evt.title}
              </h4>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Service: <strong>{evt.service}</strong>
              </div>

              {evt.root_cause && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  <strong style={{ color: '#dc2626' }}>Root Cause:</strong> {evt.root_cause}
                </div>
              )}
              {evt.fix_applied && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#059669' }}>Remediation:</strong> {evt.fix_applied}
                </div>
              )}

              {evt.lessons_learned && evt.lessons_learned.length > 0 && (
                <div style={{ fontSize: '0.76rem', color: '#4338ca', background: '#eef2ff', padding: '0.5rem 0.75rem', borderRadius: '6px', borderLeft: '2px solid #6366f1' }}>
                  🧠 <strong>Hindsight Rule:</strong> {evt.lessons_learned[0]}
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
