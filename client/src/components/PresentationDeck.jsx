import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Layers, GitFork, Cpu, ShieldCheck, TrendingUp, MonitorSmartphone } from 'lucide-react';

export default function PresentationDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeArchNode, setActiveArchNode] = useState(null);

  const slides = [
    {
      title: "Unified Asset & Operations Brain",
      subtitle: "AI for Industrial Knowledge Intelligence & Quality Engineering",
      bullets: [
        "Executive Summary: Solving industrial document fragmentation.",
        "Averages 35% time spent by operators searching for fragmented documentation.",
        "Indian plants run 7 to 12 disconnected document filesystems, creating huge safety and downtime risks.",
        "Antigravity Platform integrates SOPs, OEM manuals, regulatory compliance, and incident history into a single graph database.",
        "Empowers engineers with expert RAG and technicians with mobile RCAs in the field."
      ],
      icon: <Cpu size={48} style={{ color: 'var(--accent-cyan)' }} />
    },
    {
      title: "The Problem Context & Safety Risks",
      subtitle: "Why simple file folders fail asset-intensive Indian heavy industries",
      bullets: [
        "18% - 22% of unplanned downtime in Indian heavy industry is caused by fragmentation.",
        "Maintenance crews execute work orders without accessing full equipment histories, repeating past errors.",
        "The Knowledge Cliff: 25% of experienced operators and engineers will retire in the next decade.",
        "When they retire, decades of crucial plant-specific troubleshooting intelligence is lost forever.",
        "Need a digital 'brain' that continuously learns, links documentation, and retains knowledge."
      ],
      icon: <ShieldCheck size={48} style={{ color: 'var(--accent-red)' }} />
    },
    {
      title: "Key Core Platform Modules",
      subtitle: "End-to-End Knowledge Engineering Systems",
      bullets: [
        "Universal Ingestion Agent: Ingests forms, drawings, P&IDs, and SOPs, extracting tags and entity links using Gemini.",
        "Expert Knowledge Copilot: Hybrid RAG engine providing precise citations, confidence ratings, and source verification.",
        "RCA & Failure Intelligence: Matches work orders with telemetry logs, compiling Fishbone diagrams and CAPA schedules.",
        "Quality & Regulatory Compliance: Maps operations against PESO, OISD, and Factory Act guidelines, isolating gaps."
      ],
      icon: <Layers size={48} style={{ color: 'var(--accent-purple)' }} />
    },
    {
      title: "Business Impact & Scalability",
      subtitle: "Downtime Reduction and Institutional ROI",
      bullets: [
        "Downtime Reduction: Decreases unplanned plant stops by up to 20% by matching failure histories with corrective protocols.",
        "Faster Troubleshooting: Speeds search and query compile time compared to traditional manual folder reviews.",
        "Statutory Readiness: Reduces compliance prep time for PESO audits by auto-generating digital verification reports.",
        "Knowledge Continuity: Captures tribal operational notes, preserving engineer expertise inside a persistent graph."
      ],
      icon: <TrendingUp size={48} style={{ color: 'var(--accent-green)' }} />
    }
  ];

  const archNodes = [
    {
      id: 'sources',
      label: 'Heterogeneous Inputs',
      details: 'P&IDs, CAD drawings, Operating SOPs, OEM manuals, maintenance work orders, inspection reports, and safety audits.',
      x: 100, y: 150
    },
    {
      id: 'ingestion',
      label: 'OCR & Parsing Pipeline',
      details: 'Converts unstructured PDFs/scans into text. Dynamically extracts equipment tags (e.g. Boiler B-501) and system bounds.',
      x: 280, y: 150
    },
    {
      id: 'brain',
      label: 'Unified Asset Graph',
      details: 'Saves documents, logs, and organizations to index stores. Establishes linkages (e.g., Boiler -> Hydrotest -> PESO guideline).',
      x: 480, y: 150
    },
    {
      id: 'agents',
      label: 'Agentic AI Services',
      details: 'Includes Expert Copilot (RAG), Root Cause Diagnostics (Ishikawa matching), and Regulatory compliance mapping.',
      x: 680, y: 150
    },
    {
      id: 'clients',
      label: 'Operations Point-of-Need',
      details: 'Tailored responsive dashboards for DCS control room engineers and compact layouts optimized for mobile field technicians.',
      x: 680, y: 320
    }
  ];

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div>
      {/* Upper Half: Slide Presentation Deck */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div className="glass-card-title">
          <BookOpen size={20} className="logo-icon" />
          <span>Interactive Presentation & Business Strategy Deck</span>
        </div>

        <div className="deck-container">
          <div style={{ marginBottom: '1.5rem' }}>
            {slides[currentSlide].icon}
          </div>
          <div className="slide-content">
            <h2>{slides[currentSlide].title}</h2>
            <p style={{ color: 'var(--accent-cyan)', fontWeight: 500, fontSize: '1rem', marginTop: '-0.75rem', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>
              {slides[currentSlide].subtitle}
            </p>
            <ul className="slide-bullets" style={{ textAlign: 'left', maxWidth: '650px', margin: '0 auto' }}>
              {slides[currentSlide].bullets.map((bullet, idx) => (
                <li key={idx} style={{
                  marginBottom: '0.65rem',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                  listStyleType: 'square'
                }}>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="deck-controls">
            <button className="btn btn-secondary" onClick={prevSlide}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="slide-dots">
              {slides.map((_, idx) => (
                <span
                  key={idx}
                  className={`slide-dot ${currentSlide === idx ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                ></span>
              ))}
            </div>
            <button className="btn btn-secondary" onClick={nextSlide}>
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Lower Half: Interactive Architecture Diagram */}
      <div className="glass-card">
        <div className="glass-card-title">
          <Layers size={20} className="logo-icon" />
          <span>Interactive Solution Architecture & Data Flow</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
          Below is the data engineering flowchart for the platform. <strong>Click any pipeline node</strong> to inspect processing details, components, and data integrations:
        </p>

        <div className="grid-2">
          {/* SVG Diagram Viewport */}
          <div className="graph-viewport" style={{ height: '380px' }}>
            <svg width="100%" height="100%" viewBox="0 0 800 380">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)" />
                </marker>
              </defs>

              {/* Connecting lines */}
              <line x1="200" y1="150" x2="280" y2="150" stroke="var(--border-glass)" strokeWidth="2.5" markerEnd="url(#arrow)" />
              <line x1="380" y1="150" x2="480" y2="150" stroke="var(--border-glass)" strokeWidth="2.5" markerEnd="url(#arrow)" />
              <line x1="580" y1="150" x2="680" y2="150" stroke="var(--border-glass)" strokeWidth="2.5" markerEnd="url(#arrow)" />
              <line x1="680" y1="210" x2="680" y2="320" stroke="var(--border-glass)" strokeWidth="2.5" markerEnd="url(#arrow)" strokeDasharray="4 4" />
              
              {/* Nodes */}
              {archNodes.map((node) => {
                const isActive = activeArchNode?.id === node.id;
                
                return (
                  <g
                    key={node.id}
                    onClick={() => setActiveArchNode(node)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={node.x - 75}
                      y={node.y - 40}
                      width="150"
                      height="70"
                      rx="10"
                      fill={isActive ? 'rgba(0, 242, 254, 0.08)' : 'var(--bg-secondary)'}
                      stroke={isActive ? 'var(--accent-cyan)' : 'var(--border-glass)'}
                      strokeWidth={isActive ? '2.5' : '1.5'}
                      style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.3))' : 'none', transition: 'var(--transition-smooth)' }}
                    />
                    
                    <text
                      x={node.x}
                      y={node.y - 5}
                      textAnchor="middle"
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        fill: isActive ? 'var(--accent-cyan)' : 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {node.label.split(' ')[0]}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 12}
                      textAnchor="middle"
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        fill: isActive ? 'var(--accent-cyan)' : 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {node.label.split(' ').slice(1).join(' ')}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Flow Node Description Card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '1.5rem',
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px'
          }}>
            {activeArchNode ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <GitFork size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>{activeArchNode.label}</h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '1rem' }}>
                  {activeArchNode.details}
                </p>
                <div style={{
                  fontSize: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-secondary)'
                }}>
                  {activeArchNode.id === 'sources' && <span>Supports scanners, emails, regulatory PDF booklets, and drawing sheets.</span>}
                  {activeArchNode.id === 'ingestion' && <span>Uses LLMs to parse context structures and build schema properties automatically.</span>}
                  {activeArchNode.id === 'brain' && <span>Links SOP parameters directly to physical equipment metadata.</span>}
                  {activeArchNode.id === 'agents' && <span>Evaluates guidelines against equipment properties dynamically to flag compliance gaps.</span>}
                  {activeArchNode.id === 'clients' && <span>Responsive React components serving mobile technicians at the point of action.</span>}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <MonitorSmartphone size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                <p style={{ fontWeight: 500 }}>Select Architecture Stage</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0.25rem auto 0 auto' }}>
                  Click on any stage in the flow chart diagram on the left to see its underlying data pipelines.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
