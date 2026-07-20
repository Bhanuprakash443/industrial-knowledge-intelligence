import React, { useState, useEffect } from 'react';
import { Network, Upload, FileText, Search, Database, HardDrive, ShieldAlert, Users, Info, Plus } from 'lucide-react';

export default function GraphVisualizer({ backendUrl, onNodeSelect, onDocumentIngested }) {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [filteredNodes, setFilteredNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  // Ingestion form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Operating SOP');
  const [uploadEquipment, setUploadEquipment] = useState('');
  const [uploadText, setUploadText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  // Zoom / Pan / Drag States
  const [draggedNode, setDraggedNode] = useState(null);
  const [nodeOffsets, setNodeOffsets] = useState({});
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
  };

  const handleSvgMouseMove = (e) => {
    if (draggedNode) {
      const dx = e.movementX / zoom;
      const dy = e.movementY / zoom;
      setNodeOffsets(prev => {
        const curr = prev[draggedNode] || { x: 0, y: 0 };
        return {
          ...prev,
          [draggedNode]: { x: curr.x + dx, y: curr.y + dy }
        };
      });
    } else if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleSvgMouseUp = () => {
    setDraggedNode(null);
    setIsPanning(false);
  };

  const handleSvgMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'rect') {
      setIsPanning(true);
    }
  };

  const handleWheel = (e) => {
    // Delta checking
    const zoomFactor = 1.05;
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev * zoomFactor, 3));
    } else {
      setZoom(prev => Math.max(prev / zoomFactor, 0.5));
    }
  };

  const resetZoomPan = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setNodeOffsets({});
  };

  // Fetch graph data
  const fetchGraph = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/graph`);
      const data = await res.json();
      setGraphData(data);
    } catch (err) {
      console.error('Error fetching graph data:', err);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [backendUrl]);

  // Handle search and filtering
  useEffect(() => {
    let result = graphData.nodes;
    
    if (searchTerm) {
      result = result.filter(n => 
        n.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        n.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'All') {
      result = result.filter(n => n.type === filterType);
    }
    
    setFilteredNodes(result);
  }, [searchTerm, filterType, graphData]);

  // Handle node selection details
  const handleNodeClick = async (nodeId) => {
    setSelectedNode(nodeId);
    if (onNodeSelect) onNodeSelect(nodeId); // Propagate to parent if needed
    
    try {
      const res = await fetch(`${backendUrl}/api/graph/nodes/${nodeId}`);
      const data = await res.json();
      setSelectedNodeDetails(data);
    } catch (err) {
      console.error('Error fetching node details:', err);
    }
  };

  // Pre-calculated layout positions based on node types for absolute clarity
  // Arranged in clear functional columns: Regulations/Orgs (Top), Documents (Left), Equipment (Center), Incidents (Right)
  const getNodeCoordinates = (node, index, total) => {
    const radius = 180;
    const centerX = 400;
    const centerY = 240;
    
    switch (node.type) {
      case 'Regulation':
      case 'Organization':
        // Top row
        return {
          x: 150 + (index * 120),
          y: 70
        };
      case 'Document':
        // Left Column
        return {
          x: 120,
          y: 120 + (index * 60)
        };
      case 'Equipment':
        // Center Column/Circle
        const eqIdx = graphData.nodes.filter(n => n.type === 'Equipment').indexOf(node);
        const eqCount = graphData.nodes.filter(n => n.type === 'Equipment').length;
        const angle = (eqIdx / eqCount) * 2 * Math.PI - Math.PI / 2;
        return {
          x: centerX + Math.cos(angle) * 110,
          y: centerY + Math.sin(angle) * 110
        };
      case 'Incident':
        // Right Column
        const incIdx = graphData.nodes.filter(n => n.type === 'Incident').indexOf(node);
        return {
          x: 680,
          y: 140 + (incIdx * 100)
        };
      default:
        return {
          x: centerX,
          y: centerY
        };
    }
  };

  // Node styles based on Type
  const getNodeColor = (type) => {
    switch (type) {
      case 'Equipment': return '#00f2fe';   // Cyan
      case 'Document': return '#8b5cf6';    // Purple
      case 'Regulation': return '#f59e0b';  // Amber
      case 'Organization': return '#10b981'; // Green
      case 'Incident': return '#ef4444';    // Red
      default: return '#9ca3af';
    }
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'Equipment': return <HardDrive size={16} />;
      case 'Document': return <FileText size={16} />;
      case 'Regulation': return <Database size={16} />;
      case 'Organization': return <Users size={16} />;
      case 'Incident': return <ShieldAlert size={16} />;
      default: return <Info size={16} />;
    }
  };

  // Ingestion submission handler
  const handleIngestionSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitle || !uploadText) return;
    
    setUploading(true);
    setUploadMessage(null);
    
    try {
      const res = await fetch(`${backendUrl}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle,
          category: uploadCategory,
          equipmentTags: uploadEquipment,
          manualText: uploadText
        })
      });
      
      const result = await res.json();
      if (res.ok) {
        setUploadMessage({ type: 'success', text: result.message });
        setUploadTitle('');
        setUploadEquipment('');
        setUploadText('');
        fetchGraph(); // Refresh the graph representation!
        if (onDocumentIngested) onDocumentIngested(result.document);
      } else {
        setUploadMessage({ type: 'error', text: result.error || 'Failed to ingest document.' });
      }
    } catch (err) {
      setUploadMessage({ type: 'error', text: 'Server connection error. Please verify the backend status.' });
    } finally {
      setUploading(false);
    }
  };

  // Map nodes to coordinates
  const nodesWithCoords = graphData.nodes.map((node, idx) => {
    const coords = getNodeCoordinates(node, idx, graphData.nodes.length);
    const offset = nodeOffsets[node.id] || { x: 0, y: 0 };
    return { ...node, x: coords.x + offset.x, y: coords.y + offset.y };
  });

  return (
    <div className="grid-2">
      {/* Left Column: Interactive Graph and Ingestion */}
      <div>
        <div className="glass-card">
          <div className="glass-card-title">
            <Network size={20} className="logo-icon" />
            <span>Unified Asset & Procedure Knowledge Graph</span>
          </div>
          
          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ flexGrow: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search tags, procedures, documents..."
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            
            <select
              className="form-control"
              style={{ width: '150px' }}
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Equipment">Equipment</option>
              <option value="Document">Documents</option>
              <option value="Regulation">Regulations</option>
              <option value="Incident">Incidents</option>
            </select>
          </div>

          {/* SVG Graph Port */}
          <div className="graph-viewport" style={{ position: 'relative' }}>
            <button 
              onClick={resetZoomPan}
              className="btn btn-secondary" 
              style={{ position: 'absolute', top: '10px', right: '10px', padding: '0.35rem 0.6rem', fontSize: '0.75rem', zIndex: 10 }}
            >
              Reset Layout
            </button>
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 800 480"
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
              onMouseDown={handleSvgMouseDown}
              onWheel={handleWheel}
              style={{ cursor: isPanning ? 'grabbing' : (draggedNode ? 'grabbing' : 'grab') }}
            >
              <defs>
                <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="50%" stopColor="rgba(0, 242, 254, 0.2)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                </linearGradient>
              </defs>
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              
              {/* Draw Edges */}
              {graphData.edges.map((edge) => {
                const sourceNode = nodesWithCoords.find(n => n.id === edge.source);
                const targetNode = nodesWithCoords.find(n => n.id === edge.target);
                
                if (!sourceNode || !targetNode) return null;
                
                return (
                  <g key={edge.id}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke="url(#edgeGradient)"
                      strokeWidth="1.5"
                      className="graph-edge"
                    />
                    {/* Tiny relationship label text in the middle */}
                    <text
                      x={(sourceNode.x + targetNode.x) / 2}
                      y={(sourceNode.y + targetNode.y) / 2 - 4}
                      textAnchor="middle"
                      style={{ fontSize: '8px', fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}
              
              {/* Draw Nodes */}
              {nodesWithCoords.map((node) => {
                const isSelected = selectedNode === node.id;
                const isMatchingFilter = filteredNodes.some(fn => fn.id === node.id);
                
                return (
                  <g
                    key={node.id}
                    className={`graph-node ${isSelected ? 'active' : ''}`}
                    onClick={() => handleNodeClick(node.id)}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    opacity={isMatchingFilter ? 1 : 0.25}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.type === 'Equipment' ? 24 : 18}
                      fill="var(--bg-secondary)"
                      stroke={getNodeColor(node.type)}
                      strokeWidth={isSelected ? 3 : 2}
                      style={{ filter: isSelected ? `drop-shadow(0 0 8px ${getNodeColor(node.type)})` : 'none' }}
                    />
                    
                    {/* Label */}
                    <text
                      x={node.x}
                      y={node.y + (node.type === 'Equipment' ? 38 : 30)}
                      textAnchor="middle"
                    >
                      {node.label}
                    </text>
                    
                    {/* Draw little symbol icon inside */}
                    <g transform={`translate(${node.x - 7}, ${node.y - 7})`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={getNodeColor(node.type)} strokeWidth="2.5">
                        {node.type === 'Equipment' && <circle cx="12" cy="12" r="10" />}
                        {node.type === 'Equipment' && <path d="M12 2v20M2 12h20" />}
                        {node.type === 'Document' && <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />}
                        {node.type === 'Document' && <polyline points="14 2 14 8 20 8" />}
                        {node.type === 'Incident' && <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />}
                        {node.type === 'Incident' && <line x1="12" y1="9" x2="12" y2="13" />}
                        {node.type === 'Incident' && <line x1="12" y1="17" x2="12.01" y2="17" />}
                        {node.type !== 'Equipment' && node.type !== 'Document' && node.type !== 'Incident' && <polygon points="12 2 2 7 12 12 22 7 12 2" />}
                        {node.type !== 'Equipment' && node.type !== 'Document' && node.type !== 'Incident' && <polyline points="2 17 12 22 22 17" />}
                      </svg>
                    </g>
                  </g>
                );
              })}
              </g>
            </svg>
            
            {/* Legend */}
            <div className="graph-legend">
              <div className="legend-item">
                <span className="legend-color equipment"></span>
                <span>Asset/Equipment</span>
              </div>
              <div className="legend-item">
                <span className="legend-color document"></span>
                <span>Document/SOP</span>
              </div>
              <div className="legend-item">
                <span className="legend-color regulation"></span>
                <span>Regulation</span>
              </div>
              <div className="legend-item">
                <span className="legend-color incident"></span>
                <span>Incident/Failure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Ingestion Card */}
        <div className="glass-card">
          <div className="glass-card-title">
            <Upload size={20} className="logo-icon" />
            <span>Universal Document Ingestion Pipeline</span>
          </div>
          
          <form onSubmit={handleIngestionSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label>Document Title</label>
                <input
                  type="text"
                  placeholder="e.g., Boiler Emergency Procedures, Pump Layout Spec"
                  className="form-control"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-control"
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value)}
                >
                  <option value="Standard Operating Procedure (SOP)">Standard Operating Procedure (SOP)</option>
                  <option value="OEM Operating Manual">OEM Operating Manual</option>
                  <option value="Inspection Report">Inspection Report</option>
                  <option value="Regulatory Guideline">Regulatory Guideline</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Associated Equipment Tags (comma separated)</label>
              <input
                type="text"
                placeholder="e.g., Boiler B-501, Pump P-102A"
                className="form-control"
                value={uploadEquipment}
                onChange={e => setUploadEquipment(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Document / Manual Content (Paste plain text, P&ID metadata, or incident report)</label>
              <textarea
                placeholder="Paste operating limits, vibration thresholds, safety precautions here..."
                className="form-control"
                value={uploadText}
                onChange={e => setUploadText(e.target.value)}
                required
              ></textarea>
            </div>
            
            {uploadMessage && (
              <div style={{
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                backgroundColor: uploadMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${uploadMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: uploadMessage.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'
              }}>
                {uploadMessage.text}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={uploading}>
              <Plus size={16} />
              {uploading ? 'Processing & Extracting Entities...' : 'Ingest & Build Graph'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Node Details & Linkages Panel */}
      <div>
        <div className="glass-card" style={{ height: 'calc(100% - 1.5rem)', overflowY: 'auto' }}>
          <div className="glass-card-title">
            <Info size={20} className="logo-icon" />
            <span>Entity Intelligence Dashboard</span>
          </div>

          {selectedNodeDetails ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{
                  padding: '0.65rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${getNodeColor(selectedNodeDetails.node.type)}`
                }}>
                  {getNodeIcon(selectedNodeDetails.node.type)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{selectedNodeDetails.node.label}</h3>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: getNodeColor(selectedNodeDetails.node.type), fontWeight: 600 }}>
                    {selectedNodeDetails.node.type}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Description & Scope</label>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)'
                }}>
                  {selectedNodeDetails.node.details}
                </div>
              </div>

              {/* Ontology Connections */}
              <div className="form-group">
                <label>Knowledge Graph Linkages ({selectedNodeDetails.connections.length})</label>
                {selectedNodeDetails.connections.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedNodeDetails.connections.map((conn, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleNodeClick(conn.node.id)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.6rem 0.85rem',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: getNodeColor(conn.node.type)
                          }}></span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{conn.node.label}</span>
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0, 242, 254, 0.08)',
                          color: 'var(--accent-cyan)',
                          border: '1px solid rgba(0, 242, 254, 0.1)'
                        }}>
                          {conn.relationship}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No connections in current slice.</div>
                )}
              </div>

              {/* Associated Documents */}
              <div className="form-group">
                <label>Associated Documents & Records ({selectedNodeDetails.associatedDocuments.length})</label>
                {selectedNodeDetails.associatedDocuments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedNodeDetails.associatedDocuments.map((doc, idx) => (
                      <div key={idx} style={{
                        padding: '0.75rem',
                        backgroundColor: 'rgba(139, 92, 246, 0.03)',
                        border: '1px solid rgba(139, 92, 246, 0.1)',
                        borderRadius: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c084fc' }}>{doc.title}</h4>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.last_updated}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {doc.content.substring(0, 150)}...
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No indexed operational documentation.</div>
                )}
              </div>

              {/* Associated Incidents */}
              <div className="form-group">
                <label>Active/Historical Failure History ({selectedNodeDetails.associatedIncidents.length})</label>
                {selectedNodeDetails.associatedIncidents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedNodeDetails.associatedIncidents.map((inc, idx) => (
                      <div key={idx} style={{
                        padding: '0.75rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.03)',
                        border: '1px solid rgba(239, 68, 68, 0.1)',
                        borderRadius: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-red)' }}>{inc.id} ({inc.date})</h4>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '0.4rem' }}>
                          <strong>Symptom:</strong> {inc.symptom}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          <strong>Root Cause:</strong> {inc.root_cause}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No logged failures for this equipment.</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              <Network size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontWeight: 500 }}>Select a node in the Knowledge Graph</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '250px', marginTop: '0.25rem' }}>
                Click on any tag or document to load its structural linkages and related failure records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
