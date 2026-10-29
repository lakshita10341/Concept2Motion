export class VisualPlanningAgent {
    planStoryboard(script, simulation, options) {
        const scenes = [];
        const states = simulation.states;
        script.segments.forEach((seg, idx) => {
            const sceneId = `scene_0${idx + 1}`;
            let component = "BinarySearchAnimation";
            let visualType = "algorithm_animation";
            let simStateIds = [];
            let highlightElements = [];
            let customProps = {};
            if (idx === 0) {
                visualType = "concept_card";
                component = "BinarySearchHeroCard";
                simStateIds = [1];
                highlightElements = ["title", "sorted_rule"];
                customProps = {
                    headline: "Why Divide & Conquer Wins",
                    subtext: "O(log n) vs O(n) Linear Scanning",
                    array: states[0]?.stateData?.array || [7, 14, 21, 28, 35, 42, 49, 56, 63],
                };
            }
            else if (idx === 1) {
                simStateIds = [1];
                highlightElements = ["left_pointer", "right_pointer", "mid_calc"];
                customProps = {
                    stateIndex: 0,
                    simulationState: states[0]?.stateData,
                    explanation: "Initialize Left at 0, Right at 8",
                };
            }
            else if (idx === 2) {
                // Step 2 in simulation: middle checked and left discarded
                simStateIds = [2];
                // DEMO INJECTION: If requested, inject an intentional discrepancy for the Critic to catch!
                if (options?.injectIntentionalBugForCriticDemo) {
                    highlightElements = ["wrong_node_pointer"]; // Intentionally faulty highlight
                    customProps = {
                        stateIndex: 1,
                        simulationState: {
                            ...states[1]?.stateData,
                            mid: 1, // BUG: Claiming mid is index 1 instead of index 4!
                            midVal: 14,
                        },
                        explanation: "Buggy preview: Middle index mismatch with simulation",
                    };
                }
                else {
                    highlightElements = ["mid_pointer", "eliminated_interval", "new_bounds"];
                    customProps = {
                        stateIndex: 1,
                        simulationState: states[1]?.stateData,
                        explanation: "Mid is 35 (< 42). Discarding indices 0 through 4.",
                    };
                }
            }
            else {
                // Final match scene
                const lastState = states[states.length - 1] || states[0];
                simStateIds = [lastState.step];
                highlightElements = ["match_glow", "complexity_badge"];
                customProps = {
                    stateIndex: states.length - 1,
                    simulationState: lastState.stateData,
                    explanation: `Target matched at index ${lastState.stateData?.mid}!`,
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
