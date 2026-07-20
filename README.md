# Industrial Knowledge Intelligence: Unified Asset & Operations Brain

This platform solves information fragmentation, safety gaps, and knowledge loss in asset-intensive plants (refineries, power stations, chemical hubs). It provides a unified operations dashboard consolidating operating SOPs, OEM manuals, regulatory guidelines, and maintenance logs into an interactive Knowledge Graph.

---

## Technical Architecture & Core Modules

1. **Universal Ingestion & Entity Extraction Pipeline**: Extracts equipment tags and process thresholds from raw documents (scanned reports, files, manuals) and maps relationships directly to the Knowledge Graph.
2. **Expert Knowledge Copilot (RAG)**: Chatbot resolving operational, regulatory, and technical queries. Pulls source references and confidence indexes. (Integrates with **Gemini 2.5 Flash**).
3. **Maintenance Intelligence & RCA Agent**: Traces historical incidents and telemetry alerts, constructing Fishbone (Ishikawa) charts and predictive maintenance recommendations.
4. **Quality & Regulatory Compliance Tracker**: Maps plant assets against PESO, OISD, and Factory Act policies, identifies compliance gaps, and compiles digital evidence certificates.

---

## Environment Variables

* `GEMINI_API_KEY` (Optional): The platform runs in dual modes. If a Google Gemini API Key is provided, the platform uses live models to run context-guided RAG answers, extract entities from uploads, and generate root-cause reports. If omitted, the platform uses a high-fidelity rule-based engine.
* `PORT` (Optional): Port to bind the Express server (defaults to `5000`).

---

## Installation & Local Development

### 1. Prerequisite
Ensure [Node.js](https://nodejs.org/) (v18+) is installed.

### 2. Install Dependencies
Run the installation scripts:
```bash
# Install root (backend) dependencies
npm install

# Install client (frontend) dependencies
cd client
npm install
cd ..
```

### 3. Run the Platform in Development Mode
To start both the Express backend and Vite hot-reloading React client:
```bash
npm run dev
```
* **Frontend UI**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000`

---

## Production Build & Deploy

### 1. Build Client Asset Bundles
Compile the React codebases:
```bash
npm run build
```
This builds the client assets into `client/dist/`.

### 2. Start Production Server
Launch the unified server:
```bash
npm start
```
The server binds to the defined `PORT` (e.g. `5000`) and serves both the API endpoints and client SPA files.

---

## Render Deployment Guide (One-Click)

The repository contains a `render.yaml` blueprint:

1. Connect your Git repository to **Render.com**.
2. Select **Blueprints** on Render and connect the repo.
3. Render automatically provisions a web service using the following parameters:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Optionally specify `GEMINI_API_KEY` in Render's environment variable panel to activate live generative AI completions!
