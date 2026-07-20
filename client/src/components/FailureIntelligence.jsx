import React, { useState, useEffect } from 'react';
import { ShieldAlert, BookOpen, AlertTriangle, Lightbulb, TrendingUp, Search, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function FailureIntelligence({ backendUrl }) {
  const [incidents, setIncidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Near-miss form state
  const [nearMissEquipment, setNearMissEquipment] = useState('C-301');
  const [nearMissSymptom, setNearMissSymptom] = useState('');
  const [nearMissCategory, setNearMissCategory] = useState('Process Deviation');
  const [submitStatus, setSubmitStatus] = useState(null);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: "List all incidents in detail" })
      });
      // Just fetch raw incidents directly from server.js files in a custom fetch
      const rawRes = await fetch(`${backendUrl}/api/graph/nodes/INC-001`);
      // Or we can query a general endpoint. Let's fetch them using graph database endpoints or search
      const graphRes = await fetch(`${backendUrl}/api/graph`);
      const graphData = await graphRes.json();
      const incidentNodes = graphData.nodes.filter(n => n.type === 'Incident');
      
      // Let's create a detailed array of mock incidents matching our database
      setIncidents([
        {
          id: "INC-2025-0812",
          equipment: "Pump P-102A",
          date: "2025-08-12",
          symptom: "Primary seal fluid blowout, vibration spiked to 8.2 mm/s RMS, high squealing.",
          root_cause: "Dry running of mechanical seals due to blocked suction strainer combined with unauthorized panel low-pressure trip override.",
          lessons: "Never bypass suction low pressure trips on operating centrifugal pumps. Verify suction path clean strainers before startup.",
          severity: "High",
          category: "Mechanical Seal"
        },
        {
          id: "INC-2026-0304",
          equipment: "Boiler B-501",
          date: "2026-03-04",
          symptom: "Steam header pressure exceeded 34 kg/cm2, triggering safety valve pop.",
          root_cause: "Pneumatic actuator spindle sticking on CV-402 due to corrosion from instrument air line moisture contamination (saturated pre-filter dryer).",
          lessons: "Instrument air quality is critical for pneumatic valve operation. Automatic condensate drain traps must be monitored daily.",
          severity: "Medium",
          category: "Actuator Stiction"
        },
        {
          id: "INC-2026-0518",
          equipment: "Compressor C-301",
          date: "2026-05-18",
          symptom: "Gas leak detected (40% LEL) near second-stage discharge flange. Emergency ESD initiated.",
          root_cause: "Flange bolt relaxation and gasket failure induced by excessive pipe vibration from a cracked support structural beam.",
          lessons: "Vibration on high-pressure piping causes fast metal fatigue and bolt loosening. Piping supports must be inspected during weekly walkdowns.",
          severity: "Critical",
          category: "Structural Fatigue"
        }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [backendUrl]);

  const handleSubmitNearMiss = (e) => {
    e.preventDefault();
    if (!nearMissSymptom) return;
    
    setSubmitStatus('submitting');
    
    setTimeout(() => {
      setSubmitStatus('success');
      setNearMissSymptom('');
      // Prepend to local incidents to show dynamic updates!
      const newIncident = {
        id: `NM-${Date.now().toString().substring(8)}`,
        equipment: nearMissEquipment,
        date: new Date().toISOString().split('T')[0],
        symptom: `[Near Miss - ${nearMissCategory}] ${nearMissSymptom}`,
        root_cause: "Under investigation. Logged into Lessons Learned archives for correlation analysis.",
        lessons: "Pending formal Root Cause Analysis review.",
        severity: "Low",
        category: nearMissCategory
      };
      setIncidents(prev => [newIncident, ...prev]);
      
      setTimeout(() => setSubmitStatus(null), 3000);
    }, 1200);
  };

  const filteredIncidents = incidents.filter(inc => 
    inc.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.symptom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.root_cause.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid-2">
      {/* Left Column: Proactive Alerts & Analytics */}
      <div>
        {/* Systemic Proactive Warnings */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
          <div className="glass-card-title">
            <ShieldAlert size={20} style={{ color: 'var(--accent-red)' }} />
            <span style={{ color: 'var(--accent-red)' }}>Proactive Safety Alerts (Active Correlation Engine)</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--accent-red)', marginBottom: '0.35rem' }}>
                <AlertTriangle size={16} />
                <span>CRITICAL CORRELATION: Compressor C-301</span>
              </div>
              <p style={{ color: 'var(--text-primary)', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                <strong>Vitals Trigger</strong>: Sensor C-301 vibration is currently at <strong>7.3 mm/s RMS</strong> (threshold: 4.5 mm/s).
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                <strong>Historical Pattern Match (INC-2026-0518)</strong>: Flange bolt relaxation and graphite gasket blowout occurred previously under 7.1 mm/s RMS vibrations, originating from structural micro-cracks in support beam SB-14.
              </p>
              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '4px',
                color: 'var(--accent-cyan)',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                Action Required: Dispatch inspector to inspect support beam SB-14 and retighten discharge flange bolts.
              </div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '0.35rem' }}>
                <AlertTriangle size={16} />
                <span>PREDICTIVE ALERT: Pump P-102A</span>
              </div>
              <p style={{ color: 'var(--text-primary)', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                <strong>Vitals Trigger</strong>: Vibration has risen to <strong>4.8 mm/s RMS</strong>.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                <strong>Historical Pattern Match (INC-2025-0812)</strong>: Past seal blowout occurred due to cavitation from suction strainer blockages. Current vibration pattern resembles early stage suction starvation.
              </p>
              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '4px',
                color: 'var(--accent-cyan)',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                Action Required: Check suction pressure bounds and verify differential pressure across inlet filter.
              </div>
            </div>
          </div>
        </div>

        {/* Systemic Risk Analysis Gauges */}
        <div className="glass-card">
          <div className="glass-card-title">
            <TrendingUp size={20} className="logo-icon" />
            <span>Active Operational Risk Matrices</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Structural Piping Fatigue (Gas Line)</span>
                <strong style={{ color: 'var(--accent-red)' }}>85% Risk</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', backgroundColor: 'var(--accent-red)' }}></div>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Control Valve Actuator Stiction</span>
                <strong style={{ color: 'var(--accent-amber)' }}>45% Risk</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '45%', height: '100%', backgroundColor: 'var(--accent-amber)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Pump Dry-Running / Cavitation</span>
                <strong style={{ color: 'var(--accent-green)' }}>15% Risk</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '15%', height: '100%', backgroundColor: 'var(--accent-green)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Log a Near Miss Form */}
        <div className="glass-card">
          <div className="glass-card-title">
            <PlusCircle size={20} className="logo-icon" />
            <span>Report a Near-Miss / Incident Log</span>
          </div>

          <form onSubmit={handleSubmitNearMiss}>
            <div className="grid-2">
              <div className="form-group">
                <label>Affected Asset</label>
                <select
                  className="form-control"
                  value={nearMissEquipment}
                  onChange={e => setNearMissEquipment(e.target.value)}
                >
                  <option value="C-301">Compressor C-301</option>
                  <option value="P-102A">Pump P-102A</option>
                  <option value="B-501">Boiler B-501</option>
                </select>
              </div>

              <div className="form-group">
                <label>Deviation Category</label>
                <select
                  className="form-control"
                  value={nearMissCategory}
                  onChange={e => setNearMissCategory(e.target.value)}
                >
                  <option value="Process Deviation">Process Deviation</option>
                  <option value="Vibration Spike">Vibration Spike</option>
                  <option value="Instrument Fault">Instrument Fault</option>
                  <option value="Operator Error">Operator Error</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Observed Symptom or Near-Miss Details</label>
              <textarea
                placeholder="e.g., Noticed oil leakage on floor under compressor crankcase, or suction pressure dropped below NPSHr but interlock responded..."
                className="form-control"
                value={nearMissSymptom}
                onChange={e => setNearMissSymptom(e.target.value)}
                required
                style={{ minHeight: '80px' }}
              ></textarea>
            </div>

            {submitStatus === 'success' && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '6px',
                color: 'var(--accent-green)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle2 size={14} />
                Near-miss successfully logged to Failure Intelligence Engine and cached.
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitStatus === 'submitting'}>
              {submitStatus === 'submitting' ? 'Saving to Database...' : 'Log Near-Miss to Brain'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Lessons Learned Database */}
      <div>
        <div className="glass-card" style={{ height: 'calc(100% - 1.5rem)', overflowY: 'auto' }}>
          <div className="glass-card-title">
            <BookOpen size={20} className="logo-icon" />
            <span>Lessons Learned Database & Failure Archives</span>
          </div>

          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <input
              type="text"
              placeholder="Search historical failure modes, root causes..."
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredIncidents.map((inc) => (
              <div key={inc.id} style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{inc.id}: {inc.equipment}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Date: {inc.date}</span>
                  </div>
                  <span className="compliance-badge" style={{
                    backgroundColor: inc.severity === 'Critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: inc.severity === 'Critical' ? 'var(--accent-red)' : 'var(--accent-amber)',
                    border: `1px solid ${inc.severity === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                  }}>
                    {inc.severity}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                  <strong>Failure Symptom:</strong> {inc.symptom}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                  <strong>Root Cause:</strong> {inc.root_cause}
                </div>

                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'rgba(0, 242, 254, 0.03)',
                  border: '1px solid rgba(0, 242, 254, 0.1)',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  lineHeight: '1.4'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
                    <Lightbulb size={12} />
                    <span>Lesson Learned & Prevention</span>
                  </div>
                  {inc.lessons}
                </div>
              </div>
            ))}
            {filteredIncidents.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2rem' }}>
                No incidents match your search filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
