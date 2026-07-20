import React, { useState, useEffect } from 'react';
import { Network, Sparkles, Activity, ShieldCheck, BookOpen, Key, Brain, ShieldAlert } from 'lucide-react';
import GraphVisualizer from './components/GraphVisualizer';
import CopilotChat from './components/CopilotChat';
import RcaAgent from './components/RcaAgent';
import ComplianceTracker from './components/ComplianceTracker';
import PresentationDeck from './components/PresentationDeck';
import FailureIntelligence from './components/FailureIntelligence';

export default function App() {
  const [activeTab, setActiveTab] = useState('presentation'); // Default to presentation slides so they see it first!
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [apiStatus, setApiStatus] = useState({ hasApiKey: false, mode: 'Checking...' });
  
  // Set backend URL: if local dev server, point to port 5000, otherwise relative (for Render)
  const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/status`);
        const data = await res.json();
        setApiStatus(data);
      } catch (err) {
        console.error("Backend status check failed:", err);
        setApiStatus({ hasApiKey: false, mode: 'Offline' });
      }
    };
    checkApiStatus();
  }, [backendUrl]);

  // Hook to handle node selection from graph to navigate and pre-fill copilot
  const handleGraphNodeSelect = (nodeId) => {
    setSelectedNodeId(nodeId);
    // Provide visual feedback but don't force page redirection unless requested
  };

  const navigateToCopilot = () => {
    setActiveTab('copilot');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <Brain className="logo-icon" size={24} />
          <h2 className="logo-text">Industrial Brain</h2>
        </div>
        
        <ul className="nav-links">
          <li
            className={`nav-item ${activeTab === 'presentation' ? 'active' : ''}`}
            onClick={() => setActiveTab('presentation')}
          >
            <BookOpen className="nav-icon" size={18} />
            <span>Architecture & Pitch</span>
          </li>
          <li
            className={`nav-item ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <Network className="nav-icon" size={18} />
            <span>Knowledge Graph</span>
          </li>
          <li
            className={`nav-item ${activeTab === 'copilot' ? 'active' : ''}`}
            onClick={() => setActiveTab('copilot')}
          >
            <Sparkles className="nav-icon" size={18} />
            <span>Expert RAG Copilot</span>
          </li>
          <li
            className={`nav-item ${activeTab === 'rca' ? 'active' : ''}`}
            onClick={() => setActiveTab('rca')}
          >
            <Activity className="nav-icon" size={18} />
            <span>RCA & Maintenance</span>
          </li>
          <li
            className={`nav-item ${activeTab === 'compliance' ? 'active' : ''}`}
            onClick={() => setActiveTab('compliance')}
          >
            <ShieldCheck className="nav-icon" size={18} />
            <span>Statutory Compliance</span>
          </li>
          <li
            className={`nav-item ${activeTab === 'failures' ? 'active' : ''}`}
            onClick={() => setActiveTab('failures')}
          >
            <ShieldAlert className="nav-icon" size={18} />
            <span>Failure Intelligence</span>
          </li>
        </ul>
        
        <div className="sidebar-footer">
          <div className="env-status">
            <span className={`status-dot ${apiStatus.hasApiKey ? '' : 'simulated'}`}></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{apiStatus.mode}</span>
          </div>
        </div>
      </aside>

      {/* Main Body */}
      <main className="main-content">
        <header className="top-bar">
          <div className="page-title">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeTab === 'presentation' && "Unified Operations Pitch & Slide Deck"}
              {activeTab === 'graph' && "Universal Document Ingestion & Asset Linkage Graph"}
              {activeTab === 'copilot' && "Expert Conversational RAG Copilot"}
              {activeTab === 'rca' && "Maintenance Intelligence & Automated Root Cause Analysis"}
              {activeTab === 'compliance' && "Statutory Compliance Gap Assurance Dashboard"}
              {activeTab === 'failures' && "Lessons Learned & Failure Intelligence Engine"}
            </h1>
            <p>
              {activeTab === 'presentation' && "Project theme overview, problem statement, business ROI, and system flowchart."}
              {activeTab === 'graph' && "Ingest documentation and explore plant-wide structural connection mappings."}
              {activeTab === 'copilot' && "Query the connected manual corpus for safe operations, bearing parameters, and OISD codes."}
              {activeTab === 'rca' && "Fuses sensor bounds, manual instructions, and incidents log to resolve downtime faults."}
              {activeTab === 'compliance' && "Tracks operations checklists against PESO and Factory Act rules to isolate plant risks."}
              {activeTab === 'failures' && "Monitors active alarm correlations, risk matrices, and historical plant failure archives."}
            </p>
          </div>
          
          <div className="user-profile">
            {apiStatus.hasApiKey ? (
              <span className="api-key-badge">
                <Key size={12} />
                <span>Live Gemini Active</span>
              </span>
            ) : (
              <span className="api-key-badge missing" title="Define GEMINI_API_KEY environment variable to activate real-time model completions.">
                <Key size={12} />
                <span>Local Simulated AI Active</span>
              </span>
            )}
          </div>
        </header>

        <section className="view-body">
          {activeTab === 'presentation' && <PresentationDeck />}
          {activeTab === 'graph' && (
            <GraphVisualizer
              backendUrl={backendUrl}
              onNodeSelect={(nodeId) => {
                handleGraphNodeSelect(nodeId);
                // Prompt user to try query in Copilot
                if (confirm(`Do you want to run an Expert Copilot search about "${nodeId}"?`)) {
                  navigateToCopilot();
                }
              }}
            />
          )}
          {activeTab === 'copilot' && (
            <CopilotChat
              backendUrl={backendUrl}
              selectedNodeId={selectedNodeId}
            />
          )}
          {activeTab === 'rca' && <RcaAgent backendUrl={backendUrl} />}
          {activeTab === 'compliance' && <ComplianceTracker backendUrl={backendUrl} />}
          {activeTab === 'failures' && <FailureIntelligence backendUrl={backendUrl} />}
        </section>
      </main>
    </div>
  );
}
