import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { FireworksLlamaProvider } from "./providers/fireworks/FireworksLlamaProvider.js";
import { EdgeTTSProvider } from "./providers/tts/EdgeTTSProvider.js";
import { ResearchAgent } from "./agents/research/ResearchAgent.js";
import { TeachingAgent } from "./agents/teaching/TeachingAgent.js";
import { SimulationAgent } from "./agents/simulation/SimulationAgent.js";
import { VisualPlanningAgent } from "./agents/visual-planning/VisualPlanningAgent.js";
import { NarrationAgent } from "./agents/narration/NarrationAgent.js";
import { CriticAgent } from "./agents/critic/CriticAgent.js";
import { OrchestratorAgent } from "./agents/orchestrator/OrchestratorAgent.js";
import { JobStore } from "./services/JobStore.js";
import { VideoRequestSchema, PipelineJob } from "./shared/types/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static assets generated for jobs
const storageDir = path.resolve(process.cwd(), "storage/jobs");
app.use("/api/jobs/media", express.static(storageDir));

// Initialize agent graph
const fireworks = new FireworksLlamaProvider();
const tts = new EdgeTTSProvider();

const researchAgent = new ResearchAgent(fireworks);
const teachingAgent = new TeachingAgent(fireworks);
const simulationAgent = new SimulationAgent();
const visualPlanningAgent = new VisualPlanningAgent();
const narrationAgent = new NarrationAgent(tts);
const criticAgent = new CriticAgent(fireworks);

const orchestrator = new OrchestratorAgent(
  researchAgent,
  teachingAgent,
  simulationAgent,
  visualPlanningAgent,
  narrationAgent,
  criticAgent
);

// Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    modelProvider: fireworks.isConfigured() ? "fireworks-llama-3.3-70b" : "meta-open-weight-emulator",
    ttsProvider: "edge-tts",
    timestamp: new Date().toISOString(),
  });
});

// Create and trigger a generation job
app.post("/api/jobs", async (req, res) => {
  try {
    const parsedRequest = VideoRequestSchema.parse(req.body);
    const jobId = `c2m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const initialJob: PipelineJob = {
      id: jobId,
      request: parsedRequest,
      status: "queued",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      traces: [
        {
          id: `trace_init`,
          timestamp: new Date().toISOString(),
          agent: "System",
          action: "Job Queued",
          details: `Requested topic: "${parsedRequest.topic}" (${parsedRequest.audienceLevel}, ~${parsedRequest.targetDurationSeconds}s)`,
          status: "info",
        },
      ],
      criticReports: [],
      correctionCount: 0,
    };

    JobStore.saveJob(initialJob);

    // Launch pipeline execution asynchronously
    orchestrator.runPipeline(jobId, { testCorrectionLoop: true }).catch((err) => {
      console.error(`Error processing job ${jobId}:`, err);
    });

    res.status(201).json(initialJob);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Invalid request payload" });
  }
});

// Get job details
app.get("/api/jobs/:id", (req, res) => {
  const job = JobStore.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// List all jobs
app.get("/api/jobs", (req, res) => {
  res.json(JobStore.listJobs());
});

// User action: regenerate single narration segment
app.post("/api/jobs/:id/regenerate-segment", async (req, res) => {
  const { segmentId, newNarrationText } = req.body;
  const job = JobStore.getJob(req.params.id);
  if (!job || !job.script) return res.status(404).json({ error: "Job or script not found" });

  const segmentIndex = job.script.segments.findIndex((s) => s.segmentId === segmentId);
  if (segmentIndex === -1) return res.status(404).json({ error: "Segment not found" });

  try {
    const jobDir = JobStore.getJobDir(job.id);
    const updated = await narrationAgent.regenerateSegmentAudio(segmentId, newNarrationText, jobDir, job.request.voice);

    job.script.segments[segmentIndex].narrationText = newNarrationText;
    job.script.segments[segmentIndex].audioUrl = updated.audioUrl;
    job.script.segments[segmentIndex].audioDurationSeconds = updated.audioDurationSeconds;

    JobStore.saveJob(job);
    res.json(job.script.segments[segmentIndex]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Concept2Motion Backend listening at http://localhost:${PORT}`);
});
