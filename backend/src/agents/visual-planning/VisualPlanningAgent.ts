import { SimulationResult, Storyboard, TeachingScript, SceneVisual } from "../../shared/types/index.js";

export class VisualPlanningAgent {
  planStoryboard(
    script: TeachingScript,
    simulation: SimulationResult,
    options?: { injectIntentionalBugForCriticDemo?: boolean }
  ): Storyboard {
    const scenes: SceneVisual[] = [];
    const states = simulation.states || [];
    const algo = simulation.algorithm;
    const isBinarySearch = algo === "Binary Search";
    const isBloom = algo === "Bloom Filter";

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
        // Universal / Protocol / Architecture / Network Topics (e.g. SSL, DNS, B-Tree, TCP, OS Scheduling)
        visualType = "diagram";
        component = "ProtocolArchitectureDiagram";
        simStateIds = [idx + 1];

        customProps = {
          algorithm: "ProtocolDiagram",
          stepNumber: idx + 1,
          totalSteps: script.segments.length,
          conceptTitle: seg.concept,
          learningOutcome: seg.learningOutcome,
          narrationSummary: seg.narrationText.slice(0, 110) + "...",
          explanation: seg.learningOutcome,
        };
      }

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
