import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  LayoutDashboard, 
  Brain, 
  Clock, 
  Layers, 
  Play,
  Sparkles
} from 'lucide-react';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { InvestigationConsole } from './components/InvestigationConsole';
import { DashboardOverview } from './components/DashboardOverview';
import { MemoryBankExplorer } from './components/MemoryBankExplorer';
import { MemoryTimelineView } from './components/MemoryTimelineView';
import { ArchitectureView } from './components/ArchitectureView';
import { LiveDemoModal } from './components/LiveDemoModal';
import { DashboardStats, Incident } from './types';
import { fetchDashboardStats, fetchIncidents } from './services/api';

type TabType = 'console' | 'dashboard' | 'memory' | 'timeline' | 'architecture';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('console');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isDemoOpen, setIsDemoOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [statsData, incidentsData] = await Promise.all([
        fetchDashboardStats(),
        fetchIncidents()
      ]);
      setStats(statsData);
      setIncidents(incidentsData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="app-container">
      
      {/* Header with Brand & Live Indicators */}
      <Header 
        onOpenDemo={() => setIsDemoOpen(true)}
        hindsightConnected={stats?.hindsight_connected ?? true}
        llmProvider={stats?.llm_provider ?? 'Llama-3.3-70B'}
      />

      {/* Top DevOps & Learning Stats Banner */}
      <StatsBanner stats={stats} />

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'console' ? 'active' : ''}`}
          onClick={() => setActiveTab('console')}
        >
          <Terminal size={17} />
          <span>Incident Console & Investigation</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={17} />
          <span>DevOps Incident Feed</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
          onClick={() => setActiveTab('memory')}
        >
          <Brain size={17} />
          <span>Hindsight Memory Bank</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Clock size={17} />
          <span>Memory Timeline & Learning</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          <Layers size={17} />
          <span>Architecture & Core Loop</span>
        </button>
      </nav>

      {/* Main Tab Content Panels */}
      <main>
        {activeTab === 'console' && (
          <InvestigationConsole onIncidentResolved={loadData} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardOverview 
            incidents={incidents} 
            onSelectIncident={(inc) => {
              setActiveTab('console');
            }} 
          />
        )}

        {activeTab === 'memory' && (
          <MemoryBankExplorer />
        )}

        {activeTab === 'timeline' && (
          <MemoryTimelineView />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}
      </main>

      {/* 1-Click Interactive Hackathon Demo Modal */}
      {isDemoOpen && (
        <LiveDemoModal 
          onClose={() => setIsDemoOpen(false)} 
          onDemoCompleted={loadData}
        />
      )}

      {/* Footer */}
      <footer style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Brain size={15} color="#4f46e5" />
          <span>IncidentIQ — Persistent AI Incident Memory layer powered by Vectorize Hindsight</span>
        </div>
        <div>
          Observe ➔ Recall ➔ Reason ➔ Recommend ➔ Resolve ➔ Learn
        </div>
      </footer>

    </div>
  );
};
