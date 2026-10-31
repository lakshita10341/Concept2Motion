---
name: reel-generator
description: |
  Turns script.txt into a ready-to-post 9:16 vertical reel: XTTS-v2 cloned voice (ref.wav), Whisper word timings,
  Manim animations written by the agent for the script's topic, and an FFmpeg audio/video merge.
  Trigger when the user says "make the reel", "generate the reel", "I updated the script", "new script", or similar,
  in the reel-generator project (/home/opbotxd/Desktop/vscode/dev/random/reel-generator).
license: Apache-2.0
metadata:
  version: v4
  publisher: local
---

# Reel Generator

Project root: `/home/opbotxd/Desktop/vscode/dev/random/reel-generator` (run every command from here).

`python` is NOT on PATH; use `python3` or the venv paths below.

## Workflow

### Setup / Reset (Optional)

When starting a new script/topic, run `./clear.sh` to clean temporary and intermediate files while preserving finished reels in `output_video/`.

### Step 1: Voice + timings

Normally the user will have already run `./run_audio.sh`. If `output_audio/captions.json` is missing or `script.txt` was modified without re-running audio, **do NOT run the audio pipeline yourself** (it takes 1–2 minutes and wastes tokens). Ask the user to run:

```bash
./run_audio.sh
```

Ask them to report back once it has finished.

### Step 2: YOU write the scenes (the pipeline cannot do this)

1. Read `script.txt` and `output_audio/captions.json`.
2. Group the caption segments into 5–8 beats (one visual idea each). For every beat, note the `start` of its first segment and the `start` of the next beat's first segment. The beat duration is the difference. The last beat runs to the audio duration.
3. Overwrite `rough/scenes.py` with one `Scene*` class per beat, **in playback order** (the pipeline renders every top-level class whose name starts with `Scene`, in file order). Name them `Scene01_...`, `Scene02_...`.
4. Each scene's total run time (sum of all `run_time` + `wait`) must equal its beat duration within approximately 0.1 seconds. End every scene with a `self.wait(...)` that pads to the exact duration. Comment the running total.
5. **Visual storytelling review — never act as a caption generator:** Treat `script.txt` as the source of the topic, concepts, examples, and logic—not as on-screen copy or a shot list to illustrate word-for-word. The scene should visually explain, dramatize, or extend the spoken idea rather than display the same sentence the speaker is saying. Captions and transcript-like text are not the job of `rough/scenes.py`.
6. **Minimal text boxes (and beyond the script):** Use text boxes and containers sparingly to an absolute minimum. If a text box or card is used, it **MUST NOT** repeat or summarize what the script says; it must mention something *other* than the script itself (e.g. underlying architecture, low-level register states, hardware constraints, telemetry metrics, or mathematical invariants).
7. **Empty blank frames when content is sparse:** The final reel can have empty blank frames (`self.wait(beat_duration)`) whenever less visual content is available or a beat does not warrant a complex diagram. Never invent artificial visual fluff or filler boxes just to fill the screen.
8. **Mobile readability review:** Before finalizing each scene, check that it communicates one clear idea, uses readable text, and contains no unnecessary visual elements. Split dense concepts across multiple scenes when needed. Keep simultaneous animations to 1–2 meaningful actions maximum.
9. **Collision and pacing review:** Check object positions and timing so that text, shapes, arrows, connectors, and moving objects never collide or overlap unintentionally. Do not invent extra animation just to fill time. A clean, mostly static scene or an intentional blank/dark scene is completely acceptable when it improves pacing or leaves room for photos to be added during editing.

### Step 3: Render (Hand Off to User) & Verify

Do **NOT** execute the render pipeline yourself; waiting/polling on high-quality 1080p/4K 60fps renders consumes tokens. Provide the command for the user to run in their terminal:

```bash
# High quality (1080x1920 @ 60 FPS, default):
python3 pipeline.py --stage render --output output_video/<topic>_reel.mp4

# Or pristine 4K UHD vertical (2160x3840 @ 60 FPS):
python3 pipeline.py --stage render --quality 4k --output output_video/<topic>_reel_4k.mp4
```

Default quality is `high`: 1080×1920 at 60 FPS (`--quality 4k` delivers 2160x3840 @ 60 FPS). Ask the user to report back (`done` or `rendered`) once complete.

### Step 4: Fast Verification (Agent)

Once the user reports that rendering finished, run instant inspection (under 1 second each):

1. Run ffprobe:
   ```bash
   /home/opbotxd/.local/share/mamba/envs/.venv-manim/bin/ffprobe -hide_banner output_video/<topic>_reel.mp4
   ```
2. Extract 2–3 frames:
   ```bash
   /home/opbotxd/.local/share/mamba/envs/.venv-manim/bin/ffmpeg -ss <t> -i output_video/<topic>_reel.mp4 -frames:v 1 rough/check_<t>.png
   ```
3. Inspect the frames and verify the visual elements stay within the upper 2/3 safe zone (`y >= -1.8`), the lower third remains empty, and text is legible at mobile playback size.

## Visual storytelling — never act as a caption generator

- **Visuals are not subtitles.** Never simply put the speaker's sentence, phrase, or narration on screen as the main content. Do not convert each sentence into a text card, headline, list, or a sequence of words that merely repeats what the audience is hearing.
- **Use narration as meaning, not literal visual instructions.** Understand what the speaker is explaining, then choose a visual metaphor, mechanism, example, consequence, comparison, miniature story, process, or surprising but relevant illustration that helps the viewer understand it. Match the intent of the narration, not its exact wording.
- **Go beyond the script when it helps.** You may visualize an implication, analogy, real-world use, surprising consequence, or supporting example that is not explicitly named in `script.txt`, provided it is relevant, accurate, and makes the idea clearer or more engaging. Do not invent factual claims merely to make a scene look exciting.
- **Prefer showing over telling.** If the narration says a system is faster, show a clear comparison or a process completing sooner. If it describes a hidden mechanism, reveal a simplified model of that mechanism. If it describes a problem, show the problem and its effect. Use short labels only when they are necessary to identify a visual object, value, or state.
- **No filler visuals.** Never fall back to generic text, repeated keywords, decorative motion, random graphs, meaningless icons, or an animation that just spells out the narration because the next visual idea is difficult. If no strong, useful visual can be devised, leave the interval intentionally blank/dark or hold a clean, relevant composition. The editor may add photographs or footage later.
- **Minimal text boxes (and beyond the script):** Keep text boxes and callout containers to the absolute bare minimum. Visuals should primarily be naked mechanisms, diagrams, and states. When a text box or card is strictly necessary, it **MUST NOT** repeat, summarize, or mirror the script narration. Instead, it must mention something *other* than what the script itself says: e.g. low-level register states, hardware constraints, packet headers, computational bounds, mathematical invariants, or runtime telemetry that the listener cannot hear.
- **Empty blank frames when content is sparse:** The final reel can have empty blank frames (`self.wait(beat_duration)`) whenever less content is available. Do not manufacture artificial visuals, repetitive shapes, or decorative text boxes just to fill screen time. If a beat doesn't warrant a complex diagram, a completely black/empty frame is fully valid and encouraged; it provides editorial breathing room, highlights the speaking avatar, and leaves clean cutaways for external editing.
- **Blank is better than boring.** A deliberate empty interval or full blank frame is a valid editorial choice and does not need to be filled. Keep the scene's timing aligned to its assigned narration beat, even when the visible content is minimal or completely blank.
- **Text is supporting material, not the scene itself.** Use text sparingly for short identifiers, numbers, labels, or a key contrast. Avoid full narrated sentences and avoid using on-screen text to carry an explanation that should instead be communicated visually.
- **Design an original visual beat for each segment.** Before coding a scene, write a brief private intent note: “What should the viewer understand or feel from the image?” Then choose the simplest clear visual that accomplishes it. Do not write the spoken sentence on screen as a substitute for this decision.
- **Keep the established aesthetic.** Preserve the existing restrained palette, typography, spacing, mobile readability, smooth motion, and collision-free composition. This update changes the storytelling approach, not the clean styling that is already working.
- **Use captions only for timing.** `output_audio/captions.json` exists to establish beat boundaries and audio timing. Do not treat its transcript text as content to render in the animation.

## Design Rules — Anti-AI-Slop & Human-Grade Visual Craft

### 9:16 vertical geometry

At the top of `rough/scenes.py`:

```python
from manim import *

# Responsive 9:16 vertical geometry at any render quality (-qh 1080p or -qk 4K)
if config.pixel_width > config.pixel_height:
    config.pixel_width, config.pixel_height = config.pixel_height, config.pixel_width
config.frame_width = 9.0
config.frame_height = 16.0
config.background_color = "#07090E"
```

### Avatar safe zone

- Use the upper two-thirds only for scene content (`y >= -1.8`; preferred active zone: `y ∈ [-1.6, 6.6]`).
- The lower third (`y < -1.8`) **must stay pitch black and empty** for the character overlay.

### 60-30-10 blueprint palette & clean matte slate (no distracting image backgrounds)

- **60%:** clean, solid matte slate canvas (`config.background_color = "#07090E"`). Deep dark slate maximizes contrast for terminal elements and renders fast. Do NOT load external photo/checkered grid images as full-canvas backgrounds.
- **30%:** crisp architectural elements, container cards, and structural labels (`#1E293B`, `#334155`, `#475569`, `#94A3B8`, `#F1F5F9`).
- **10%:** one topic accent (for example, Electric Amber `#F59E0B`, Safety Orange `#FF6B00`, or Laser Cyan `#0EA5E9`), plus at most one semantic alert (`#EF4444`).
- Do not stack cyan, purple, pink, and green together in the same frame.

### Mandatory DejaVu Sans Mono terminal typography

- **Always use DejaVu Sans Mono:** Set `MONO_FONT = "DejaVu Sans Mono"` and pass `font=MONO_FONT` to all `Text(...)` elements. Monospace terminal typography delivers a crisp, authoritative engineering aesthetic. Standard serif or generic sans fonts look out of place.

### Minimal Text Boxes & Dynamic Content-Fitted Containers — Zero Script Mirroring

- **Minimal Text Boxes:** Keep text boxes to an absolute minimum. Prioritize naked architectural structures (bit arrays, network DAGs, queues, pointers, registers) directly on the background without unnecessary framing cards.
- **Must Mention Something Other Than The Script:** If a text box or container is strictly needed, it **MUST NOT** repeat, rephrase, or summarize the spoken script. Instead, it must mention something *other* than what the script itself says: e.g. low-level register states, hardware constraints, packet headers, computational bounds, mathematical invariants, or runtime telemetry that the listener cannot hear.
- **BANNED:** Wrapping script sentences or dialogue inside decorative card boxes, OR hardcoding arbitrary oversized boxes (for example `Rectangle(width=7.2, height=1.6)` or `Rectangle(width=6.8, height=2.2)`). These leave huge, awkward empty margins that look amateurish and clunky.
- **DO INSTEAD:** Show raw system architecture. Whenever a technical box or chip is truly needed, **it MUST be dynamically sized to its content** using:
  ```python
  def create_fitted_card(
      content: Mobject,
      stroke_color=COLOR_BORDER,
      fill_color="#0B0F17",
      h_pad=0.58,
      v_pad=0.38,
      stroke_width=1.8,
      corner_radius=0.12,
      max_width=7.6,
  ) -> VGroup:
      if content.width > (max_width - h_pad):
          content.scale_to_fit_width(max_width - h_pad)
      rect = RoundedRectangle(
          corner_radius=corner_radius,
          width=content.width + h_pad,
          height=content.height + v_pad,
          stroke_color=stroke_color,
          stroke_width=stroke_width,
          fill_color=fill_color,
          fill_opacity=0.96,
      ).move_to(content.get_center())
      return VGroup(rect, content)
  ```
- Boxes must hug their inner content with balanced padding—never leave empty horizontal or vertical voids.

### Mobile-first large typography scale

- **BANNED:** Small 11–13pt text that forces mobile viewers on Reels/Shorts/TikTok to squint or zoom.
- **DO INSTEAD:** Use a bold, punchy vertical scale:
  - **Top HUD & Primary Headers:** `font_size=20-22` (`BOLD`)
  - **Array Bits, Values, Digits & Counters:** `font_size=25-28` (`BOLD`)
  - **Primary Metrics, Formulas & Sub-headers:** `font_size=16-18`
  - **Secondary Telemetry & Invariant Badges:** `font_size=14-16`

### Strict collision and spatial-boundary safety — clean in-place transitions

- Keep all active visuals strictly within `x ∈ [-3.9, 3.9]`, `y ∈ [-1.6, 6.6]`. The lower third (`y < -1.8`) must remain pitch black and empty for the character overlay.
- Apply `.scale_to_fit_width(7.4)` or smaller to any text to prevent it bleeding off the 9-unit frame.
- Keep adequate spacing between labels and shapes (`buff >= 0.25`; for vertical arrangements use `arrange(DOWN, buff=0.35)`).
- **Clean In-Place Transitions:** When moving between states, policy choices, or metrics in the same area, always use `ReplacementTransform` or `FadeOut` on previous cards so multiple obsolete badges never stack up or clutter the frame.
- Review representative rendered frames, including moments during motion and at scene transitions. Fix any accidental overlaps, clipping, awkward spacing, or visual tangles before handing off the render.

### Simple, purposeful animation — no visual overload

- Keep each scene visually calm, clean, and intentional. Use only **1–2 meaningful animations at a time**.
- Never run 5–6 independent animations simultaneously in one frame.
- Use restrained, polished motion: smooth easing, deliberate timing, and clear starts and stops. Movement should feel controlled, not frantic or decorative.
- Animate only what helps explain the concept: one moving pointer, one changing value, one highlighted node, or one traveling packet.
- Prefer a single clear animation over multiple decorative movements.
- Keep supporting elements static while the primary mechanism moves.
- Use short, controlled transitions. Avoid excessive bouncing, pulsing, flashing, or repeated motion.
- Every animation must communicate a specific action, relationship, or state change.
- If a concept is understandable with a static diagram and one simple transition, do not add more animation.
- Prioritize visual clarity and conceptual understanding over motion and spectacle.
- Physical motion is encouraged when it clarifies the mechanism: pointers can slide (`pointer.animate.next_to(...)`), packets can travel along arrows (`MoveAlongPath`), numbers can increment, and transitions can use `ReplacementTransform` with `rate_func=ease_out_cubic`. Use these selectively; do not combine all of them in one scene.
- **Do not force animation to fill a scene.** If there is no useful motion to show, use a clean static composition, hold on a simple visual, or leave an intentional blank/dark interval. The user may add photos or other footage over these intervals during editing.
- Blank or near-blank frames are valid editorial breathing room between visual beats. Keep them deliberate rather than adding placeholder graphics, and preserve exact scene/audio timing.
- Avoid the “PowerPoint FadeIn Syndrome”: do not rely on static `FadeIn` animations followed by long waits as the default, but also do not animate every object. A purposeful static hold is acceptable when it gives the viewer time to read or creates editing space.

### Mobile-first readability — strict

- Design every scene for a 9:16 smartphone screen viewed at normal reel playback size.
- Assume the viewer is watching on a small phone without pausing or zooming.
- Show **one primary idea per scene**. Never compress an entire explanation into one frame.
- Use fewer elements, larger labels, generous spacing, and a clear visual hierarchy.
- Prefer **3–6 meaningful visual elements** over dense diagrams containing many nodes, labels, arrows, and annotations.
- Keep on-screen text short. Use concise labels and key numbers instead of full explanatory sentences.
- At 1080×1920, aim for approximately **36–48 px equivalent for primary labels** and **24–32 px equivalent for secondary labels**. These are practical targets, not a reason to force text to fit; simplify the scene when necessary.
- Avoid tiny technical annotations, dense bit arrays, long equations, excessive metadata, and multiple lines of explanatory text.
- If a diagram requires small labels to fit, simplify the diagram instead of shrinking the text.
- Introduce complex structures progressively across multiple scenes rather than displaying every component simultaneously.
- Use progressive disclosure: introduce the main structure first, then reveal only the next component needed to explain the concept.
- Maintain generous spacing between text, shapes, connectors, and other elements. Never allow labels to overlap lines or neighboring objects.
- Keep all essential information within the existing safe zone: `x ∈ [-3.9, 3.9]`, `y ∈ [-1.6, 6.6]`.
- Keep the lower third (`y < -1.8`) completely black and empty for the character overlay.
- Before finalizing each scene, mentally preview it at actual phone-screen size. If any important text or relationship is difficult to understand immediately, simplify it.
- When choosing between detail and readability, **always prioritize readability**.
- If a scene looks impressive at full resolution but is difficult to read on a phone, it is not finished.
- **Whitespace is useful:** do not fill every empty area. Keep the composition uncluttered and allow negative space around the main visual.

### Clean composition and editorial breathing room

- Every frame must look composed, not crowded. Use clear visual hierarchy, aligned elements, consistent spacing, and a small number of purposeful objects.
- Before finalizing a scene, inspect the whole frame for accidental overlap, tangencies (objects barely touching), clipped edges, crossing labels, confusing connector paths, and visual imbalance.
- Check both static layouts and in-between animation frames. An animation is not finished if objects collide halfway through, even when the opening and ending frames look correct.
- Prefer removing an unnecessary object over adding another label to explain it. If relationships are hard to follow, simplify the diagram or reveal components sequentially.
- Do not add motion, particles, grids, labels, or decorative shapes just because a scene feels empty. Empty space is often the cleaner choice.
- **Empty blank frames allowed when content is sparse:** The final reel can freely have empty blank frames (`self.wait(beat_duration)`) whenever less visual content is available or a beat does not warrant a technical diagram. It is 100% acceptable and encouraged for an entire scene to be an empty blank frame rather than forcing low-effort filler shapes, generic animations, or decorative text boxes. Blank frames provide visual contrast, spotlight the speaking avatar, and leave clean cutaways for post-production editing.
- It is acceptable to leave part or all of the active area empty/dark for an entire scene or a short interval between beats so the editor can place a photo, live footage, or another visual later. Keep the interval within the assigned beat duration and retain the required black lower-third safe zone.
- Where the narration permits, a quiet visual pause can separate concepts. Do not make the timing inaccurate or leave essential narration unsupported; use blank frames as an intentional editorial option whenever content is sparse.

### Action-first opening

- Start immediately with the active mechanism in motion; do not use a boring four-second title slide.
- Anchor the opening with a compact top HUD telemetry label (for example, `TOPOLOGY: 5 NODES` at `y = 6.2`).
- Keep the HUD short and subordinate to the main visual; do not let it crowd the scene.

### Zero emojis and no LaTeX

- Never use emojis. Use clean Unicode math/engineering symbols (`∈`, `∉`, `➔`, `✓`, `✗`, `≈`, `⊕`, `λ`, `O(1)`).
- Use `Text(...)` with Unicode (`²`, `³`, `≈`, `➔`, `·`), not `MathTex` or `Tex`.

## Tools / Environments

| Purpose | Path |
|---|---|
| XTTS-v2 venv (`generate.py`) | `.venv/bin/python` |
| Whisper venv (`transcribe_captions.py`) | `../caption/.venv/bin/python` |
| Manim | `/home/opbotxd/.local/share/mamba/envs/.venv-manim/bin/manim` |
| ffmpeg / ffprobe | `/home/opbotxd/.local/share/mamba/envs/.venv-manim/bin/` |

### Quick single-scene preview while iterating

```bash
/home/opbotxd/.local/share/mamba/envs/.venv-manim/bin/manim -ql rough/scenes.py Scene01_Intro --media_dir rough/media
```