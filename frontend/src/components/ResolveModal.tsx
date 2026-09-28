import React, { useState } from 'react';
import { X, CheckCircle2, Brain, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { resolveAndLearn } from '../services/api';

interface ResolveModalProps {
  incidentId: string;
  incidentTitle: string;
  suggestedCause?: string;
  suggestedFix?: string;
  onClose: () => void;
  onSuccess: (response: any) => void;
}

export const ResolveModal: React.FC<ResolveModalProps> = ({
  incidentId,
  incidentTitle,
  suggestedCause,
  suggestedFix,
  onClose,
  onSuccess
}) => {
  const [outcome, setOutcome] = useState<'Resolved' | 'Not Resolved'>('Resolved');
  const [actualRootCause, setActualRootCause] = useState(suggestedCause || 'PostgreSQL connection pool exhaustion under high checkout traffic.');
  const [actualFix, setActualFix] = useState(suggestedFix || 'Increased max connection pool from 50 to 100 in database.yaml.');
  const [resolutionTime, setResolutionTime] = useState<number>(12);
  const [lessonsLearned, setLessonsLearned] = useState(
    'Always inspect connection pool saturation metrics before restarting PostgreSQL instances. Increasing pool size from 50 to 100 instantly resolved the 503 outage.'
  );
  const [notes, setNotes] = useState('Remediation applied in production cluster. Error rates dropped to 0%.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await resolveAndLearn({
        incident_id: incidentId,
        actual_root_cause: actualRootCause,
        actual_fix: actualFix,
        outcome,
        resolution_notes: notes,
        resolution_time_minutes: resolutionTime,
        lessons_learned: lessonsLearned
      });

      // Celebration effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore confetti errors
      }

      onSuccess(result);
    } catch (err: any) {
      setError(err.message || 'Failed to retain experience in Hindsight');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in">
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: '#ecfdf5', borderRadius: '10px' }}>
              <CheckCircle2 size={22} color="#059669" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Resolve Incident & Train Hindsight</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {incidentId}: {incidentTitle}
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Outcome Choice */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Incident Outcome
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setOutcome('Resolved')}
                className={`btn ${outcome === 'Resolved' ? 'btn-success' : 'btn-outline'}`}
                style={{ flex: 1 }}
              >
                <CheckCircle2 size={16} /> Mark as Resolved
              </button>
              <button
                type="button"
                onClick={() => setOutcome('Not Resolved')}
                className={`btn ${outcome === 'Not Resolved' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, background: outcome === 'Not Resolved' ? '#dc2626' : undefined }}
              >
                <X size={16} /> Not Resolved
              </button>
            </div>
          </div>

          {/* Actual Root Cause */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Confirmed Root Cause <span style={{ color: '#4f46e5' }}>*</span>
            </label>
            <input 
              type="text" 
              value={actualRootCause} 
              onChange={(e) => setActualRootCause(e.target.value)}
              placeholder="e.g. Database connection pool exhausted due to unclosed sessions"
              required 
            />
          </div>

          {/* Actual Fix Applied */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Remediation Action Applied <span style={{ color: '#4f46e5' }}>*</span>
            </label>
            <textarea 
              rows={2}
              value={actualFix} 
              onChange={(e) => setActualFix(e.target.value)}
              placeholder="e.g. Increased database connection pool max connections from 50 to 100 in database.yaml"
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            {/* Resolution Time */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                MTTR (Minutes)
              </label>
              <input 
                type="number" 
                min={1} 
                max={1440}
                value={resolutionTime} 
                onChange={(e) => setResolutionTime(parseInt(e.target.value) || 10)}
              />
            </div>

            {/* Resolution Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Resolution Notes
              </label>
              <input 
                type="text" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Diagnostic findings, post-mortem notes"
              />
            </div>
          </div>

          {/* Lessons Learned */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Sparkles size={14} color="#6366f1" />
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4f46e5' }}>
                Lessons Learned (Stored as Operational Memory in Hindsight)
              </label>
            </div>
            <textarea 
              rows={3}
              value={lessonsLearned} 
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="Operational rule of thumb or takeaway for future automated recall"
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                padding: '0.75rem 1.5rem',
                fontWeight: 700
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Retaining to Hindsight...
                </>
              ) : (
                <>
                  <Brain size={16} />
                  STORE EXPERIENCE IN HINDSIGHT
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
