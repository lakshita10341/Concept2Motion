export class VisualPlanningAgent {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    /**
     * Generates pure Python Manim code for the entire storyboard following Reel-Generator-Engine standards.
     */
    generateProceduralManimScript(script) {
        const sanitizeName = (str) => str.replace(/[^a-zA-Z0-9]/g, "");
        const sceneClasses = script.segments.map((seg, idx) => {
            const sceneNum = String(idx + 1).padStart(2, "0");
            const safeConcept = sanitizeName(seg.concept) || `Beat${sceneNum}`;
            const className = `Scene${sceneNum}_${safeConcept}`;
            const duration = Math.max(3.0, seg.audioDurationSeconds || 8.0);
            const hudTitle = seg.concept.toUpperCase().slice(0, 28);
            if (idx === 0) {
                // Ingress / Hook Scene
                const runTime1 = 0.8;
                const runTime2 = 1.2;
                const pad = Math.max(0.1, Number((duration - (runTime1 + runTime2)).toFixed(2)));
                return `
class ${className}(Scene):
    def construct(self):
        # 1. Top HUD (y >= 5.8)
        hud = Text("${hudTitle}", font="DejaVu Sans Mono", font_size=20, color="#94A3B8").move_to(UP * 5.8)
        self.add(hud)

        # 2. Ingress Nodes
        node_a = Circle(radius=0.75, color="#0EA5E9", fill_opacity=0.25).shift(LEFT * 2.4 + UP * 2.4)
        lbl_a = Text("CLIENT", font="DejaVu Sans Mono", font_size=15, color="#F1F5F9").move_to(node_a.get_center())

        node_b = Circle(radius=0.75, color="#F59E0B", fill_opacity=0.25).shift(RIGHT * 2.4 + UP * 2.4)
        lbl_b = Text("GATEWAY", font="DejaVu Sans Mono", font_size=15, color="#F1F5F9").move_to(node_b.get_center())

        link = Line(node_a.get_right(), node_b.get_left(), color="#334155", stroke_width=3.5)
        packet = Dot(color="#38BDF8", radius=0.2).move_to(node_a.get_center())

        # 3. Procedural Motion
        self.play(Create(node_a), Write(lbl_a), Create(node_b), Write(lbl_b), Create(link), run_time=${runTime1})
        self.play(MoveAlongPath(packet, link), run_time=${runTime2})
        self.wait(${pad})
`;
            }
            else if (idx === 1) {
                // Execution / Pipeline Scene
                const runTime1 = 0.8;
                const runTime2 = 0.5;
                const runTime3 = 1.0;
                const pad = Math.max(0.1, Number((duration - (runTime1 + runTime2 + runTime3)).toFixed(2)));
                return `
class ${className}(Scene):
    def construct(self):
        hud = Text("${hudTitle}", font="DejaVu Sans Mono", font_size=20, color="#94A3B8").move_to(UP * 5.8)
        self.add(hud)

        # 3 Register Pipeline Cells
        cells = VGroup(*[
            Square(side_length=1.3, color="#1E293B", fill_color="#0F172A", fill_opacity=0.9).set_stroke(color="#334155", width=2.5)
            for _ in range(3)
        ]).arrange(RIGHT, buff=0.5).shift(UP * 2.5)

        labels = VGroup(*[
            Text(f"R{i}", font="DejaVu Sans Mono", font_size=20, color="#64748B").move_to(c.get_center())
            for i, c in enumerate(cells)
        ])

        pointer = Arrow(DOWN * 0.8, UP * 0.2, color="#F59E0B").next_to(cells[0], DOWN, buff=0.25)

        self.play(Create(cells), Write(labels), run_time=${runTime1})
        self.play(Create(pointer), run_time=${runTime2})
        self.play(
            cells[0].animate.set_stroke(color="#10B981", width=3.5).set_fill("#064E3B", opacity=0.8),
            pointer.animate.next_to(cells[1], DOWN, buff=0.25),
            run_time=${runTime3}
        )
        self.wait(${pad})
`;
            }
            else if (idx === 2) {
                // Fault Injection / Partition Scene
                const runTime1 = 0.8;
                const runTime2 = 0.8;
                const pad = Math.max(0.1, Number((duration - (runTime1 + runTime2)).toFixed(2)));
                return `
class ${className}(Scene):
    def construct(self):
        hud = Text("${hudTitle}", font="DejaVu Sans Mono", font_size=20, color="#EF4444").move_to(UP * 5.8)
        self.add(hud)

        part_a = RoundedRectangle(corner_radius=0.15, width=2.8, height=2.2, color="#334155", fill_color="#0F172A", fill_opacity=0.9).shift(LEFT * 1.8 + UP * 2.4)
        lbl_a = Text("NODE_1", font="DejaVu Sans Mono", font_size=15, color="#F1F5F9").move_to(part_a.get_center())

        part_b = RoundedRectangle(corner_radius=0.15, width=2.8, height=2.2, color="#334155", fill_color="#0F172A", fill_opacity=0.9).shift(RIGHT * 1.8 + UP * 2.4)
        lbl_b = Text("NODE_2", font="DejaVu Sans Mono", font_size=15, color="#F1F5F9").move_to(part_b.get_center())

        bus = Line(part_a.get_right(), part_b.get_left(), color="#334155", stroke_width=3)
        cut = Text("⚡", font_size=28, color="#EF4444").move_to(bus.get_center())

        self.play(Create(part_a), Write(lbl_a), Create(part_b), Write(lbl_b), Create(bus), run_time=${runTime1})
        self.play(
            part_b.animate.set_stroke(color="#EF4444", width=3).set_fill("#450A0A", opacity=0.8),
            bus.animate.set_color("#EF4444"),
            FadeIn(cut),
            run_time=${runTime2}
        )
        self.wait(${pad})
`;
            }
            else {
                // Invariant Verification / Convergence Scene
                const runTime1 = 0.8;
                const runTime2 = 1.0;
                const pad = Math.max(0.1, Number((duration - (runTime1 + runTime2)).toFixed(2)));
                return `
class ${className}(Scene):
    def construct(self):
        hud = Text("${hudTitle}", font="DejaVu Sans Mono", font_size=20, color="#10B981").move_to(UP * 5.8)
        self.add(hud)

        hub = Circle(radius=0.85, color="#10B981", fill_opacity=0.25).shift(UP * 2.5)
        hub_lbl = Text("QUORUM", font="DejaVu Sans Mono", font_size=16, color="#F1F5F9").move_to(hub.get_center())

        check = Text("✓", font="DejaVu Sans Mono", font_size=32, color="#10B981").next_to(hub, DOWN, buff=0.4)
        metric = Text("CONSISTENT", font="DejaVu Sans Mono", font_size=14, color="#94A3B8").next_to(check, DOWN, buff=0.2)

        self.play(Create(hub), Write(hub_lbl), run_time=${runTime1})
        self.play(FadeIn(check, shift=UP*0.2), FadeIn(metric), run_time=${runTime2})
        self.wait(${pad})
`;
            }
        });
        return `from manim import *
from manim.utils.rate_functions import ease_out_cubic

# Responsive 9:16 vertical geometry at 1080x1920
if config.pixel_width > config.pixel_height:
    config.pixel_width, config.pixel_height = config.pixel_height, config.pixel_width
config.frame_width = 9.0
config.frame_height = 16.0
config.background_color = "#07090E"

${sceneClasses.join("\n")}
`;
    }
    async planStoryboard(script, simulation, options) {
        const scenes = [];
        // 1. Generate AI-driven Manim scenes code via LLM if available
        let manimScript = undefined;
        if (this.llm) {
            try {
                const prompt = `You are an expert Manim animator creating short-form 9:16 vertical engineering video reels.
Write a valid Python Manim script that visualizes the following technical topic.

Topic: "${script.title}"
Segments with durations:
${script.segments.map((s, i) => `Step ${i + 1}: [${s.concept}] (${(s.audioDurationSeconds || 8.0).toFixed(1)}s) - "${s.narrationText}"`).join("\n")}

STRICT ANTI-AI-SLOP & REEL GENERATOR RULES:
1. Output Python code with class names Scene01_..., Scene02_..., etc. (one per segment, starting with "Scene").
2. 9:16 vertical geometry:
   - Upper 2/3 active zone: x in [-3.9, 3.9], y in [-1.6, 6.6].
   - Lower third (y < -1.8) MUST REMAIN PITCH BLACK AND EMPTY for the speaking avatar and captions.
3. Typography & Styling:
   - font="DejaVu Sans Mono"
   - Canvas background: "#07090E"
   - Palette: 60% slate background ("#07090E"), 30% structural lines/nodes ("#1E293B", "#334155", "#94A3B8"), 10% accent ("#0EA5E9" or "#F59E0B").
4. Visual Storytelling (NO AI-SLOP TEXT CARDS):
   - Never mirror the narration script text inside cards or boxes!
   - Purely show naked architectural structures: Circle nodes, Line/Arrow connections, Dot packets moving along paths (MoveAlongPath), Square register cells, sliding pointer arrows, or partition cuts.
   - Top HUD telemetry at y=5.8 (font_size=20, max 2-3 words).
5. Exact Timing:
   - Each scene's animation run_times + self.wait(pad) MUST EQUAL the segment's duration in seconds.
6. NO LaTeX or MathTex. Use Text(...) only.

Output ONLY executable Python code starting with "from manim import *" without markdown ticks or explanation.`;
                const response = await this.llm.generateCompletion([
                    { role: "system", content: "You are an expert Manim animator. Always output clean, executable Python code for Manim Community." },
                    { role: "user", content: prompt }
                ], { temperature: 0.2 });
                let cleaned = response.trim();
                if (cleaned.includes("```")) {
                    const match = cleaned.match(/```(?:python)?\s*([\s\S]*?)\s*```/);
                    cleaned = match ? match[1].trim() : cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
                }
                // Verify that the LLM generated class Scene definitions
                if (cleaned.includes("from manim import") && cleaned.includes("class Scene")) {
                    manimScript = cleaned;
                    console.log(`[VisualPlanningAgent] LLM generated custom Manim scenes for "${script.title}"`);
                }
            }
            catch (err) {
                console.warn(`[VisualPlanningAgent] Could not generate LLM Manim script for "${script.title}":`, err.message);
            }
        }
        // Fallback to high-grade procedural Manim script if LLM did not provide valid code
        if (!manimScript) {
            console.log(`[VisualPlanningAgent] Using procedural Manim engine for "${script.title}"`);
            manimScript = this.generateProceduralManimScript(script);
        }
        // 2. Build metadata SceneVisual array for critic & orchestrator verification
        script.segments.forEach((seg, idx) => {
            const sceneId = `scene_0${idx + 1}`;
            const durationSeconds = seg.audioDurationSeconds || 8.0;
            scenes.push({
                sceneId,
                title: seg.concept,
                concept: seg.concept,
                visualType: "diagram",
                component: `Scene0${idx + 1}_Manim`,
                simulationStateIds: [idx + 1],
                narrationSegmentIds: [seg.segmentId],
                durationSeconds,
                highlightElements: ["manim_procedural_nodes"],
                customProps: {
                    conceptTitle: seg.concept,
                    learningOutcome: seg.learningOutcome,
                    narrationText: seg.narrationText,
                    wordTimings: seg.wordTimings || [],
                    durationSeconds,
                },
                transition: "fade",
            });
        });
        const totalDurationSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
        return {
            totalDurationSeconds,
            scenes,
            manimScript,
        };
    }
}
