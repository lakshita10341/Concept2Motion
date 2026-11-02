import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { UnifiedLLMProvider } from "./providers/UnifiedLLMProvider.js";
import { MetaModelAPIProvider } from "./providers/meta/MetaModelAPIProvider.js";
import { EdgeTTSProvider } from "./providers/tts/EdgeTTSProvider.js";
import { ResearchAgent } from "./agents/research/ResearchAgent.js";
import { TeachingAgent } from "./agents/teaching/TeachingAgent.js";
import { SimulationAgent } from "./agents/simulation/SimulationAgent.js";
import { VisualPlanningAgent } from "./agents/visual-planning/VisualPlanningAgent.js";
import { NarrationAgent } from "./agents/narration/NarrationAgent.js";
import { CriticAgent } from "./agents/critic/CriticAgent.js";
import { OrchestratorAgent } from "./agents/orchestrator/OrchestratorAgent.js";
import { JobStore } from "./services/JobStore.js";
import { VideoRequestSchema } from "./shared/types/index.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
// Serve static assets generated for jobs
const storageDir = path.resolve(process.cwd(), "storage/jobs");
app.use("/api/jobs/media", express.static(storageDir));
// Initialize provider hierarchy (Meta Model API -> Fireworks -> Baseten -> Local Emulator)
const llmProvider = new UnifiedLLMProvider();
const metaProvider = new MetaModelAPIProvider();
const tts = new EdgeTTSProvider();
const researchAgent = new ResearchAgent(llmProvider);
const teachingAgent = new TeachingAgent(llmProvider);
const simulationAgent = new SimulationAgent();
const visualPlanningAgent = new VisualPlanningAgent(llmProvider);
const narrationAgent = new NarrationAgent(tts);
const criticAgent = new CriticAgent(llmProvider);
const orchestrator = new OrchestratorAgent(researchAgent, teachingAgent, simulationAgent, visualPlanningAgent, narrationAgent, criticAgent);
// Health check with active provider diagnostics
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        activeLLMProvider: llmProvider.getActiveProviderName(),
        isRealModelConnected: llmProvider.isRealModelConnected(),
        metaModelApiConfigured: metaProvider.isConfigured(),
        metaTextModel: metaProvider.getTextModel(),
        metaImageModel: metaProvider.getImageModel(),
        ttsProvider: "edge-tts (neural)",
        timestamp: new Date().toISOString(),
    });
});
// Explicit connectivity test endpoint for Meta Model API (Muse Spark & Muse Image)
app.post("/api/meta/test-connection", async (req, res) => {
    if (!metaProvider.isConfigured()) {
        return res.status(400).json({
            success: false,
            configured: false,
            error: "MODEL_API_KEY is not set. Please set MODEL_API_KEY in backend/.env or your environment.",
            setupInstructions: {
                docUrl: "https://dev.meta.ai/docs/overview",
                envVar: "MODEL_API_KEY",
                models: {
                    text: metaProvider.getTextModel(),
                    image: metaProvider.getImageModel(),
                },
            },
        });
    }
    try {
        const testPrompt = req.body.prompt || "Explain binary search in three steps and return a concise educational explanation.";
        const startTime = Date.now();
        const result = await metaProvider.generateCompletion([
            { role: "user", content: testPrompt }
        ]);
        const durationMs = Date.now() - startTime;
        res.json({
            success: true,
            configured: true,
            model: metaProvider.getTextModel(),
            durationMs,
            response: result,
        });
    }
    catch (err) {
        res.status(502).json({
            success: false,
            configured: true,
            error: err.message,
        });
    }
});
// Create and trigger a generation job
app.post("/api/jobs", async (req, res) => {
    try {
        const parsedRequest = VideoRequestSchema.parse(req.body);
        const jobId = `c2m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const initialJob = {
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
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Invalid request payload" });
    }
});
// Get job details
app.get("/api/jobs/:id", (req, res) => {
    const job = JobStore.getJob(req.params.id);
    if (!job)
        return res.status(404).json({ error: "Job not found" });
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
    if (!job || !job.script)
        return res.status(404).json({ error: "Job or script not found" });
    const segmentIndex = job.script.segments.findIndex((s) => s.segmentId === segmentId);
    if (segmentIndex === -1)
        return res.status(404).json({ error: "Segment not found" });
    try {
        const jobDir = JobStore.getJobDir(job.id);
        const updated = await narrationAgent.regenerateSegmentAudio(segmentId, newNarrationText, jobDir, job.request.voice);
        job.script.segments[segmentIndex].narrationText = newNarrationText;
        job.script.segments[segmentIndex].audioUrl = updated.audioUrl;
        job.script.segments[segmentIndex].audioDurationSeconds = updated.audioDurationSeconds;
        JobStore.saveJob(job);
        res.json(job.script.segments[segmentIndex]);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Concept2Motion Backend listening at http://0.0.0.0:${PORT}`);
});
