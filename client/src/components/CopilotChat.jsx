import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, Link, HelpCircle, Gauge } from 'lucide-react';

export default function CopilotChat({ backendUrl, selectedNodeId }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! I am your Industrial Expert Knowledge Copilot. I can search across P&IDs, OEM manuals, maintenance logs, and regulatory compliance policies (OISD, PESO, Factory Act). How can I assist you today?",
      confidence: null,
      citations: []
    }
  ]);
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Suggested preset questions
  const suggestions = [
    { label: "Boiler B-501 Startup SOP", text: "How do I safely start up Boiler B-501?" },
    { label: "Pump P-102A Maintenance", text: "What is the maintenance routine and oil type for Pump P-102A?" },
    { label: "OISD Spacing for C-301", text: "What is the OISD safety clearance distance for gas compressors?" },
    { label: "Boiler Pressure Audits", text: "What is the next hydrostatic test date and certificate details for Boiler B-501?" }
  ];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Hook up context selection from graph visualizer
  useEffect(() => {
    if (selectedNodeId) {
      setQueryInput(`Show details, procedures, and safety rules for ${selectedNodeId}`);
    }
  }, [selectedNodeId]);

  const handleSend = async (textToSend) => {
    const query = textToSend || queryInput;
    if (!query.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setQueryInput('');
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: data.answer,
        confidence: data.confidence,
        citations: data.citations || []
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: "Error: I encountered a connection issue with the RAG pipeline server. Please check that the server is running.",
        confidence: 0,
        citations: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceClass = (score) => {
    if (!score) return '';
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  };

  return (
    <div className="grid-2">
      {/* Left Column: Conversational AI Window */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>
        <div className="glass-card-title" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignSelf: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} className="logo-icon" />
            <span>Expert Knowledge Copilot (RAG)</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Powered by Gemini 2.5 Flash</span>
        </div>

        {/* Chat History */}
        <div className="chat-history">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.sender}`}>
              <div className="message-avatar">
                {msg.sender === 'user' ? 'ME' : 'AI'}
              </div>
              <div className="message-bubble">
                {/* Format paragraphs/newlines */}
                {msg.text.split('\n\n').map((para, pIdx) => (
                  <p key={pIdx} style={{ marginBottom: pIdx < msg.text.split('\n\n').length - 1 ? '0.75rem' : '0' }}>
                    {para.split('\n').map((line, lIdx) => (
                      <span key={lIdx} style={{ display: 'block' }}>
                        {line}
                      </span>
                    ))}
                  </p>
                ))}

                {/* Score and Citations for AI answers */}
                {msg.sender === 'assistant' && msg.confidence !== null && (
                  <div className="citations-box">
                    {/* Confidence Meter */}
                    <div className="confidence-indicator" style={{ marginRight: 'auto' }}>
                      <Gauge size={12} />
                      <span>Match Confidence: {(msg.confidence * 100).toFixed(0)}%</span>
                      <div className="confidence-bar-outer">
                        <div
                          className={`confidence-bar-inner ${getConfidenceClass(msg.confidence)}`}
                          style={{ width: `${msg.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Source Citations */}
                    {msg.citations.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Citations:</span>
                        {msg.citations.map((cite, cIdx) => (
                          <span
                            key={cIdx}
                            className="citation-chip"
                            title={`Category: ${cite.category} | Source: ${cite.source}`}
                          >
                            <Link size={10} />
                            {cite.title.split(':')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="message-avatar">AI</div>
              <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                <div className="status-dot" style={{ animation: 'pulse 1s infinite' }}></div>
                Querying heterogeneous corpus & compiling answer...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="chat-input-area"
        >
          <input
            type="text"
            className="form-control"
            placeholder="Type standard questions about Boiler startup, Pump lubrication, and gas clearances..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !queryInput.trim()}>
            <Send size={16} />
            <span>Ask</span>
          </button>
        </form>
      </div>

      {/* Right Column: Preset Prompts and Document References */}
      <div>
        <div className="glass-card">
          <div className="glass-card-title">
            <HelpCircle size={20} className="logo-icon" />
            <span>Domain Expert Query Presets</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
            Click one of the benchmark operational and compliance questions below to run a direct search through the vector-seeded RAG database:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                className="btn btn-secondary"
                style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '0.85rem' }}
                onClick={() => handleSend(sug.text)}
                disabled={loading}
              >
                <Sparkles size={14} style={{ color: 'var(--accent-cyan)', marginRight: '0.5rem', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{sug.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sug.text}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <div className="glass-card-title">
            <AlertCircle size={20} className="logo-icon" />
            <span>Copilot RAG Context Strategy</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            <p style={{ marginBottom: '0.75rem' }}>
              The platform executes **Hybrid Retrieval** across the plant's index database:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Scanned SOP / Manual OCR Ingestion</strong>: Extract text blocks and map references to Equipment Tags.</li>
              <li><strong>Ontology Boosting</strong>: Query paths through the knowledge graph to fetch related regulations (e.g. OISD standards) and failure records.</li>
              <li><strong>RAG Synthesis</strong>: Feeds structured context into the Gemini model, forcing safety citations and confidence metric scoring.</li>
            </ul>
            <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(0, 242, 254, 0.03)', border: '1px solid rgba(0, 242, 254, 0.08)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
              Tip: Click on a node in the <strong>Knowledge Graph</strong> to automatically load its context directly into the Copilot search input!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
