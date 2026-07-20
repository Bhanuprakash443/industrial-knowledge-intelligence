const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Set up file upload destination
const upload = multer({ dest: path.join(__dirname, 'uploads/') });
if (!fs.existsSync(path.join(__dirname, 'uploads/'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads/'));
}

// Data directory path
const DATA_DIR = path.join(__dirname, 'data');

// Helper to read JSON data safely
function readDataFile(filename, defaultData = []) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
      }
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultData;
  }
}

// Helper to write JSON data safely
function writeDataFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    return false;
  }
}

// Ensure database files are pre-seeded or exist
const getDocuments = () => readDataFile('documents.json');
const getGraph = () => readDataFile('graph.json', { nodes: [], edges: [] });
const getIncidents = () => readDataFile('incidents.json');
const getCompliance = () => readDataFile('compliance.json');

app.get('/api/status', (req, res) => {
  res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY,
    mode: process.env.GEMINI_API_KEY ? 'Live Gemini Engine' : 'Simulation Engine'
  });
});


// --- Gemini AI Wrapper ---
async function callGemini(prompt, systemInstruction = "") {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  
  try {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let combinedPrompt = prompt;
    if (systemInstruction) {
      combinedPrompt = `[System Instruction: ${systemInstruction}]\n\nUser Prompt:\n${prompt}`;
    }
    
    // Using gemini-2.0-flash which is the standard, fast, and powerful model
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: combinedPrompt
    });
    
    if (response && response.text) {
      return response.text;
    }
    return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    console.error("Gemini API call failed, falling back to local simulation:", error);
    throw error;
  }
}

// --- Endpoints ---

// 1. Ingestion Endpoint
app.post('/api/ingest', upload.single('file'), async (req, res) => {
  try {
    const { title, category, equipmentTags } = req.body;
    let fileContent = req.body.manualText || "";
    
    if (req.file) {
      // If a file was uploaded, read it as text (scanned forms / spreadsheets / text)
      try {
        fileContent = fs.readFileSync(req.file.path, 'utf8');
      } catch (err) {
        fileContent = `[Ingested File binary: ${req.file.originalname}]`;
      }
      // Remove temporary upload file
      fs.unlinkSync(req.file.path);
    }
    
    if (!title || !fileContent) {
      return res.status(400).json({ error: "Title and content/file are required." });
    }
    
    const docId = `doc-${Date.now()}`;
    const parsedEquipment = equipmentTags 
      ? equipmentTags.split(',').map(t => t.trim()).filter(Boolean)
      : [];
      
    let extractedEntities = {
      equipment: parsedEquipment,
      tags: ["Ingested", category || "Manual"],
      summary: fileContent.substring(0, 200) + "..."
    };

    // If Gemini API is available, try to extract real entities!
    if (process.env.GEMINI_API_KEY) {
      try {
        const extractionPrompt = `Analyze the following industrial document snippet. Extract:
1. Equipment tags mentioned (e.g. Pump P-102A, Boiler B-501).
2. Key operational or safety tags.
3. A brief 2-sentence summary.
Format your answer strictly as a JSON object like this:
{"equipment": ["tag1", "tag2"], "tags": ["tag1", "tag2"], "summary": "brief summary here"}

Document content:
${fileContent}`;

        const extractionResponse = await callGemini(extractionPrompt, "You are a precise data extraction agent for industrial drawings, manuals, and SOPs.");
        const cleanJson = extractionResponse.substring(extractionResponse.indexOf('{'), extractionResponse.lastIndexOf('}') + 1);
        extractedEntities = JSON.parse(cleanJson);
      } catch (geminiErr) {
        console.warn("Failed to extract entities with Gemini, using manual inputs.", geminiErr);
      }
    }

    // 1. Update Documents JSON database
    const newDoc = {
      id: docId,
      title: title,
      category: category || "Ingested Record",
      equipment: extractedEntities.equipment || parsedEquipment,
      tags: extractedEntities.tags || ["Ingested"],
      content: fileContent,
      source: req.file ? req.file.originalname : "Web Input Dashboard",
      author: "System Agent",
      last_updated: new Date().toISOString().split('T')[0]
    };
    
    const docs = getDocuments();
    docs.push(newDoc);
    writeDataFile('documents.json', docs);
    
    // 2. Update Graph JSON database (Nodes & Edges)
    const graph = getGraph();
    // Add document node
    graph.nodes.push({
      id: docId,
      label: title,
      type: "Document",
      details: extractedEntities.summary || `Manual upload containing information about ${extractedEntities.equipment?.join(', ') || 'general assets'}`
    });
    
    // Add equipment nodes and links if they don't exist
    (extractedEntities.equipment || []).forEach(eqTag => {
      const eqExists = graph.nodes.some(n => n.id.toLowerCase() === eqTag.toLowerCase());
      const normalizedEq = eqTag.toUpperCase();
      
      if (!eqExists) {
        graph.nodes.push({
          id: normalizedEq,
          label: normalizedEq,
          type: "Equipment",
          details: `Dynamically created equipment node from ${title}`
        });
      }
      
      // Link document to equipment
      graph.edges.push({
        id: `e-${docId}-${normalizedEq}`,
        source: docId,
        target: normalizedEq,
        label: "references"
      });
    });
    
    writeDataFile('graph.json', graph);

    res.status(201).json({
      message: "Document successfully ingested and indexed in Knowledge Graph.",
      document: newDoc,
      entities: extractedEntities
    });
  } catch (error) {
    console.error("Ingestion Error:", error);
    res.status(500).json({ error: "Failed to process document ingestion." });
  }
});

// 2. Graph API
app.get('/api/graph', (req, res) => {
  res.json(getGraph());
});

app.get('/api/graph/nodes/:id', (req, res) => {
  const nodeId = req.params.id;
  const graph = getGraph();
  const node = graph.nodes.find(n => n.id.toLowerCase() === nodeId.toLowerCase());
  
  if (!node) {
    return res.status(404).json({ error: "Node not found" });
  }
  
  // Find connected nodes
  const connections = graph.edges
    .filter(e => e.source.toLowerCase() === nodeId.toLowerCase() || e.target.toLowerCase() === nodeId.toLowerCase())
    .map(e => {
      const otherId = e.source.toLowerCase() === nodeId.toLowerCase() ? e.target : e.source;
      const otherNode = graph.nodes.find(n => n.id.toLowerCase() === otherId.toLowerCase());
      return {
        relationship: e.label,
        edgeId: e.id,
        node: otherNode || { id: otherId, label: otherId, type: "Unknown" }
      };
    });
    
  // Find associated documents
  const docs = getDocuments().filter(d => 
    d.equipment.some(eq => eq.toLowerCase() === nodeId.toLowerCase()) || d.id === nodeId
  );
  
  // Find associated incidents
  const incidents = getIncidents().filter(inc => 
    inc.equipment.toLowerCase() === nodeId.toLowerCase()
  );

  res.json({
    node,
    connections,
    associatedDocuments: docs,
    associatedIncidents: incidents
  });
});

// 3. Expert Knowledge Copilot (RAG) API
app.post('/api/copilot', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }
    
    const docs = getDocuments();
    const incidents = getIncidents();
    const compliance = getCompliance();
    
    // Keyword based retrieval simulation (RAG)
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    // Score documents by keyword matches
    const scoredDocs = docs.map(doc => {
      let score = 0;
      const docText = `${doc.title} ${doc.content} ${doc.tags.join(' ')} ${doc.equipment.join(' ')}`.toLowerCase();
      keywords.forEach(kw => {
        if (docText.includes(kw)) score += 1;
        // Boost score if keyword matches title or equipment tag
        if (doc.title.toLowerCase().includes(kw)) score += 2;
        if (doc.equipment.some(eq => eq.toLowerCase().includes(kw))) score += 3;
      });
      return { doc, score };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
      
    // Retrieve top 3 matching documents as context
    const contextDocs = scoredDocs.slice(0, 3).map(item => item.doc);
    
    let answerText = "";
    let confidenceScore = 0.5;
    let citations = [];
    
    if (contextDocs.length > 0) {
      confidenceScore = Math.min(0.65 + (contextDocs.length * 0.1) + (scoredDocs[0].score * 0.02), 0.98);
      citations = contextDocs.map(d => ({
        id: d.id,
        title: d.title,
        category: d.category,
        source: d.source
      }));
      
      const contextString = contextDocs.map(d => `[Source: ${d.title}] ${d.content}`).join('\n\n');
      
      if (process.env.GEMINI_API_KEY) {
        // Live Gemini API RAG
        const prompt = `Use the following documents context to answer the user's operational query. Integrate specific equipment tags, safety procedures, and guidelines if relevant. Cite your sources clearly using [Source Name] syntax.
If the information is not in the context, state that clearly and do not make up facts.

---
Context:
${contextString}
---

User Query: ${query}`;
        
        try {
          answerText = await callGemini(prompt, "You are a professional heavy industry lead operations and safety copilot.");
        } catch (err) {
          console.warn("Error calling Gemini, falling back to simulated logic.");
        }
      }
      
      // Fallback/Simulated Expert responses if Gemini is not used or fails
      if (!answerText) {
        const topDoc = contextDocs[0];
        
        if (query.toLowerCase().includes("boiler") || query.toLowerCase().includes("b-501")) {
          answerText = `Based on standard operating procedure **${topDoc.title}**:\n\n1. Prior to starting **Boiler B-501**, ensure the feed water level is stabilized at **55%**.\n2. Confirm the gas supply line pressure is within **2.5 to 3.0 kg/cm²** before opening the manual valve **MV-101**.\n3. The combustion chamber must be purged for **5 minutes** (monitored on panel **LIC-501**) to exhaust residual fuel gas.\n4. During heating, maintain the ramp rate strictly **below 50°C per hour** to prevent critical thermal stress on tubes. According to Factory Act 1948 Section 31, this pressure system requires annual statutory hydrotesting and relief valve calibration (the latest certificate **INSP-PESO-2025** is valid until Oct 2026).`;
        } else if (query.toLowerCase().includes("pump") || query.toLowerCase().includes("p-102a") || query.toLowerCase().includes("vibration") || query.toLowerCase().includes("seal")) {
          answerText = `According to **${topDoc.title}** and historical records:\n\n1. **Operating parameters**: **Pump P-102A** uses a double mechanical seal with plan 53B pressurized barrier fluid. Vibration levels must remain strictly below **4.5 mm/s RMS**.\n2. **Failure History**: A seal blowout incident occurred on 2025-08-12 (**INC-2025-0812**). The root cause was severe dry running due to a suction strainer blockage, which occurred because the operator bypassed the low suction pressure alarm. \n3. **Action Items**: Lubricate bearings with **ISO VG 68 turbine oil** every 4,000 hours, and ensure the suction pressure stays above the Net Positive Suction Head required (**NPSHr = 2.1 meters**) to prevent cavitation.`;
        } else if (query.toLowerCase().includes("compressor") || query.toLowerCase().includes("c-301") || query.toLowerCase().includes("safety") || query.toLowerCase().includes("oisd")) {
          answerText = `Based on regulatory code **REG-OISD-118** and emergency SOPs:\n\n1. **Emergency Trip Procedure**: In the event of a gas leak (>20% LEL), high vibration (>7.5 mm/s), or discharge temp >125°C, immediately press the **ESD-301** button. This automatically closes suction/discharge ESD valves, isolates electrical supply at **MCC-03**, and vents lines to flare via blowdown valve **BDV-301**.\n2. **Compliance Gap**: There is an active non-compliance report. The distance between **Compressor C-301** and substation **MCC-03** is **11.8 meters**, which violates the 15-meter buffer required by **OISD-118 Section 4**. Condensate lines and gas alarms must be tested quarterly (LEL calibration is currently 5 days overdue).`;
        } else {
          // General matching text
          answerText = `Based on your search terms, the most relevant document is **${topDoc.title}** (${topDoc.category}).\n\nKey extracted text states:\n"${topDoc.content}"\n\nRelated equipment tags: ${topDoc.equipment.join(', ') || 'None'}.`;
        }
      }
    } else {
      // No documents found
      confidenceScore = 0.1;
      if (process.env.GEMINI_API_KEY) {
        try {
          answerText = await callGemini(query, "You are an industrial engineer. If the user asks a general question, answer professionally. If they ask about specific plant assets (B-501, P-102A, C-301) and we don't have documents, explain that you have no indexed records for these queries.");
        } catch (err) {
          answerText = "I could not find any documents or historical logs in the database matching your search terms. Please try typing direct terms like 'Boiler B-501', 'OISD distance', 'Pump seal leak', or upload relevant drawings or manuals in the Ingestion panel.";
        }
      } else {
        answerText = "I could not find any documents or historical logs in the database matching your search terms. Please try typing direct terms like 'Boiler B-501', 'OISD distance', 'Pump seal leak', or upload relevant drawings or manuals in the Ingestion panel.";
      }
    }
    
    res.json({
      query,
      answer: answerText,
      confidence: confidenceScore,
      citations
    });
  } catch (error) {
    console.error("Copilot RAG Error:", error);
    res.status(500).json({ error: "RAG engine encountered an error." });
  }
});

// 4. Maintenance Intelligence & Root Cause Analysis (RCA) API
app.post('/api/rca', async (req, res) => {
  try {
    const { equipmentId } = req.body;
    if (!equipmentId) {
      return res.status(400).json({ error: "Equipment ID is required." });
    }
    
    const incidents = getIncidents().filter(i => i.equipment.toLowerCase() === equipmentId.toLowerCase());
    const docs = getDocuments().filter(d => d.equipment.some(e => e.toLowerCase() === equipmentId.toLowerCase()));
    
    if (incidents.length === 0) {
      return res.json({
        equipment: equipmentId,
        message: "No historical failure records or incident reports found for this equipment.",
        rca: null
      });
    }
    
    let rcaContent = "";
    
    if (process.env.GEMINI_API_KEY) {
      // Live Gemini API generated RCA
      const contextString = `
Equipment: ${equipmentId}
Incidents History: ${JSON.stringify(incidents)}
SOPs/Manuals: ${JSON.stringify(docs)}
      `;
      
      const prompt = `You are a Principal Reliability and Forensic Engineer. Perform a comprehensive Root Cause Analysis (RCA) and generate Predictive Maintenance (PdM) recommendations for asset ${equipmentId}.
Analyze the incident history and match them with operating procedures.
Output your findings in professional markdown with sections:
1. Executive Summary
2. Failure Chronology & Incident Overview
3. Fishbone (Ishikawa) Analysis Details (split into Equipment, Operator/Process, Environment, Maintenance)
4. Key Root Causes Identified
5. Recommended Corrective & Preventive Actions (CAPA)
6. Machine Learning / Predictive Maintenance Warning Indicators (what telemetry to track to prevent this next time)

Context:
${contextString}`;

      try {
        rcaContent = await callGemini(prompt, "You are a lead industrial failure investigator and reliability specialist.");
      } catch (err) {
        console.warn("Failed to query Gemini for RCA, using static generator.");
      }
    }
    
    if (!rcaContent) {
      // Fallback/Simulated high-fidelity engineering RCA reports
      if (equipmentId.toUpperCase() === 'PUMP P-102A' || equipmentId.toUpperCase() === 'P-102A') {
        rcaContent = `### ROOT CAUSE ANALYSIS (RCA) REPORT
**Asset Tag**: Pump P-102A (Centrifugal Barrier Fluid Pump)  
**Date of Analysis**: ${new Date().toISOString().split('T')[0]}  
**Investigation Code**: RCA-P102A-01  

---

#### 1. Executive Summary
An analysis of the historical seal failure (**INC-2025-0812**) indicates that cavitation and subsequent mechanical seal failure was caused by a suction strainer blockage. Operating staff bypassed the safety low-pressure trip to force execution, leading to 15 minutes of dry running. This report outlines preventive measures.

#### 2. Fishbone (Ishikawa) Root Cause Breakdown
- **Equipment/Machine**: Suction strainer became clogged with foreign debris (plastic rag). The design lacks an automatic differential pressure (DP) transmitter across the strainer.
- **Process/Operator**: Operator bypassed the control panel suction alarm during start-up to avoid nuisance trips. Lack of standard protocol on trip overrides.
- **Maintenance**: Pre-startup checklist did not require inspecting or flushing the suction line after the cleaning schedule.
- **Materials**: Double mechanical seal plan 53B was operated without pressurized barrier oil lubrication during dry running, causing rapid thermal cracking of the graphite seal faces.

#### 3. Root Cause Statement
The primary root cause of the pump failure was **unlubricated dry running** of the double mechanical seal. This was triggered by a **suction strainer blockage** and enabled by the **unauthorized bypass** of the low suction pressure trip system.

#### 4. CAPA (Corrective and Preventive Action) Plan
1. **Engineering Modification**: Install a differential pressure transmitter (PDT-102) across the suction strainer. Interlock it to trigger DCS alarm at 0.5 bar differential.
2. **Operations Control**: Implement a physical padlock/software key bypass logbook. Bypassing safety trips now requires the Shift Charge Engineer's signature.
3. **Condition Monitoring**: Increase radial bearing lubrication inspections to every 2,000 hours and deploy online vibration analysis.

#### 5. Predictive Maintenance (PdM) Indicators
- **Suction pressure trends**: Flag drop of > 0.3 bar below baseline.
- **Vibration Amplitude**: Track 1x and 2x running speed frequencies. A rise of vibration beyond 4.5 mm/s RMS serves as the first threshold for bearing fatigue warning.`;
      } else if (equipmentId.toUpperCase() === 'BOILER B-501' || equipmentId.toUpperCase() === 'B-501') {
        rcaContent = `### ROOT CAUSE ANALYSIS (RCA) REPORT
**Asset Tag**: High-Pressure Boiler B-501  
**Date of Analysis**: ${new Date().toISOString().split('T')[0]}  
**Investigation Code**: RCA-B501-01  

---

#### 1. Executive Summary
On 2026-03-04, Boiler B-501 suffered a steam header overpressurization event resulting in a safety valve pop. The root cause was a sticking pneumatic actuator on fuel gas control valve CV-402, due to liquid moisture ingress in the main instrument air supply headers.

#### 2. Fishbone (Ishikawa) Root Cause Breakdown
- **Equipment**: Pneumatic control valve CV-402 actuator shaft seized due to oxidation and pitting corrosion.
- **Environment**: High ambient humidity combined with overloaded plant air-dryers.
- **Maintenance**: Delayed inspection of the instrument air filter-regulators. Condensate traps in the air headers were not drained regularly.
- **System Logic**: DCS system failed to trigger a valve position mismatch alarm when the valve feedback remained at 80% despite a 20% output signal.

#### 3. Root Cause Statement
The direct root cause was **pneumatic actuator mechanical sticking** due to corrosion from **instrument air moisture contamination**, resulting from a saturated pre-filter dryer.

#### 4. CAPA Plan
1. **Instrument Air System**: Replace the air dryer desiccant and enforce daily automated moisture purging on primary air receivers.
2. **Control Valve Service**: Overhaul the CV-402 pneumatic positioner, polish the stem, and apply anti-seize lubricant.
3. **DCS Alarm Logic**: Program a "valve position mismatch" alarm (trip boiler fire if mismatch persists for > 30 seconds).

#### 5. Predictive Maintenance Indicators
- **Instrument Air Dew Point**: Continuously monitor and alarm if dew point rises above -40°C.
- **Valve Stiction Metrics**: Monitor actuator air supply pressure vs positioner output to detect mechanical binding before physical seizure.`;
      } else {
        rcaContent = `### ROOT CAUSE ANALYSIS (RCA) REPORT
**Asset Tag**: ${equipmentId}  
**Date of Analysis**: ${new Date().toISOString().split('T')[0]}  

---

#### 1. Analysis Findings
- Review of historical records indicates recurrent operational cycles near safe design boundaries.
- Recommendations include reviewing operating procedures and checking physical vibration and temperature trends.
- **Action Required**: Perform physical inspections and review sensor calibrations.`;
      }
    }
    
    res.json({
      equipment: equipmentId,
      incidentsCount: incidents.length,
      rca: rcaContent,
      pdmRecommendations: [
        "Enforce sensor calibration schedules.",
        "Implement predictive vibration boundary alarms.",
        "Check lubrication compliance records."
      ]
    });
  } catch (error) {
    console.error("RCA Agent Error:", error);
    res.status(500).json({ error: "RCA analysis engine encountered an error." });
  }
});

// 5. Compliance Update & evidence package API
app.get('/api/compliance', (req, res) => {
  res.json(getCompliance());
});

app.post('/api/compliance/check', (req, res) => {
  try {
    const { standardId, checklistIndex, checked } = req.body;
    if (!standardId || checklistIndex === undefined) {
      return res.status(400).json({ error: "Standard ID and Checklist Index are required." });
    }
    
    const compliance = getCompliance();
    const item = compliance.find(c => c.standard_id === standardId);
    
    if (!item) {
      return res.status(404).json({ error: "Regulatory Standard not found." });
    }
    
    // Toggle checked status
    item.checklist[checklistIndex].checked = checked;
    
    // Dynamically update overall compliance status
    const allChecked = item.checklist.every(chk => chk.checked);
    const someChecked = item.checklist.some(chk => chk.checked);
    
    if (allChecked) {
      item.status = "Compliant";
      item.gaps = "None.";
    } else if (someChecked) {
      item.status = "Under Review";
      item.gaps = `Partial checklist items remaining.`;
    } else {
      item.status = "Non-Compliant";
      item.gaps = "All safety check items are currently incomplete.";
    }
    
    writeDataFile('compliance.json', compliance);
    res.json({ success: true, updatedItem: item });
  } catch (error) {
    console.error("Compliance Update Error:", error);
    res.status(500).json({ error: "Failed to update compliance details." });
  }
});

// Serve frontend in production environment
if (process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, 'client/dist'))) {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send("Industrial Knowledge Brain API is running. Client is in dev mode.");
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
