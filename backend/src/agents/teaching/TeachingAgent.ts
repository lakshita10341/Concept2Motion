import { LLMProvider } from "../../providers/fireworks/FireworksLlamaProvider.js";
import { ResearchNotes, TeachingScript } from "../../shared/types/index.js";

export class TeachingAgent {
  private llm: LLMProvider;

  constructor(llm: LLMProvider) {
    this.llm = llm;
  }

  async generateScript(research: ResearchNotes, audienceLevel = "beginner", targetDuration = 60): Promise<TeachingScript> {
    // English speech rate is ~140-150 words per minute => ~2.3 - 2.5 words per second
    const totalWordsBudget = Math.round(targetDuration * 2.3);
    const numSegments = targetDuration <= 45 ? 3 : targetDuration <= 60 ? 4 : 5;
    const wordsPerSegment = Math.round(totalWordsBudget / numSegments);

    const prompt = `You are a Principal Systems Architect and Award-Winning Engineering Reel Scriptwriter following the Technical Engineering Reels standard.
Transform the research into a high-retention, technically rigorous 9:16 vertical engineering reel script.

STRUCTURE REQUIREMENTS:
1. THE HOOK (Mandatory Opening):
   - Line 1: A concrete real-life situation the viewer has personally experienced (e.g., typing a username, checkout on Black Friday, a database lock, a video buffering).
   - Line 2: The engineering problem hiding inside it, with a number that makes it feel impossible (e.g., checking one billion items under one millisecond).
   - Line 3: Names the concept as the mechanism that solves it.
   - NEVER open with a definition, history lesson, or "Have you ever wondered".

2. ENGAGEMENT & ONE WORKED EXAMPLE (Middle Segments):
   - Re-hook around the 30-second mark with a direct question (e.g., "So here is the real question: how does the replica survive the crash?").
   - Include a pattern interrupt every 10 to 15 seconds.
   - One counterintuitive moment where the obvious assumption breaks.
   - One objection beat voicing the viewer's skepticism (e.g., "Why not just do both?").
   - ONE worked example with concrete numbers (e.g., two nodes, four partitions, 64-byte chunks, a 16-bit ring) that runs start to finish on the same data.
   - A failure mode that escalates in real production conditions.

3. LOCKED ENDING (Final Segment):
   - State the fundamental engineering trade-off.
   - Mandatory callback closing the loop on the opening hook scenario.
   - Crisp 3-sentence conclusion that leaves a permanent mental model, followed by a punchline.

4. NARRATOR STYLE (CRITICAL):
   - Conversational, punchy cadence: short, punchy lines landing one at a time.
   - Casual spoken connectors: "Now", "So", "Here is the catch", "Here is what happens next".
   - Plain verbs (flip, skip, scan, hit, miss, pay) wrapped around exact technical nouns.
   - ZERO visual or screen references: NEVER use "picture", "imagine", "look at", "see", "watch", "notice", "observe", or "as you can see". The narration is pure spoken audio.
   - Write phonetically for speech synthesis: write "O of log n" instead of "O(log n)", "kilo-bytes" instead of "KB", "dee-en-ess" instead of "DNS", "one millisecond" instead of "1ms".
   - Target total video duration: ~${targetDuration} seconds (~${totalWordsBudget} total words across ${numSegments} segments, ~${wordsPerSegment} words per segment).

Topic: ${research.topic}
Audience Level: ${audienceLevel}

Research Notes:
Core Concepts: ${research.coreConcepts.join(", ")}
Key Steps: ${research.stepByStepBreakdown.join("; ")}
Common Misconceptions: ${research.commonMisconceptions.join("; ")}

Output ONLY valid JSON matching this schema:
{
  "title": "Punchy Engineering Title",
  "targetAudience": "${audienceLevel}",
  "segments": [
    {
      "segmentId": "seg_01",
      "concept": "Core Concept Name",
      "learningOutcome": "Crisp technical takeaway",
      "narrationText": "Spoken voiceover (~${wordsPerSegment} words)..."
    }
  ]
}`;

    try {
      const response = await this.llm.generateCompletion(
        [
          { role: "system", content: "You write clear, accurate STEM video narration scripts in plain English. Always output strictly valid JSON without markdown wrapping." },
          { role: "user", content: prompt }
        ],
        { jsonMode: true, temperature: 0.2 }
      );

      console.log(`[TeachingAgent] Raw LLM response received (${response.length} chars). Preview:`, response.slice(0, 80));

      let cleaned = response.trim();
      // Remove markdown code fences if present
      if (cleaned.includes("```")) {
        const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
          cleaned = match[1].trim();
        } else {
          cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
        }
      }

      // If there is conversational text before the JSON object, extract JSON
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(cleaned);

      // Validate parsed segments structure
      if (!parsed.segments || !Array.isArray(parsed.segments) || parsed.segments.length === 0) {
        throw new Error("Invalid script structure: missing segments array");
      }

      // Normalize segments schema to ensure consistent keys
      parsed.segments = parsed.segments.map((s: any, idx: number) => ({
        segmentId: s.segmentId || `seg_0${idx + 1}`,
        concept: s.concept || s.title || `Key Concept ${idx + 1}`,
        learningOutcome: s.learningOutcome || s.takeaway || s.concept || "Core technical concept takeaway",
        narrationText: s.narrationText || s.script || s.text || s.narration || "",
      }));

      return parsed;
    } catch (err: any) {
      console.warn(`[TeachingAgent] LLM generation error or invalid JSON for "${research.topic}". Generating dynamic pedagogical script from research notes:`, err.message);

      // DYNAMIC FALLBACK: Construct a high-retention script specifically for THIS topic using verified research notes
      const steps = research.stepByStepBreakdown && research.stepByStepBreakdown.length > 0
        ? research.stepByStepBreakdown
        : research.coreConcepts.map((c, i) => `Analyze and execute step ${i + 1} for ${c}`);

      const concepts = research.coreConcepts && research.coreConcepts.length > 0
        ? research.coreConcepts
        : [research.topic, "Mechanical Architecture", "Fault-Tolerance & Guarantees"];

      const fallbackSegments = [];
      const segCount = Math.min(numSegments, Math.max(3, steps.length));

      for (let i = 0; i < segCount; i++) {
        const conceptName = concepts[i % concepts.length] || `Core Principle ${i + 1}`;
        const stepDetail = steps[i] || steps[0] || `Executing core mechanism for ${research.topic}`;
        let narration = "";

        if (i === 0) {
          narration = `Under production load, ${research.topic} must maintain strict consistency across state transitions. Without deterministic invariants, concurrent updates corrupt records instantly.`;
        } else if (i === segCount - 1) {
          narration = `In production, ${research.topic} trades raw throughput for absolute state correctness. You cannot eliminate the physical constraint, you only pick which guarantee your system preserves.`;
        } else {
          narration = `The execution path is straightforward: ${stepDetail}. Every node validates local state before committing to avoid split-brain or stale reads.`;
        }

        fallbackSegments.push({
          segmentId: `seg_0${i + 1}`,
          concept: conceptName,
          learningOutcome: `Understand ${conceptName} in the context of ${research.topic}`,
          narrationText: narration,
        });
      }

      return {
        title: `${research.topic}: Technical Architecture & Mechanics`,
        targetAudience: audienceLevel,
        segments: fallbackSegments,
      };
    }
  }
}
