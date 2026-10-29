"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineJobSchema = exports.AgentTraceItemSchema = exports.CriticReportSchema = exports.CriticIssueSchema = exports.StoryboardSchema = exports.SceneVisualSchema = exports.SimulationResultSchema = exports.SimulationStateSchema = exports.TeachingScriptSchema = exports.NarrationSegmentSchema = exports.ResearchNotesSchema = exports.ResearchSourceSchema = exports.VideoRequestSchema = void 0;
const zod_1 = require("zod");
exports.VideoRequestSchema = zod_1.z.object({
    topic: zod_1.z.string().min(3),
    audienceLevel: zod_1.z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    targetDurationSeconds: zod_1.z.number().int().min(30).max(180).default(60),
    visualStyle: zod_1.z.enum(["blueprint", "cyberpunk", "minimalist_dark", "academic"]).default("minimalist_dark"),
    voice: zod_1.z.string().default("en-US-GuyNeural"),
    modelProvider: zod_1.z.enum(["fireworks", "meta_direct", "mock"]).default("fireworks"),
});
exports.ResearchSourceSchema = zod_1.z.object({
    title: zod_1.z.string(),
    url: zod_1.z.string(),
    snippet: zod_1.z.string(),
    keyTakeaways: zod_1.z.array(zod_1.z.string()),
});
exports.ResearchNotesSchema = zod_1.z.object({
    topic: zod_1.z.string(),
    coreConcepts: zod_1.z.array(zod_1.z.string()),
    commonMisconceptions: zod_1.z.array(zod_1.z.string()),
    stepByStepBreakdown: zod_1.z.array(zod_1.z.string()),
    sources: zod_1.z.array(exports.ResearchSourceSchema),
});
exports.NarrationSegmentSchema = zod_1.z.object({
    segmentId: zod_1.z.string(),
    narrationText: zod_1.z.string(),
    concept: zod_1.z.string(),
    learningOutcome: zod_1.z.string(),
    audioUrl: zod_1.z.string().optional(),
    audioDurationSeconds: zod_1.z.number().optional(),
});
exports.TeachingScriptSchema = zod_1.z.object({
    title: zod_1.z.string(),
    targetAudience: zod_1.z.string(),
    segments: zod_1.z.array(exports.NarrationSegmentSchema),
});
exports.SimulationStateSchema = zod_1.z.object({
    step: zod_1.z.number(),
    description: zod_1.z.string(),
    stateData: zod_1.z.record(zod_1.z.any()), // e.g., { left: 0, right: 6, mid: 3, midVal: 18, target: 42, match: false }
});
exports.SimulationResultSchema = zod_1.z.object({
    algorithm: zod_1.z.string(),
    language: zod_1.z.enum(["python", "typescript"]),
    code: zod_1.z.string(),
    states: zod_1.z.array(exports.SimulationStateSchema),
    passedSelfTests: zod_1.z.boolean(),
    executionOutput: zod_1.z.string().optional(),
});
exports.SceneVisualSchema = zod_1.z.object({
    sceneId: zod_1.z.string(),
    title: zod_1.z.string(),
    concept: zod_1.z.string(),
    visualType: zod_1.z.enum(["algorithm_animation", "diagram", "token_attention", "concept_card"]),
    component: zod_1.z.string(), // e.g. "BinarySearchAnimation", "AttentionHeatmap", "ArchitectureCard"
    simulationStateIds: zod_1.z.array(zod_1.z.number()),
    narrationSegmentIds: zod_1.z.array(zod_1.z.string()),
    durationSeconds: zod_1.z.number(),
    highlightElements: zod_1.z.array(zod_1.z.string()).default([]),
    customProps: zod_1.z.record(zod_1.z.any()).default({}),
    transition: zod_1.z.enum(["fade", "slide", "none"]).default("fade"),
});
exports.StoryboardSchema = zod_1.z.object({
    totalDurationSeconds: zod_1.z.number(),
    scenes: zod_1.z.array(exports.SceneVisualSchema),
});
exports.CriticIssueSchema = zod_1.z.object({
    sceneId: zod_1.z.string().optional(),
    segmentId: zod_1.z.string().optional(),
    severity: zod_1.z.enum(["low", "medium", "high", "critical"]),
    category: zod_1.z.enum(["technical_accuracy", "audio_visual_sync", "completeness", "clarity"]),
    description: zod_1.z.string(),
    recommendedAction: zod_1.z.string(),
});
exports.CriticReportSchema = zod_1.z.object({
    status: zod_1.z.enum(["passed", "needs_revision"]),
    evaluationModel: zod_1.z.string(),
    score: zod_1.z.number().min(0).max(100),
    issues: zod_1.z.array(exports.CriticIssueSchema),
    summary: zod_1.z.string(),
});
exports.AgentTraceItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    agent: zod_1.z.string(), // "Research Agent", "Teaching Agent", "Simulation Agent", "Visual Planning Agent", "Critic Agent", "Orchestrator Agent"
    action: zod_1.z.string(),
    details: zod_1.z.string(),
    status: zod_1.z.enum(["info", "success", "warning", "error"]),
    toolUsed: zod_1.z.string().optional(),
    durationMs: zod_1.z.number().optional(),
});
exports.PipelineJobSchema = zod_1.z.object({
    id: zod_1.z.string(),
    request: exports.VideoRequestSchema,
    status: zod_1.z.enum(["queued", "researching", "teaching", "simulating", "planning", "narrating", "critiquing", "correcting", "rendering", "completed", "failed"]),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    traces: zod_1.z.array(exports.AgentTraceItemSchema),
    research: exports.ResearchNotesSchema.optional(),
    script: exports.TeachingScriptSchema.optional(),
    simulation: exports.SimulationResultSchema.optional(),
    storyboard: exports.StoryboardSchema.optional(),
    criticReports: zod_1.z.array(exports.CriticReportSchema).default([]),
    correctionCount: zod_1.z.number().default(0),
    videoUrl: zod_1.z.string().optional(),
    error: zod_1.z.string().optional(),
});
