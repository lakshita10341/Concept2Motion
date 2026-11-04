import { SimulationResult, Storyboard, TeachingScript, SceneVisual } from "../../shared/types/index.js";
import { LLMProvider } from "../../providers/fireworks/FireworksLlamaProvider.js";
import { spawnSync } from "child_process";

export class VisualPlanningAgent {
  private llm?: LLMProvider;

  constructor(llm?: LLMProvider) {
    this.llm = llm;
  }

  /**
   * Validates Python syntax and verifies all expected scene classes exist.
   */
  private validateManimScript(code: string, expectedSceneCount: number): boolean {
    try {
      const matches = [...code.matchAll(/class\s+(Scene\w+)\s*\(/g)];
      if (matches.length < expectedSceneCount) {
        console.warn(`[VisualPlanningAgent] Manim script missing scenes: expected ${expectedSceneCount}, found ${matches.length}`);
        return false;
      }

      const res = spawnSync("python3", ["-c", "import ast, sys; ast.parse(sys.stdin.read())"], {
        input: code,
        encoding: "utf-8",
        timeout: 4000,
      });

      if (res.status !== 0) {
        console.warn(`[VisualPlanningAgent] Python AST validation failed:\n${res.stderr || "Syntax error"}`);
        return false;
      }

      return true;
    } catch (err: any) {
      console.warn(`[VisualPlanningAgent] Python validation error:`, err.message);
      return false;
    }
  }

  /**
   * Generates a single procedural Manim scene class for a given segment index.
   */
  public generateSingleProceduralScene(
    seg: TeachingScript["segments"][0],
    idx: number,
    sceneNumStr: string
  ): string {
    const sanitizeName = (str: string) => str.replace(/[^a-zA-Z0-9]/g, "");
    const safeConcept = sanitizeName(seg.concept) || `Beat${sceneNumStr}`;
    const className = `Scene${sceneNumStr}_${safeConcept}`;
    const duration = Math.max(3.0, seg.audioDurationSeconds || 8.0);
    const hudTitle = seg.concept.toUpperCase().slice(0, 28);

    if (idx === 0) {
      // Ingress / Client Gateway
      const runTime1 = 0.8;
      const runTime2 = 1.2;
      const pad = Math.max(0.1, Number((duration - (runTime1 + runTime2)).toFixed(2)));

      return `class ${className}(Scene):
    def construct(self):
        hud = Text("${hudTitle}", font="DejaVu Sans Mono", font_size=20, color="#94A3B8").move_to(UP * 5.8)
        self.add(hud)
        node_a = Circle(radius=0.75, color="#0EA5E9", fill_opacity=0.25).shift(LEFT * 2.4 + UP * 2.4)
        lbl_a = Text("CLIENT", font="DejaVu Sans Mono", font_size=15, color="#F1F5F9").move_to(node_a.get_center())
        node_b = Circle(radius=0.75, color="#F59E0B", fill_opacity=0.25).shift(RIGHT * 2.4 + UP * 2.4)
        lbl_b = Text("GATEWAY", font="DejaVu Sans Mono", font_size=15, color="#F1F5F9").move_to(node_b.get_center())
        link = Line(node_a.get_right(), node_b.get_left(), color="#334155", stroke_width=3.5)
        packet = Dot(color="#38BDF8", radius=0.2).move_to(node_a.get_center())
        self.play(Create(node_a), Write(lbl_a), Create(node_b), Write(lbl_b), Create(link), run_time=${runTime1})
        self.play(MoveAlongPath(packet, link), run_time=${runTime2})
        self.wait(${pad})
`;
    } else if (idx === 1) {
      // Execution Pipeline / Memory Registers
      const runTime1 = 0.8;
      const runTime2 = 0.4;
      const runTime3 = 1.0;
      const pad = Math.max(0.1, Number((duration - (runTime1 + runTime2 + runTime3)).toFixed(2)));

      return `class ${className}(Scene):
    def construct(self):
        hud = Text("${hudTitle}", font="DejaVu Sans Mono", font_size=20, color="#94A3B8").move_to(UP * 5.8)
        self.add(hud)
        cells = VGroup(*[
            Square(side_length=1.3, color="#1E293B", fill_color="#0F172A", fill_opacity=0.9).set_stroke(color="#334155", width=2.5)
            for _ in range(3)
        ]).arrange(RIGHT, buff=0.5).shift(UP * 2.5)
        labels = VGroup(*[Text(f"R{i}", font="DejaVu Sans Mono", font_size=20, color="#64748B").move_to(c.get_center()) for i, c in enumerate(cells)])
        pointer = Arrow(DOWN * 0.8, UP * 0.2, color="#F59E0B").next_to(cells[0], DOWN, buff=0.25)
        self.play(Create(cells), Write(labels), run_time=${runTime1})
        self.play(Create(pointer), run_time=${runTime2})
        self.play(cells[0].animate.set_stroke(color="#10B981", width=3.5).set_fill("#064E3B", opacity=0.8), pointer.animate.next_to(cells[1], DOWN, buff=0.25), run_time=${runTime3})
        self.wait(${pad})
`;
    } else if (idx === 2) {
      // Storage Topology & Partition
      const runTime1 = 1.0;
      const runTime2 = 1.0;
      const pad = Math.max(0.1, Number((duration - (runTime1 + runTime2)).toFixed(2)));

      return `class ${className}(Scene):
    def construct(self):
        hud = Text("${hudTitle}", font="DejaVu Sans Mono", font_size=20, color="#94A3B8").move_to(UP * 5.8)
        self.add(hud)
        hub = Circle(radius=0.85, color="#0EA5E9", fill_opacity=0.25).shift(UP * 3.5)
        hub_lbl = Text("ENGINE", font="DejaVu Sans Mono", font_size=15, color="#F1F5F9").move_to(hub.get_center())
        p1 = RoundedRectangle(corner_radius=0.15, width=2.4, height=1.6, color="#334155", fill_color="#0F172A", fill_opacity=0.9).shift(LEFT * 2.0 + UP * 1.5)
        p1_lbl = Text("STORE_A", font="DejaVu Sans Mono", font_size=14, color="#94A3B8").move_to(p1.get_center())
        p2 = RoundedRectangle(corner_radius=0.15, width=2.4, height=1.6, color="#334155", fill_color="#0F172A", fill_opacity=0.9).shift(RIGHT * 2.0 + UP * 1.5)
        p2_lbl = Text("STORE_B", font="DejaVu Sans Mono", font_size=14, color="#94A3B8").move_to(p2.get_center())
        l1 = Line(hub.get_bottom(), p1.get_top(), color="#334155", stroke_width=3)
        l2 = Line(hub.get_bottom(), p2.get_top(), color="#334155", stroke_width=3)
        self.play(Create(hub), Write(hub_lbl), Create(l1), Create(l2), Create(p1), Write(p1_lbl), Create(p2), Write(p2_lbl), run_time=${runTime1})
        pkt1 = Dot(color="#38BDF8", radius=0.18).move_to(hub.get_center())
        pkt2 = Dot(color="#F59E0B", radius=0.18).move_to(hub.get_center())
        self.play(MoveAlongPath(pkt1, l1), MoveAlongPath(pkt2, l2), run_time=${runTime2})
        self.wait(${pad})
`;
    } else if (idx === 3) {
      // Fault Injection / Network Sever
      const runTime1 = 0.8;
      const runTime2 = 0.8;
      const pad = Math.max(0.1, Number((duration - (runTime1 + runTime2)).toFixed(2)));

      return `class ${className}(Scene):
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
        self.play(part_b.animate.set_stroke(color="#EF4444", width=3).set_fill("#450A0A", opacity=0.8), bus.animate.set_color("#EF4444"), FadeIn(cut), run_time=${runTime2})
        self.wait(${pad})
`;
    } else if (idx === 4) {
      // Quorum Election
      const runTime1 = 0.8;
      const runTime2 = 1.0;
      const pad = Math.max(0.1, Number((duration - (runTime1 + runTime2)).toFixed(2)));

      return `class ${className}(Scene):
    def construct(self):
        hud = Text("${hudTitle}", font="DejaVu Sans Mono", font_size=20, color="#10B981").move_to(UP * 5.8)
        self.add(hud)
        nodes = VGroup(*[Circle(radius=0.6, color="#334155", stroke_width=3) for _ in range(3)]).arrange(RIGHT, buff=1.0).shift(UP * 2.5)
        labels = VGroup(*[Text(f"N{i+1}", font="DejaVu Sans Mono", font_size=15, color="#94A3B8").move_to(n.get_center()) for i, n in enumerate(nodes)])
        self.play(Create(nodes), Write(labels), run_time=${runTime1})
        vote_text = Text("QUORUM: 2/3 VOTED", font="DejaVu Sans Mono", font_size=16, color="#10B981").next_to(nodes, DOWN, buff=0.5)
        self.play(nodes[0].animate.set_color("#10B981").set_fill("#064E3B", opacity=0.6), nodes[1].animate.set_color("#10B981").set_fill("#064E3B", opacity=0.6), FadeIn(vote_text), run_time=${runTime2})
        self.wait(${pad})
`;
    } else {
      // Invariant Proof / Consistent State
      const runTime1 = 0.8;
      const runTime2 = 1.0;
      const pad = Math.max(0.1, Number((duration - (runTime1 + runTime2)).toFixed(2)));

      return `class ${className}(Scene):
    def construct(self):
        hud = Text("${hudTitle}", font="DejaVu Sans Mono", font_size=20, color="#10B981").move_to(UP * 5.8)
        self.add(hud)
        hub = Circle(radius=0.85, color="#10B981", fill_opacity=0.25).shift(UP * 2.8)
        hub_lbl = Text("VERIFIED", font="DejaVu Sans Mono", font_size=16, color="#F1F5F9").move_to(hub.get_center())
        check = Text("✓", font="DejaVu Sans Mono", font_size=36, color="#10B981").next_to(hub, DOWN, buff=0.4)
        metric = Text("CONSISTENT STATE", font="DejaVu Sans Mono", font_size=15, color="#94A3B8").next_to(check, DOWN, buff=0.2)
        self.play(Create(hub), Write(hub_lbl), run_time=${runTime1})
        self.play(FadeIn(check, shift=UP*0.2), FadeIn(metric), run_time=${runTime2})
        self.wait(${pad})
`;
    }
  }

  /**
   * Generates pure Python Manim code for the entire storyboard following Reel-Generator-Engine standards.
   */
  public generateProceduralManimScript(script: TeachingScript): string {
    const sceneClasses = script.segments.map((seg, idx) => {
      const sceneNumStr = String(idx + 1).padStart(2, "0");
      return this.generateSingleProceduralScene(seg, idx, sceneNumStr);
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

  /**
   * Attempts to salvage and repair complete scene classes from an incomplete/truncated script.
   */
  private repairManimScript(rawCode: string, script: TeachingScript): string {
    const header = `from manim import *
from manim.utils.rate_functions import ease_out_cubic

if config.pixel_width > config.pixel_height:
    config.pixel_width, config.pixel_height = config.pixel_height, config.pixel_width
config.frame_width = 9.0
config.frame_height = 16.0
config.background_color = "#07090E"
`;

    const repairedScenes: string[] = [];

    script.segments.forEach((seg, idx) => {
      const sceneNumStr = String(idx + 1).padStart(2, "0");
      // Search for class SceneXX in rawCode
      const regex = new RegExp(`(class\\s+Scene${sceneNumStr}_[\\s\\S]*?)(?=(class\\s+Scene\\d+|\\Z))`, "g");
      const match = regex.exec(rawCode);

      let validClass: string | null = null;
      if (match && match[1]) {
        const candidate = match[1].trim();
        // Check if candidate compiles standalone
        const testScript = `${header}\n${candidate}\n`;
        const testRes = spawnSync("python3", ["-c", "import ast, sys; ast.parse(sys.stdin.read())"], {
          input: testScript,
          encoding: "utf-8",
          timeout: 2000,
        });
        if (testRes.status === 0 && candidate.includes("def construct")) {
          validClass = candidate;
        }
      }

      if (validClass) {
        repairedScenes.push(validClass);
      } else {
        console.log(`[VisualPlanningAgent] Scene ${sceneNumStr} missing or truncated in AI output. Using procedural template.`);
        repairedScenes.push(this.generateSingleProceduralScene(seg, idx, sceneNumStr));
      }
    });

    return `${header}\n${repairedScenes.join("\n\n")}\n`;
  }

  async planStoryboard(
    script: TeachingScript,
    simulation: SimulationResult,
    options?: { injectIntentionalBugForCriticDemo?: boolean }
  ): Promise<Storyboard> {
    const scenes: SceneVisual[] = [];
    let manimScript: string | undefined = undefined;

    // 1. Generate AI-driven Manim scenes code via LLM if available
    if (this.llm) {
      try {
        const prompt = `You are an expert Manim animator creating short-form 9:16 vertical engineering video reels.
Write a valid Python Manim script that visualizes the following technical topic.

Topic: "${script.title}"
Segments with durations:
${script.segments.map((s, i) => `Step ${i + 1}: [${s.concept}] (${(s.audioDurationSeconds || 8.0).toFixed(1)}s) - "${s.narrationText}"`).join("\n")}

STRICT ANTI-AI-SLOP & TOKEN CONSTRAINTS:
1. Output Python code with classes Scene01_..., Scene02_..., etc. (one class per step).
2. KEEP EACH SCENE CLASS SHORT & CONCISE (15-20 lines of code maximum).
   - Use 2-3 key Mobjects (Circle, Square, Line, Arrow).
   - Use 1-2 focused animations: Create, MoveAlongPath(Dot, Line), or Transform.
   - Do NOT write loops with many objects or verbose boilerplate to prevent output truncation!
3. 9:16 vertical geometry:
   - Upper 2/3 active zone: x in [-3.9, 3.9], y in [-1.6, 6.6].
   - Lower third (y < -1.8) MUST REMAIN PITCH BLACK for the character overlay.
4. Canvas: background="#07090E", typography font="DejaVu Sans Mono", palette: 60% slate ("#07090E"), 30% structural ("#1E293B", "#334155", "#94A3B8"), 10% accent ("#0EA5E9" or "#F59E0B").
5. Exact Timing: Each scene's animation run_times + self.wait(pad) MUST EQUAL the step's audio duration in seconds.
6. NO LaTeX or MathTex. Use Text(...) only.

Output ONLY executable Python code starting with "from manim import *" without markdown ticks or explanation.`;

        const response = await this.llm.generateCompletion(
          [
            { role: "system", content: "You are an expert Manim animator. Always output concise, clean Python code for Manim Community that never truncates." },
            { role: "user", content: prompt }
          ],
          { temperature: 0.2 }
        );

        let cleaned = response.trim();
        if (cleaned.includes("```")) {
          const match = cleaned.match(/```(?:python)?\s*([\s\S]*?)\s*```/);
          cleaned = match ? match[1].trim() : cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
        }

        // Validate complete script
        if (this.validateManimScript(cleaned, script.segments.length)) {
          manimScript = cleaned;
          console.log(`[VisualPlanningAgent] AI Manim script fully verified (${script.segments.length} scenes).`);
        } else if (cleaned.includes("class Scene01")) {
          console.log(`[VisualPlanningAgent] AI Manim script was partially generated or truncated. Salvaging complete scenes and repairing...`);
          manimScript = this.repairManimScript(cleaned, script);
        }
      } catch (err: any) {
        console.warn(`[VisualPlanningAgent] AI Manim generation failed for "${script.title}":`, err.message);
      }
    }

    // 2. Fallback to 100% verified procedural Manim script if needed
    if (!manimScript || !this.validateManimScript(manimScript, script.segments.length)) {
      console.log(`[VisualPlanningAgent] Using 100% verified procedural Manim engine for "${script.title}"`);
      manimScript = this.generateProceduralManimScript(script);
    }

    // 3. Build metadata SceneVisual array for critic & orchestrator verification
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
