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

    const prompt = `You are a Principal Systems Architect and Award-Winning STEM Reel Scriptwriter.
Transform the following research into a high-retention, technically rigorous 9:16 vertical engineering reel script in standard English.

FOLLOW THE GOLD-STANDARD TECHNICAL REEL FRAMEWORK:
1. THE HOOK (Opening Segment):
   - Start immediately with a concrete real-life scenario the viewer has experienced (e.g., checking a username, loading a webpage, querying a massive database).
   - State the impossible engineering challenge hiding inside it with concrete numbers (e.g., searching one billion items in under one millisecond).
   - Reveal the core concept as the mechanism that makes it possible.

2. WORKED MECHANICAL EXAMPLE (Middle Segments):
   - Walk through ONE concrete mechanism step-by-step with real values (e.g. pointers, bit positions, hash outputs, packet headers).
   - Include a pattern interrupt and one counterintuitive insight where common assumptions break.
   - Voice a real-world edge case or failure mode (e.g. hash collisions, network partition, worst-case bounds).

3. LOCKED ENDING (Final Segment):
   - State the fundamental engineering trade-off.
   - Make a callback to the opening real-life scenario.
   - Deliver a crisp punchline and permanent mental model for senior engineers.

4. ANTI-AI-SLOP VOICE RULES (MANDATORY):
   - HARD BAN on AI-generated cliché words: NEVER use "delve", "tapestry", "harness", "supercharge", "seamless", "revolutionize", "game-changer", "testament", "in today's world", "unleash", "elevate".
   - NO AI generic filler: Do NOT start with "Have you ever wondered" or "Imagine if you will". Start directly with the physical operation or developer event.
   - Tone: Senior systems architect in an incident review or whiteboard design session. Direct, grounded, technically precise, zero marketing fluff.
   - Target total video duration: ~${targetDuration} seconds.
   - Total word count: ~${totalWordsBudget} words across exactly ${numSegments} segments (~${wordsPerSegment} words per segment).
   - Write phonetically for speech synthesis: write "O of log n" instead of "O(log n)", "dee en ess" instead of "DNS", "one millisecond" instead of "1ms".
   - Standard English only. No emojis, no markdown inside narration text, no stage directions.

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
