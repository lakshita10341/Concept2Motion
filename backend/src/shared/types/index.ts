import { z } from "zod";

export const VideoRequestSchema = z.preprocess((val: any) => {
  if (val && typeof val === "object") {
    if (val.durationSeconds && !val.targetDurationSeconds) {
      return { ...val, targetDurationSeconds: Number(val.durationSeconds) };
    }
  }
  return val;
}, z.object({
  topic: z.string().min(3),
  audienceLevel: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  targetDurationSeconds: z.number().int().min(30).max(180).default(60),
  visualStyle: z.enum(["blueprint", "cyberpunk", "minimalist_dark", "academic"]).default("minimalist_dark"),
  voice: z.string().default("en-US-GuyNeural"),
  modelProvider: z.enum(["fireworks", "meta_direct", "mock"]).default("fireworks"),
}));

export type VideoRequest = z.infer<typeof VideoRequestSchema>;

export const ResearchSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  keyTakeaways: z.array(z.string()),
});

export const ResearchNotesSchema = z.object({
  topic: z.string(),
  coreConcepts: z.array(z.string()),
  commonMisconceptions: z.array(z.string()),
  stepByStepBreakdown: z.array(z.string()),
  sources: z.array(ResearchSourceSchema),
});

export type ResearchNotes = z.infer<typeof ResearchNotesSchema>;

export const WordTimingSchema = z.object({
  word: z.string(),
  startMs: z.number(),
  endMs: z.number(),
});

export type WordTiming = z.infer<typeof WordTimingSchema>;

export const NarrationSegmentSchema = z.object({
  segmentId: z.string(),
  narrationText: z.string(),
  concept: z.string(),
  learningOutcome: z.string(),
  audioUrl: z.string().optional(),
  audioDurationSeconds: z.number().optional(),
  wordTimings: z.array(WordTimingSchema).optional(),
});

export type NarrationSegment = z.infer<typeof NarrationSegmentSchema>;

export const TeachingScriptSchema = z.object({
  title: z.string(),
  targetAudience: z.string(),
  segments: z.array(NarrationSegmentSchema),
});

export type TeachingScript = z.infer<typeof TeachingScriptSchema>;

export const SimulationStateSchema = z.object({
  step: z.number(),
  description: z.string(),
  stateData: z.record(z.any()), // e.g., { left: 0, right: 6, mid: 3, midVal: 18, target: 42, match: false }
});

export type SimulationState = z.infer<typeof SimulationStateSchema>;

export const SimulationResultSchema = z.object({
  algorithm: z.string(),
  language: z.enum(["python", "typescript"]),
  code: z.string(),
  states: z.array(SimulationStateSchema),
  passedSelfTests: z.boolean(),
  executionOutput: z.string().optional(),
});

export type SimulationResult = z.infer<typeof SimulationResultSchema>;

export const SceneVisualSchema = z.object({
  sceneId: z.string(),
  title: z.string(),
  concept: z.string(),
  visualType: z.enum(["algorithm_animation", "diagram", "token_attention", "concept_card"]),
  component: z.string(), // e.g. "BinarySearchAnimation", "AttentionHeatmap", "ArchitectureCard"
  simulationStateIds: z.array(z.number()),
  narrationSegmentIds: z.array(z.string()),
  durationSeconds: z.number(),
  highlightElements: z.array(z.string()).default([]),
  customProps: z.record(z.any()).default({}),
  transition: z.enum(["fade", "slide", "none"]).default("fade"),
});

export type SceneVisual = z.infer<typeof SceneVisualSchema>;

export const StoryboardSchema = z.object({
  totalDurationSeconds: z.number(),
  scenes: z.array(SceneVisualSchema),
  manimScript: z.string().optional(),
});

export type Storyboard = z.infer<typeof StoryboardSchema>;

export const CriticIssueSchema = z.object({
  sceneId: z.string().optional(),
  segmentId: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  category: z.enum(["technical_accuracy", "audio_visual_sync", "completeness", "clarity"]),
  description: z.string(),
  recommendedAction: z.string(),
});

export const CriticReportSchema = z.object({
  status: z.enum(["passed", "needs_revision"]),
  evaluationModel: z.string(),
  score: z.number().min(0).max(100),
  issues: z.array(CriticIssueSchema),
  summary: z.string(),
});

export type CriticReport = z.infer<typeof CriticReportSchema>;

export const AgentTraceItemSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  agent: z.string(), // "Research Agent", "Teaching Agent", "Simulation Agent", "Visual Planning Agent", "Critic Agent", "Orchestrator Agent"
  action: z.string(),
  details: z.string(),
  status: z.enum(["info", "success", "warning", "error"]),
  toolUsed: z.string().optional(),
  durationMs: z.number().optional(),
});

export type AgentTraceItem = z.infer<typeof AgentTraceItemSchema>;

export const PipelineJobSchema = z.object({
  id: z.string(),
  request: VideoRequestSchema,
  status: z.enum(["queued", "researching", "teaching", "simulating", "planning", "narrating", "critiquing", "correcting", "rendering", "completed", "failed"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  traces: z.array(AgentTraceItemSchema),
  research: ResearchNotesSchema.optional(),
  script: TeachingScriptSchema.optional(),
  simulation: SimulationResultSchema.optional(),
  storyboard: StoryboardSchema.optional(),
  criticReports: z.array(CriticReportSchema).default([]),
  correctionCount: z.number().default(0),
  videoUrl: z.string().optional(),
  error: z.string().optional(),
});

export type PipelineJob = z.infer<typeof PipelineJobSchema>;
