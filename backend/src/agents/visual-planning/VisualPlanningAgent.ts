import { SimulationResult, Storyboard, TeachingScript, SceneVisual } from "../../shared/types/index.js";
import { LLMProvider } from "../../providers/fireworks/FireworksLlamaProvider.js";

export interface AIDiagramSpec {
  stepNumber: number;
  badgeText: string;
  statusText: string;
  metricText: string;
  nodeA: { title: string; subtitle: string; role: string; status: string };
  nodeB: { title: string; subtitle: string; role: string; status: string };
  nodeC: { title: string; subtitle: string; role: string; status: string };
  flow: { source: string; target: string; packetLabel: string; active: boolean };
  invariant: { badge: string; rule: string };
}

export class VisualPlanningAgent {
  private llm?: LLMProvider;

  constructor(llm?: LLMProvider) {
    this.llm = llm;
  }

  async planStoryboard(
    script: TeachingScript,
    simulation: SimulationResult,
    options?: { injectIntentionalBugForCriticDemo?: boolean }
  ): Promise<Storyboard> {
    const scenes: SceneVisual[] = [];
    const states = simulation.states || [];
    const algo = simulation.algorithm;
    const isBinarySearch = algo === "Binary Search";
    const isBloom = algo === "Bloom Filter";

    // 1. AI-Driven Visual Scene Generation for Architectural / Protocol Topics
    let aiDiagramSpecs: AIDiagramSpec[] = [];
    if (!isBinarySearch && !isBloom && this.llm) {
      try {
        const prompt = `You are an expert Technical Diagram and Systems Architecture Animator for short-form engineering reels.
Given this video title and narration segments, generate a custom 3-node technical architecture scene for EACH segment.

Topic: "${script.title}"
Segments:
${script.segments.map((s, i) => `Step ${i + 1}: [${s.concept}] - "${s.narrationText}"`).join("\n")}

For EVERY step (1 to ${script.segments.length}), output a strictly valid JSON array of ${script.segments.length} objects matching:
[
  {
    "stepNumber": 1,
    "badgeText": "STAGE / INTENT BADGE",
    "statusText": "CURRENT STATUS",
    "metricText": "REAL STAT / METRIC",
    "nodeA": { "title": "INGRESS ACTOR", "subtitle": "ROLE / TECH", "role": "CLIENT", "status": "ACTIVE" },
    "nodeB": { "title": "SWITCH / ENGINE", "subtitle": "ORCHESTRATOR", "role": "SWITCH", "status": "PROCESSING" },
    "nodeC": { "title": "TARGET / STORE", "subtitle": "PERSISTENCE", "role": "STORE", "status": "STANDBY" },
    "flow": { "source": "nodeA", "target": "nodeB", "packetLabel": "PACKET_NAME: DATA", "active": true },
    "invariant": { "badge": "INVARIANT BADGE", "rule": "Concrete technical rule" }
  }
]
Return ONLY strictly valid JSON array without markdown wrapping.`;

        const response = await this.llm.generateCompletion(
          [
            { role: "system", content: "You are an expert technical diagram designer. Always output strictly valid JSON array." },
            { role: "user", content: prompt }
          ],
          { jsonMode: true, temperature: 0.2 }
        );

        let cleaned = response.trim();
        if (cleaned.includes("```")) {
          const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          cleaned = match ? match[1].trim() : cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
        }
        const firstBracket = cleaned.indexOf("[");
        const lastBracket = cleaned.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          cleaned = cleaned.substring(firstBracket, lastBracket + 1);
        }

        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          aiDiagramSpecs = parsed;
          console.log(`[VisualPlanningAgent] AI successfully generated ${aiDiagramSpecs.length} custom scene diagrams for "${script.title}"`);
        }
      } catch (err: any) {
        console.warn(`[VisualPlanningAgent] Could not generate AI diagrams for "${script.title}":`, err.message);
      }
    }

    script.segments.forEach((seg, idx) => {
      const sceneId = `scene_0${idx + 1}`;
      let visualType: any = "concept_card";
      let component = "ArchitectureCard";
      let simStateIds: number[] = [];
      let highlightElements: string[] = [];
      let customProps: Record<string, any> = {};

      if (isBinarySearch) {
        visualType = "algorithm_animation";
        component = "BinarySearchAnimation";
        const stateIdx = Math.min(idx, states.length - 1);
        const curState = states[stateIdx] || states[0];
        simStateIds = [curState.step];

        if (idx === 0) {
          visualType = "concept_card";
          component = "BinarySearchHeroCard";
          highlightElements = ["title", "sorted_rule"];
          customProps = {
            algorithm: "Binary Search",
            headline: "Binary Search: Divide & Conquer",
            subtext: "O(log n) vs O(n) Linear Scanning",
            explanation: seg.learningOutcome || "Ordered sequences enable logarithmic lookup",
            simulationState: curState.stateData,
          };
        } else if (idx === 1) {
          highlightElements = ["left_pointer", "right_pointer", "mid_calc"];
          customProps = {
            algorithm: "Binary Search",
            stateIndex: 0,
            simulationState: states[0]?.stateData,
            explanation: "Initialize Left at 0, Right at 8. Mid = 4.",
          };
        } else if (idx === 2) {
          if (options?.injectIntentionalBugForCriticDemo) {
            highlightElements = ["wrong_node_pointer"];
            customProps = {
              algorithm: "Binary Search",
              stateIndex: 1,
              simulationState: {
                ...states[1]?.stateData,
                mid: 1,
                midVal: 14,
              },
              explanation: "Buggy preview: Middle index mismatch with simulation",
            };
          } else {
            highlightElements = ["mid_pointer", "eliminated_interval", "new_bounds"];
            customProps = {
              algorithm: "Binary Search",
              stateIndex: 1,
              simulationState: states[1]?.stateData,
              explanation: "Mid is 35 (< 42). Discarding left interval [0..4].",
            };
          }
        } else {
          const lastState = states[states.length - 1] || states[0];
          highlightElements = ["match_glow", "complexity_badge"];
          customProps = {
            algorithm: "Binary Search",
            stateIndex: states.length - 1,
            simulationState: lastState.stateData,
            explanation: `Target matched at index ${lastState.stateData?.mid}!`,
          };
        }
      } else if (isBloom) {
        visualType = "algorithm_animation";
        component = "BloomFilterAnimation";
        const stateIdx = Math.min(idx, states.length - 1);
        const curState = states[stateIdx] || states[0];
        simStateIds = [curState.step];

        customProps = {
          algorithm: "Bloom Filter",
          stateIndex: stateIdx,
          simulationState: curState.stateData,
          explanation: curState.description,
        };
      } else {
        // Universal AI-Driven Architectural Diagram (No hardcoded topics)
        visualType = "diagram";
        component = "ArchitectureDiagram";
        simStateIds = [idx + 1];

        const aiSpec = aiDiagramSpecs[idx] || null;

        customProps = {
          algorithm: algo || "System Architecture",
          stepNumber: idx + 1,
          totalSteps: script.segments.length,
          conceptTitle: seg.concept,
          learningOutcome: seg.learningOutcome,
          narrationSummary: seg.narrationText.slice(0, 110) + "...",
          explanation: seg.learningOutcome,
          allConcepts: script.segments.map((s) => s.concept),
          allOutcomes: script.segments.map((s) => s.learningOutcome),
          diagramSpec: aiSpec,
        };
      }

      // Attach speech word-level timestamps to customProps for frame synchronization
      customProps.wordTimings = seg.wordTimings || [];
      customProps.narrationText = seg.narrationText;

      scenes.push({
        sceneId,
        title: seg.concept,
        concept: seg.concept,
        visualType,
        component,
        simulationStateIds: simStateIds,
        narrationSegmentIds: [seg.segmentId],
        durationSeconds: seg.audioDurationSeconds || 8.0,
        highlightElements,
        customProps,
        transition: "fade",
      });
    });

    const totalDurationSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);

    return {
      totalDurationSeconds,
      scenes,
    };
  }
}
