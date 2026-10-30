import { SimulationResult, Storyboard, TeachingScript, SceneVisual } from "../../shared/types/index.js";

export class VisualPlanningAgent {
  planStoryboard(
    script: TeachingScript,
    simulation: SimulationResult,
    options?: { injectIntentionalBugForCriticDemo?: boolean }
  ): Storyboard {
    const scenes: SceneVisual[] = [];
    const states = simulation.states;
    const isBloom = simulation.algorithm === "Bloom Filter";

    script.segments.forEach((seg, idx) => {
      const sceneId = `scene_0${idx + 1}`;
      let component = isBloom ? "BloomFilterAnimation" : "BinarySearchAnimation";
      let visualType: any = "algorithm_animation";
      let simStateIds: number[] = [];
      let highlightElements: string[] = [];
      let customProps: Record<string, any> = {};

      if (isBloom) {
        const stateIdx = Math.min(idx, states.length - 1);
        const curState = states[stateIdx] || states[0];
        simStateIds = [curState.step];

        if (idx === 0) {
          visualType = "concept_card";
          component = "BloomFilterHeroCard";
          highlightElements = ["bit_array_init", "hash_diagram"];
          customProps = {
            headline: "Bloom Filter: Constant-Time Probabilistic Filter",
            subtext: "0% False Negatives • O(k) Constant Hash Overhead",
            array: curState.stateData.array || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            algorithm: "Bloom Filter",
            explanation: curState.description,
          };
        } else if (idx === 1) {
          highlightElements = ["item_hashing", "bits_flipped"];
          customProps = {
            stateIndex: 1,
            simulationState: curState.stateData,
            algorithm: "Bloom Filter",
            explanation: curState.description,
          };
        } else if (idx === 2) {
          highlightElements = ["zero_detected", "definite_no"];
          customProps = {
            stateIndex: 2,
            simulationState: curState.stateData,
            algorithm: "Bloom Filter",
            explanation: curState.description,
          };
        } else {
          highlightElements = ["all_ones_match", "false_positive_risk"];
          customProps = {
            stateIndex: 3,
            simulationState: curState.stateData,
            algorithm: "Bloom Filter",
            explanation: curState.description,
          };
        }
      } else {
        // Binary Search
        if (idx === 0) {
          visualType = "concept_card";
          component = "BinarySearchHeroCard";
          simStateIds = [1];
          highlightElements = ["title", "sorted_rule"];
          customProps = {
            headline: "Why Divide & Conquer Wins",
            subtext: "O(log n) vs O(n) Linear Scanning",
            array: states[0]?.stateData?.array || [7, 14, 21, 28, 35, 42, 49, 56, 63],
            algorithm: "Binary Search",
          };
        } else if (idx === 1) {
          simStateIds = [1];
          highlightElements = ["left_pointer", "right_pointer", "mid_calc"];
          customProps = {
            stateIndex: 0,
            simulationState: states[0]?.stateData,
            algorithm: "Binary Search",
            explanation: "Initialize Left at 0, Right at 8",
          };
        } else if (idx === 2) {
          simStateIds = [2];
          if (options?.injectIntentionalBugForCriticDemo) {
            highlightElements = ["wrong_node_pointer"];
            customProps = {
              stateIndex: 1,
              simulationState: {
                ...states[1]?.stateData,
                mid: 1,
                midVal: 14,
              },
              algorithm: "Binary Search",
              explanation: "Buggy preview: Middle index mismatch with simulation",
            };
          } else {
            highlightElements = ["mid_pointer", "eliminated_interval", "new_bounds"];
            customProps = {
              stateIndex: 1,
              simulationState: states[1]?.stateData,
              algorithm: "Binary Search",
              explanation: "Mid is 35 (< 42). Discarding indices 0 through 4.",
            };
          }
        } else {
          const lastState = states[states.length - 1] || states[0];
          simStateIds = [lastState.step];
          highlightElements = ["match_glow", "complexity_badge"];
          customProps = {
            stateIndex: states.length - 1,
            simulationState: lastState.stateData,
            algorithm: "Binary Search",
            explanation: `Target matched at index ${lastState.stateData?.mid}!`,
          };
        }
      }

      scenes.push({
        sceneId,
        title: seg.concept,
        concept: seg.concept,
        visualType,
        component,
        simulationStateIds: simStateIds,
        narrationSegmentIds: [seg.segmentId],
        durationSeconds: seg.audioDurationSeconds || 6.5,
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
