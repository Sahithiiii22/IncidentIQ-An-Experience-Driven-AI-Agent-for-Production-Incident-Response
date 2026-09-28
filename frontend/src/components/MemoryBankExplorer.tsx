import React, { useState, useEffect } from 'react';
import { Brain, Search, Sparkles, Filter, Database, BookOpen, Layers, RefreshCw } from 'lucide-react';
import { MemoryItem, MemoryType } from '../types';
import { fetchBankMemories, queryRecall, queryReflect } from '../services/api';

export const MemoryBankExplorer: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Reflect tool
  const [reflectPrompt, setReflectPrompt] = useState<string>('Payment API database timeouts and connection saturation');
  const [reflectResult, setReflectResult] = useState<string | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const data = await fetchBankMemories();
      setMemories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleSearchRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadMemories();
      return;
    }
    setLoading(true);
    try {
      const recalled = await queryRecall(searchQuery);
      setMemories(recalled);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReflect = async () => {
    if (!reflectPrompt.trim()) return;
    setIsReflecting(true);
    try {
      const res = await queryReflect(reflectPrompt);
      setReflectResult(res.reflection);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReflecting(false);
    }
  };

  const filtered = memories.filter(m => {
    if (selectedType !== 'All' && m.memory_type !== selectedType) return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      
      {/* Top Hindsight Bank Overview */}
      <div className="glass-card glass-card-glow mb-6" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.5rem', background: '#eef2ff', borderRadius: '10px' }}>
                <Brain size={24} color="#6366f1" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Hindsight Memory Bank Explorer</h2>
                  <span className="badge badge-hindsight">bank: incidentiq-ops</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Continuous long-term memory layer powered by Vectorize Hindsight (multi-strategy recall & mental model reflection)
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={loadMemories}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} /> Refresh Bank
          </button>
        </div>
      </div>

      {/* Mental Model Reflection Playground */}
      <div className="glass-card mb-6" style={{ padding: '1.5rem', background: '#faf5ff', borderColor: '#e9d5ff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={18} color="#7c3aed" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#5b21b6' }}>Hindsight Reflect: Synthesize Operational Mental Model</h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
          Ask Hindsight to reflect and synthesize aggregated operational wisdom across all recorded incidents.
        </p>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            value={reflectPrompt} 
            onChange={(e) => setReflectPrompt(e.target.value)}
            placeholder="e.g. What are the main causes and fixes for Payment API 503s?"
            style={{ flex: 1, minWidth: '280px' }}
          />
          <button 
            onClick={handleReflect}
            className="btn btn-primary"
            disabled={isReflecting}
            style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)' }}
          >
            {isReflecting ? 'Synthesizing...' : 'Reflect with Hindsight'}
          </button>
        </div>

        {reflectResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              Synthesized Operational Mental Model
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              {reflectResult}
            </p>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card mb-6" style={{ padding: '1.25rem 1.5rem' }}>
        <form onSubmit={handleSearchRecall} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Recall Query */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search Hindsight memory (semantic, keywords, symptoms, fixes)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Memory Type Filter */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['All', 'Incident', 'Operational', 'Learning'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`btn ${selectedType === type ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
              >
                {type === 'All' ? 'All Types' : `${type} Memory`}
              </button>
            ))}
          </div>

        </form>
      </div>

      {/* Memory Items Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          Querying Hindsight Memory Bank...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((item) => (
            <div 
              key={item.id} 
              className="glass-card" 
              style={{ 
                padding: '1.25rem',
                borderLeft: `3px solid ${
                  item.memory_type === 'Incident' ? '#6366f1' :
                  item.memory_type === 'Operational' ? '#8b5cf6' : '#10b981'
                }`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {item.id}
                    </span>
                    {item.incident_id && (
                      <span className="badge badge-hindsight" style={{ fontSize: '0.65rem' }}>
                        {item.incident_id}
                      </span>
                    )}
                  </div>
                  <span className={`badge ${
                    item.memory_type === 'Incident' ? 'badge-hindsight' :
                    item.memory_type === 'Operational' ? 'badge-high' : 'badge-resolved'
                  }`} style={{ fontSize: '0.68rem' }}>
                    {item.memory_type}
                  </span>
                </div>

                {/* Title */}
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {item.title}
                </h4>
                
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                  Service: <strong style={{ color: '#4f46e5' }}>{item.service}</strong>
                </div>

                {/* Content */}
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.65rem', borderRadius: '6px' }}>
                  {item.content}
                </p>

                {/* Root cause and Fix if present */}
                {item.root_cause && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    <strong style={{ color: '#dc2626' }}>Root Cause:</strong> {item.root_cause}
                  </div>
                )}
                {item.fix_applied && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    <strong style={{ color: '#059669' }}>Fix Applied:</strong> {item.fix_applied}
                  </div>
                )}
              </div>

              {/* Tags / Lesson Footer */}
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {item.tags.map((t, idx) => (
                    <span key={idx} className="mono" style={{ fontSize: '0.68rem', color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      #{t}
                    </span>
                  ))}
                </div>
                {item.similarity_score > 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                    Score: {Math.round(item.similarity_score * 100)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
