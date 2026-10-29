# Concept2Motion 🎬
### Autonomous AI System for Creating Technically Accurate Educational Videos
*Built for the Meta AI Developer Hackathon*

---

## 🚀 Overview

**Concept2Motion** transforms complex technical concepts (such as *Binary Search*, *Transformer Attention*, *B-Tree Database Indexing*, etc.) into verified, narrated, technically accurate 1080p educational videos.

Unlike conventional video generators that prompt general diffusion models to "hallucinate" what an algorithm looks like, Concept2Motion implements an **autonomous 8-agent orchestration loop** that:
1. Researches the canonical invariants and authoritative definitions.
2. Formulates an audience-calibrated teaching script.
3. Generates and sandboxes an executable Python simulation to extract mathematical and algorithmic state snapshots.
4. Synthesizes high-fidelity neural narration tracks with real millisecond-accurate timestamps.
5. Plans an interactive storyboard bound strictly to the captured simulation states.
6. Employs **Meta Open-Weight Model (Llama 3.3 70B Instruct)** as an independent Technical Critic to audit algorithmic invariants.
7. Performs **autonomous targeted remediation** when invariant violations or audio-visual discrepancies are detected.
8. Compiles and renders a 1080p MP4 with synchronized narration and visuals.

---

## 🧠 Architecture & Agents

```mermaid
flowchart TD
    User([User Request]) --> Orch[Agent 8: Orchestrator Agent]
    Orch --> R[Agent 1: Research Agent]
    R --> T[Agent 2: Teaching Agent]
    T --> S[Agent 3: Simulation Agent]
    S --> N[Agent 5: Narration Agent (TTS)]
    N --> V[Agent 4: Visual Planning Agent]
    V --> C[Agent 7: Critic Agent (Meta Llama 3.3 70B)]
    C -- "Discrepancy Caught (Score < 80)" --> Orch
    Orch -- "Targeted Remediation Loop" --> V
    C -- "Invariants Verified (Score 98+)" --> Render[Rendering Engine (FFmpeg & Resvg)]
    Render --> MP4([1080p Educational MP4])
```

- **Agent 1: Research Agent**: Synthesizes verified technical papers, RFCs, and canonical textbooks (e.g. CLRS, Bloch), maintaining genuine references.
- **Agent 2: Teaching Agent**: Structures a pedagogical sequence targeting the selected audience level (Beginner, Intermediate, Advanced).
- **Agent 3: Simulation Agent**: Runs isolated execution code in Python with state capture and self-testing assertions.
- **Agent 4: Visual Planning Agent**: Compiles structured scene visuals (bounds, pointers, eliminated subsets, complexity tags) from simulation outputs.
- **Agent 5: Narration Agent**: Synthesizes real speech via neural voice models (`edge-tts` / ElevenLabs provider abstraction) and obtains measured audio durations.
- **Agent 7: Critic Agent (Meta Open-Weight Model)**: Audits every scene against simulation data using Meta Llama 3.3 70B (via Fireworks AI inference endpoint) and deterministic invariant validators.
- **Agent 8: Orchestrator Agent**: Manages pipeline state, bounded retry budgets, and targeted scene regeneration without re-executing costly upstream stages.

---

## 🛠️ Quickstart & Setup

### Prerequisites
- Node.js >= 20
- Python >= 3.11

### 1. Configure Environment (Optional for Fireworks AI Llama 3.3)
If you have a Fireworks AI API key for Meta Llama 3.3 70B, create `backend/.env`:
```bash
FIREWORKS_API_KEY="your-fireworks-api-key"
FIREWORKS_MODEL="accounts/fireworks/models/llama-v3p3-70b-instruct"
```
*(If omitted, Concept2Motion operates in resilient verification emulator mode with full deterministic invariant checking and trace generation).*

### 2. Start Services
From the root repository:

```bash
# Start Backend (Port 4000)
cd backend && npm run dev

# Start Frontend (Port 3000)
cd frontend && npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🧪 Demo Verification & Test Results

The full end-to-end autonomous loop was executed with the test topic: **"How Binary Search Works"**:

- **Simulation Agent**: Captured 4 state snapshots in Python with assertions (`left`, `right`, `mid`, `eliminated_intervals`).
- **Narration Agent**: Synthesized 4 neural voiceover tracks with measured audio durations.
- **Critic Agent (Pass 1)**: Detected an intentional discrepancy injected into scene 3 (`mid: 1` vs simulation `mid: 4`), assigning a score of **55/100** and halting the render.
- **Orchestrator Agent**: Performed targeted self-correction, regenerating scene 3 bound to simulation state step 2.
- **Critic Agent (Pass 2)**: Re-evaluated the corrected storyboard, scoring **98/100** (Passed).
- **Video Renderer**: Successfully rendered a 1080p MP4 (`1.3 MB`) with audio-visual synchronization.
