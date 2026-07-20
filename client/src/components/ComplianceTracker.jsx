import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckSquare, Square, FileCheck, ArrowRightLeft, FileDown, AlertTriangle } from 'lucide-react';

export default function ComplianceTracker({ backendUrl }) {
  const [standards, setStandards] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [auditReport, setAuditReport] = useState(null);

  const fetchCompliance = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/compliance`);
      const data = await res.json();
      setStandards(data);
    } catch (err) {
      console.error("Error fetching compliance data:", err);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, [backendUrl]);

  const handleCheckboxToggle = async (standardId, chkIdx, currentChecked) => {
    try {
      const res = await fetch(`${backendUrl}/api/compliance/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          standardId,
          checklistIndex: chkIdx,
          checked: !currentChecked
        })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local state
        fetchCompliance();
      }
    } catch (err) {
      console.error("Error toggling checklist item:", err);
    }
  };

  const generateAuditPackage = () => {
    setGeneratingReport(true);
    setAuditReport(null);
    
    setTimeout(() => {
      setAuditReport({
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        auditorName: "Antigravity Compliance Agent",
        complianceIndex: (standards.filter(s => s.status === 'Compliant').length / standards.length * 100).toFixed(1),
        records: standards.map(s => ({
          id: s.standard_id,
          authority: s.authority,
          asset: s.associated_equipment,
          status: s.status,
          evidence: s.audit_evidence,
          gaps: s.gaps
        }))
      });
      setGeneratingReport(false);
    }, 1500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Compliant': return 'var(--accent-green)';
      case 'Non-Compliant': return 'var(--accent-red)';
      default: return 'var(--accent-amber)';
    }
  };

  return (
    <div className="grid-2">
      {/* Left Column: Compliance Checklist Mappings */}
      <div>
        <div className="glass-card">
          <div className="glass-card-title">
            <ShieldCheck size={20} className="logo-icon" />
            <span>Statutory Compliance Checklists (Factory Act / PESO / OISD)</span>
          </div>
          
          <div className="compliance-list">
            {standards.map((standard) => (
              <div
                key={standard.standard_id}
                className={`glass-card compliance-card ${standard.status}`}
                style={{ padding: '1.25rem', marginBottom: '0.75rem' }}
              >
                <div className="compliance-header">
                  <div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: getStatusColor(standard.status),
                      marginRight: '0.5rem'
                    }}>
                      [{standard.authority}]
                    </span>
                    <strong style={{ fontSize: '0.95rem' }}>{standard.standard_id}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Associated Asset: <strong>{standard.associated_equipment}</strong>
                    </div>
                  </div>
                  <span className={`compliance-badge ${standard.status}`}>
                    {standard.status}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.75rem 0', lineHeight: '1.4' }}>
                  {standard.description}
                </p>

                {/* Audit Evidence Field */}
                <div style={{
                  fontSize: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-glass)',
                  marginBottom: '0.75rem',
                  color: 'var(--text-secondary)'
                }}>
                  <strong>Audit Evidence:</strong> {standard.audit_evidence}
                </div>

                {/* Gap Warning if Non-Compliant */}
                {standard.status === 'Non-Compliant' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--accent-red)',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(239, 68, 68, 0.1)',
                    marginBottom: '0.75rem'
                  }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span><strong>Compliance Gap:</strong> {standard.gaps}</span>
                  </div>
                )}

                {/* Interactive Checklist Items */}
                <div className="checklist-items">
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>
                    Safety Checklist Progress
                  </span>
                  {standard.checklist.map((item, chkIdx) => (
                    <label key={chkIdx} className="checklist-row" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleCheckboxToggle(standard.standard_id, chkIdx, item.checked)}
                      />
                      <span style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {item.item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Evidence Package Auto-Generator */}
      <div>
        <div className="glass-card">
          <div className="glass-card-title">
            <FileCheck size={20} className="logo-icon" />
            <span>Auditing & Quality Evidence Package</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
            Enables compliance officers to compile statutory records instantly, demonstrating plant safety checks for external inspectors.
          </p>

          <button
            onClick={generateAuditPackage}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={generatingReport}
          >
            <FileDown size={16} />
            {generatingReport ? 'Compiling Evidentiary PDF Package...' : 'Generate Compliance Evidence Package'}
          </button>

          {auditReport && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              backgroundColor: '#fff',
              color: '#111827',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontFamily: 'Georgia, serif',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
            }}>
              {/* Report Header */}
              <div style={{ borderBottom: '2px solid #111827', paddingBottom: '0.75rem', marginBottom: '1rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                  Statutory Audit Compliance Certificate
                </h3>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#4b5563', marginTop: '0.25rem' }}>
                  System Timestamp: {auditReport.timestamp} | Compiled By: {auditReport.auditorName}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.8rem', fontFamily: 'sans-serif' }}>
                <div>Total Audited Regulations: <strong>{auditReport.records.length}</strong></div>
                <div>Compliance Index Rating: <strong style={{ color: parseFloat(auditReport.complianceIndex) >= 100 ? '#047857' : '#b45309' }}>{auditReport.complianceIndex}%</strong></div>
              </div>

              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', fontFamily: 'sans-serif', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #111827' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Standard ID</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Asset</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Inspection Evidence Document</th>
                  </tr>
                </thead>
                <tbody>
                  {auditReport.records.map((rec, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.5rem' }}>{rec.id} ({rec.authority})</td>
                      <td style={{ padding: '0.5rem' }}>{rec.asset}</td>
                      <td style={{ padding: '0.5rem', color: rec.status === 'Compliant' ? '#047857' : (rec.status === 'Non-Compliant' ? '#b91c1c' : '#b45309'), fontWeight: 'bold' }}>
                        {rec.status}
                      </td>
                      <td style={{ padding: '0.5rem', fontStyle: 'italic' }}>{rec.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem', fontSize: '0.65rem', fontFamily: 'monospace', color: '#4b5563' }}>
                <div>Regulatory Authority: Petroleum & Explosives Safety Organization (PESO) / OISD</div>
                <div style={{ textDecoration: 'underline' }}>Authorized System Signature</div>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card">
          <div className="glass-card-title">
            <ArrowRightLeft size={18} className="logo-icon" />
            <span>Continuous Quality Gaps</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            <p style={{ marginBottom: '0.75rem' }}>
              The regulatory agent cross-references active operations limits and physical asset configurations to isolate compliance vulnerabilities:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {standards.filter(s => s.status !== 'Compliant').map((s, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.1)',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '0.2rem' }}>
                    <span>{s.standard_id} ({s.associated_equipment})</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>{s.status}</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.gaps}</span>
                </div>
              ))}
              {standards.every(s => s.status === 'Compliant') && (
                <div style={{ color: 'var(--accent-green)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No active safety gaps! Plant compliance index is at 100%.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
