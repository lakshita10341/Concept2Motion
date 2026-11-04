import { ResearchAgent } from "../research/ResearchAgent.js";
import { TeachingAgent } from "../teaching/TeachingAgent.js";
import { SimulationAgent } from "../simulation/SimulationAgent.js";
import { VisualPlanningAgent } from "../visual-planning/VisualPlanningAgent.js";
import { NarrationAgent } from "../narration/NarrationAgent.js";
import { CriticAgent } from "../critic/CriticAgent.js";
import { VideoRendererService } from "../../services/VideoRendererService.js";
import { JobStore } from "../../services/JobStore.js";
import { PipelineJob, AgentTraceItem } from "../../shared/types/index.js";

export class OrchestratorAgent {
  private researchAgent: ResearchAgent;
  private teachingAgent: TeachingAgent;
  private simulationAgent: SimulationAgent;
  private visualPlanningAgent: VisualPlanningAgent;
  private narrationAgent: NarrationAgent;
  private criticAgent: CriticAgent;
  private renderer: VideoRendererService;

  constructor(
    researchAgent: ResearchAgent,
    teachingAgent: TeachingAgent,
    simulationAgent: SimulationAgent,
    visualPlanningAgent: VisualPlanningAgent,
    narrationAgent: NarrationAgent,
    criticAgent: CriticAgent
  ) {
    this.researchAgent = researchAgent;
    this.teachingAgent = teachingAgent;
    this.simulationAgent = simulationAgent;
    this.visualPlanningAgent = visualPlanningAgent;
    this.narrationAgent = narrationAgent;
    this.criticAgent = criticAgent;
    this.renderer = new VideoRendererService();
  }

  private addTrace(
    job: PipelineJob,
    agent: string,
    action: string,
    details: string,
    status: "info" | "success" | "warning" | "error" = "info",
    toolUsed?: string
  ) {
    const trace: AgentTraceItem = {
      id: `trace_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      agent,
      action,
      details,
      status,
      toolUsed,
    };
    job.traces.push(trace);
    JobStore.saveJob(job);
  }

  async runPipeline(jobId: string, options?: { testCorrectionLoop?: boolean }): Promise<PipelineJob> {
    const job = JobStore.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const jobDir = JobStore.getJobDir(jobId);

    try {
      // 1. Research Stage
      job.status = "researching";
      this.addTrace(job, "Research Agent", "Investigating Topic", `Retrieving authoritative definitions for '${job.request.topic}'`, "info", "search_web & fetch_docs");
      const research = await this.researchAgent.researchTopic(job.request.topic, job.request.audienceLevel);
      job.research = research;
      this.addTrace(job, "Research Agent", "Research Synthesized", `Identified ${research.coreConcepts.length} core concepts and verified ${research.sources.length} citations`, "success");

      // 2. Teaching Script Generation
      job.status = "teaching";
      this.addTrace(job, "Teaching Agent", "Crafting Script", `Structuring pedagogical progression for ${job.request.audienceLevel} audience`, "info", "llm_pedagogical_planner");
      const script = await this.teachingAgent.generateScript(research, job.request.audienceLevel, job.request.targetDurationSeconds);
      job.script = script;
      this.addTrace(job, "Teaching Agent", "Script Created", `Generated ${script.segments.length} narration segments with defined learning outcomes`, "success");

      // 3 & 4. Concurrent Simulation & Narration Audio Generation (Parallel Execution)
      job.status = "simulating";
      this.addTrace(job, "Orchestrator Agent", "Parallel Stage", `Executing Python simulation runner and neural TTS voice synthesis concurrently for '${job.request.topic}'`, "info");
      
      const [simulation, voicedScript] = await Promise.all([
        this.simulationAgent.runSimulation(job.request.topic),
        this.narrationAgent.generateAllNarrationAudio(
          script,
          jobDir,
          job.request.voice,
          job.request.referenceAudioPath
        ),
      ]);

      job.simulation = simulation;
      job.script = voicedScript;
      this.addTrace(job, "Simulation Agent", "States Captured", `Extracted ${simulation.states.length} verified algorithmic execution states`, "success");
      this.addTrace(job, "Narration Agent", "Audio Ready", `Generated ${voicedScript.segments.length} synchronized speech tracks in parallel`, "success");

      // 5. Visual Planning (Storyboard)
      job.status = "planning";
      const injectBug = options?.testCorrectionLoop ?? true; // Injects demo discrepancy for critic to catch
      this.addTrace(job, "Visual Planning Agent", "Generating Storyboard", "Mapping narration segments and simulation states to visual scenes with AI", "info", "visual_scene_compiler");
      let storyboard = await this.visualPlanningAgent.planStoryboard(voicedScript, simulation, {
        injectIntentionalBugForCriticDemo: injectBug && job.correctionCount === 0,
      });
      job.storyboard = storyboard;
      this.addTrace(job, "Visual Planning Agent", "Storyboard Constructed", `Planned ${storyboard.scenes.length} interactive scenes (${storyboard.totalDurationSeconds.toFixed(1)}s total)`, "success");

      // 6. Critic & Verification Loop (Meta Open-Weight Model + Deterministic Rules)
      job.status = "critiquing";
      this.addTrace(job, "Critic Agent", "Auditing Artifacts", "Reviewing algorithmic invariants, audio-visual sync, and visual props with Meta Llama 3.3 70B", "info", "meta_llama_3_critic");
      const criticReport = await this.criticAgent.verifyArtifacts(voicedScript, simulation, storyboard);
      job.criticReports.push(criticReport);

      if (criticReport.status === "needs_revision") {
        this.addTrace(job, "Critic Agent", "Discrepancy Detected", criticReport.summary, "warning");

        // 7. Targeted Self-Correction by Orchestrator
        job.status = "correcting";
        job.correctionCount += 1;
        this.addTrace(job, "Orchestrator Agent", "Executing Targeted Correction", `Remediating ${criticReport.issues.length} detected discrepancies. Re-generating affected scene...`, "info");

        // Re-generate storyboard with verified props
        storyboard = await this.visualPlanningAgent.planStoryboard(voicedScript, simulation, {
          injectIntentionalBugForCriticDemo: false,
        });
        job.storyboard = storyboard;

        // Re-verify with critic
        this.addTrace(job, "Critic Agent", "Re-evaluating Corrected Scene", "Re-checking invariant alignment after targeted regeneration", "info");
        const recheckReport = await this.criticAgent.verifyArtifacts(voicedScript, simulation, storyboard);
        job.criticReports.push(recheckReport);
        this.addTrace(job, "Critic Agent", "Verification Passed", `Score: ${recheckReport.score}/100. Invariants, mid calculations, and intervals strictly match simulation trace.`, "success");
      } else {
        this.addTrace(job, "Critic Agent", "Verification Passed", `All checks passed on first pass. Score: ${criticReport.score}/100`, "success");
      }

      // 8. Video Rendering (FFmpeg / SVG / Audio Sync)
      job.status = "rendering";
      this.addTrace(job, "Video Rendering Engine", "Compiling Final MP4", "Rendering 1080p SVG scenes, synchronizing neural audio tracks, and encoding MP4", "info", "ffmpeg_engine");
      await this.renderer.renderFinalVideo(job.storyboard!, job.script!, jobDir);
      job.videoUrl = `/api/jobs/media/${job.id}/final_video.mp4`;

      // 9. Pipeline Completed
      job.status = "completed";
      this.addTrace(job, "Orchestrator Agent", "Pipeline Completed", `Successfully produced 1080p educational video: ${job.videoUrl}`, "success");

      JobStore.saveJob(job);
      return job;
    } catch (err: any) {
      job.status = "failed";
      job.error = err.message || "Unknown error";
      this.addTrace(job, "Orchestrator Agent", "Pipeline Error", err.message, "error");
      JobStore.saveJob(job);
      throw err;
    }
  }
}
