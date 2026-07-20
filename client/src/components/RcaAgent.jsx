import React, { useState } from 'react';
import { ShieldAlert, Activity, FileText, Settings, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

export default function RcaAgent({ backendUrl }) {
  const [selectedAsset, setSelectedAsset] = useState('P-102A');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [rcaResult, setRcaResult] = useState(null);

  // Asset telemetry profiles
  const assetProfiles = {
    'P-102A': {
      name: 'Pump P-102A (Centrifugal Barrier Fluid Pump)',
      status: 'Warning',
      color: 'var(--accent-amber)',
      vitals: [
        { label: 'Suction Pressure', value: '2.4 bar', status: 'Normal' },
        { label: 'Discharge Pressure', value: '18.2 bar', status: 'Normal' },
        { label: 'Vibration Amplitude', value: '4.8 mm/s RMS', status: 'High' }, // Limit 4.5
        { label: 'Bearing Temperature', value: '62°C', status: 'Normal' }
      ]
    },
    'B-501': {
      name: 'Boiler B-501 (High-Pressure Steam Boiler)',
      status: 'Healthy',
      color: 'var(--accent-green)',
      vitals: [
        { label: 'Steam Header Pressure', value: '28.4 kg/cm2', status: 'Normal' },
        { label: 'Drum Water Level', value: '54.5 %', status: 'Normal' },
        { label: 'Fuel Gas Pressure', value: '2.7 kg/cm2', status: 'Normal' },
        { label: 'Stack Temperature', value: '185°C', status: 'Normal' }
      ]
    },
    'C-301': {
      name: 'Compressor C-301 (Reciprocating Gas Compressor)',
      status: 'Critical',
      color: 'var(--accent-red)',
      vitals: [
        { label: 'Discharge Temp', value: '122°C', status: 'High' }, // Limit 125
        { label: 'Suction Gas Leak Rate', value: '55 % LEL', status: 'Critical' }, // Trip 60%
        { label: 'Vibration Level', value: '7.3 mm/s RMS', status: 'Critical' }, // Limit 4.5
        { label: 'Lube Oil Pressure', value: '3.1 bar', status: 'Normal' }
      ]
    }
  };

  const currentAsset = assetProfiles[selectedAsset];

  const triggerRcaAnalysis = async () => {
    setLoading(true);
    setRcaResult(null);
    setLogs([]);

    const logSteps = [
      "Fusing equipment work order history...",
      "Querying incidents database (locating historical failure patterns)...",
      "Analyzing OEM Technical Specifications and clearance tolerances...",
      "Correlating real-time telemetry (vibrations, thermal bounds)...",
      "Invoking Gemini Agentic RCA reasoning model..."
    ];

    // Simulate logs appearing sequentially
    for (let i = 0; i < logSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setLogs(prev => [...prev, logSteps[i]]);
    }

    try {
      const res = await fetch(`${backendUrl}/api/rca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId: selectedAsset })
      });
      const data = await res.json();
      setRcaResult(data);
    } catch (err) {
      console.error(err);
      setRcaResult({
        equipment: selectedAsset,
        rca: "### Connection Failure\n\nUnable to generate RCA report due to backend server timeouts. Please check status.",
        pdmRecommendations: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to construct fishbone diagram details from generated outputs
  const getFishboneDetails = (asset) => {
    if (asset === 'P-102A') {
      return [
        { branch: "Machine (Equipment)", causes: ["Suction Strainer blockage", "Mechanical seal run dry"] },
        { branch: "Method (Procedure)", causes: ["Safety alarms bypassed", "Pre-startup flush ignored"] },
        { branch: "Material (Lubricants)", causes: ["Barrier fluid dry out", "ISO VG 68 oil depletion"] },
        { branch: "Man (Operator)", causes: ["Alarm silenced on DCS", "Lack of NPSHr training"] }
      ];
    } else if (asset === 'B-501') {
      return [
        { branch: "Machine (Equipment)", causes: ["Actuator shaft seized", "Spindle corrosion"] },
        { branch: "Method (Procedure)", causes: ["DCS mismatch alarm missing", "Manual valves left open"] },
        { branch: "Material (Lubricants)", causes: ["Instrument air condensation", "Filter dryer saturation"] },
        { branch: "Man (Operator)", causes: ["Slow manual override response", "Pneumatic lines unchecked"] }
      ];
    } else {
      return [
        { branch: "Machine (Equipment)", causes: ["Piping support beam cracked", "Bolt relaxation"] },
        { branch: "Method (Procedure)", causes: ["Vibration thresholds ignored", "Near-miss unreported"] },
        { branch: "Material (Lubricants)", causes: ["Gasket wear and failure", "Vibrating SS316 flange"] },
        { branch: "Man (Operator)", causes: ["Log check delays", "Calibration overdue"] }
      ];
    }
  };

  return (
    <div className="grid-2">
      {/* Left Column: Asset Selection & Telemetry */}
      <div>
        <div className="glass-card">
          <div className="glass-card-title">
            <Activity size={20} className="logo-icon" />
            <span>Real-time Asset Vitals & Operations Telemetry</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              className={`btn ${selectedAsset === 'P-102A' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1 }}
              onClick={() => { setSelectedAsset('P-102A'); setRcaResult(null); }}
              disabled={loading}
            >
              Pump P-102A
            </button>
            <button
              className={`btn ${selectedAsset === 'B-501' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1 }}
              onClick={() => { setSelectedAsset('B-501'); setRcaResult(null); }}
              disabled={loading}
            >
              Boiler B-501
            </button>
            <button
              className={`btn ${selectedAsset === 'C-301' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1 }}
              onClick={() => { setSelectedAsset('C-301'); setRcaResult(null); }}
              disabled={loading}
            >
              Compressor C-301
            </button>
          </div>

          {/* Asset Telemetry Card */}
          <div style={{
            padding: '1.25rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(255,255,255,0.01)',
            border: '1px solid var(--border-glass)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontWeight: 600, fontSize: '1rem' }}>{currentAsset.name}</h4>
              <span className="compliance-badge" style={{
                backgroundColor: `${currentAsset.color}15`,
                color: currentAsset.color,
                border: `1px solid ${currentAsset.color}30`
              }}>
                {currentAsset.status}
              </span>
            </div>

            <div className="grid-2">
              {currentAsset.vitals.map((vital, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '6px',
                  display: 'flex',
                  justifycontent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{vital.label}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', display: 'block' }}>{vital.value}</span>
                    <span style={{
                      fontSize: '0.7rem',
                      color: vital.status === 'Normal' ? 'var(--accent-green)' : (vital.status === 'High' ? 'var(--accent-amber)' : 'var(--accent-red)')
                    }}>
                      {vital.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trigger Button */}
          <button
            onClick={triggerRcaAnalysis}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={loading}
          >
            <Settings className="logo-icon" size={16} />
            {loading ? 'Running Automated Diagnostic Agents...' : 'Run Agentic Root Cause Analysis (RCA)'}
          </button>
        </div>

        {/* Diagnostic Logs (Agent Thinking Process) */}
        {(loading || logs.length > 0) && (
          <div className="glass-card">
            <div className="glass-card-title">
              <FileText size={18} className="logo-icon" />
              <span>RCA Pipeline Execution Logs</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {logs.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {idx === logs.length - 1 && loading ? (
                    <span className="status-dot" style={{ animation: 'pulse 1s infinite' }}></span>
                  ) : (
                    <CheckCircle2 size={12} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                  )}
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Fishbone Diagram & CAPA Findings */}
      <div>
        <div className="glass-card" style={{ height: 'calc(100% - 1.5rem)', overflowY: 'auto' }}>
          <div className="glass-card-title">
            <ShieldAlert size={20} className="logo-icon" />
            <span>Root Cause & CAPA Reports</span>
          </div>

          {rcaResult ? (
            <div>
              {/* Fishbone Visualizer */}
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                Ishikawa (Fishbone) Failure Mapping
              </h4>
              <div className="fishbone-container">
                <div className="grid-2" style={{ gap: '1rem 2rem' }}>
                  {getFishboneDetails(selectedAsset).map((branch, bIdx) => (
                    <div key={bIdx} style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '6px',
                      padding: '0.75rem'
                    }}>
                      <div className="branch-title">{branch.branch}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                        {branch.causes.map((cause, cIdx) => (
                          <div key={cIdx} className="branch-cause">
                            • {cause}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="fishbone-backbone">
                  <div className="fishbone-head">
                    {selectedAsset} FAILURE
                  </div>
                </div>
              </div>

              {/* RCA Details Markdown */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.75rem' }}>
                  Reliability Expert Findings
                </h4>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)'
                }}>
                  {rcaResult.rca.split('\n\n').map((para, idx) => {
                    if (para.startsWith('###') || para.startsWith('####')) {
                      return <h5 key={idx} style={{
                        color: 'var(--accent-cyan)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        margin: '1.25rem 0 0.5rem 0'
                      }}>{para.replace(/#/g, '').trim()}</h5>;
                    }
                    if (para.startsWith('-') || para.startsWith('*')) {
                      return (
                        <ul key={idx} style={{ paddingLeft: '1.25rem', margin: '0.5rem 0' }}>
                          {para.split('\n').map((li, lIdx) => (
                            <li key={lIdx} style={{ marginBottom: '0.35rem' }}>
                              {li.replace(/^[\s-*]+/, '')}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={idx} style={{ marginBottom: '0.75rem' }}>{para}</p>;
                  })}
                </div>
              </div>

              {/* Predictive Recommendations */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.75rem' }}>
                  PdM Continuous Warning Indicators
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {rcaResult.pdmRecommendations.map((rec, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.85rem',
                      backgroundColor: 'rgba(0, 242, 254, 0.03)',
                      border: '1px solid rgba(0, 242, 254, 0.1)',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}>
                      <ChevronRight size={14} style={{ color: 'var(--accent-cyan)' }} />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifycontent: 'center',
              height: '400px',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              <Activity size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontWeight: 500 }}>RCA Report Panel Idle</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '250px', marginTop: '0.25rem' }}>
                Select an asset on the left and click <strong>"Run Agentic Root Cause Analysis"</strong> to execute the fault isolation pipeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
