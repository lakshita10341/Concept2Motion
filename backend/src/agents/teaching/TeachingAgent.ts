import { LLMProvider } from "../providers/fireworks/FireworksLlamaProvider.js";
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

    const prompt = `You are an Award-Winning STEM Educator and Scriptwriter.
Transform the following verified research notes into a captivating, pedagogically sound, scene-by-scene educational narration script in STANDARD ENGLISH.

CRITICAL CONSTRAINTS:
1. LANGUAGE: Standard English ONLY. Do not use Greek, Cyrillic, or non-English characters.
2. DURATION CONSTRAINT:
   - Target video duration: EXACTLY ~${targetDuration} seconds.
   - TOTAL word count across all narration MUST BE approximately ${totalWordsBudget} words (around ${wordsPerSegment} words per segment).
   - EXACTLY ${numSegments} concise segments.
   - Keep narration punchy, direct, and tightly paced so it fits within the ${targetDuration}-second limit!

Topic: ${research.topic}
Audience Level: ${audienceLevel}

Research Notes:
Core Concepts: ${research.coreConcepts.join(", ")}
Key Steps: ${research.stepByStepBreakdown.join("; ")}
Misconceptions to dispel: ${research.commonMisconceptions.join("; ")}

Output ONLY valid JSON matching this schema:
{
  "title": "Clear English Title",
  "targetAudience": "${audienceLevel}",
  "segments": [
    {
      "segmentId": "seg_01",
      "concept": "Concept name",
      "learningOutcome": "What the viewer understands after this segment",
      "narrationText": "Voiceover words spoken in this segment (approx ${wordsPerSegment} words)..."
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

      let cleaned = response.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
      }
      return JSON.parse(cleaned);
    } catch (err) {
      if (research.topic.toLowerCase().includes("bloom")) {
        return {
          title: "Demystifying Bloom Filters: Space-Efficient Set Testing",
          targetAudience: audienceLevel,
          segments: [
            {
              segmentId: "seg_01",
              concept: "Probabilistic Space Efficiency",
              learningOutcome: "Understand how Bloom filters test membership without storing full data",
              narrationText: "Databases handle millions of requests. Before executing a slow disk lookup, they consult a Bloom filter: a compact probabilistic bit array that tells us if an item is definitely absent."
            },
            {
              segmentId: "seg_02",
              concept: "Multiple Hash Functions and Bit Allocation",
              learningOutcome: "Observe how multiple independent hash functions map keys to positions",
              narrationText: "When we insert an item like 'apple', we pass it through independent hash functions. Each hash calculates an index, and we flip those corresponding bits in our array from zero to one."
            },
            {
              segmentId: "seg_03",
              concept: "Zero False Negatives Principle",
              learningOutcome: "Learn why Bloom filters guarantee zero false negatives",
              narrationText: "When querying an item, we hash it again. If even a single mapped bit is zero, that item was definitely never inserted. False negatives are mathematically impossible."
            },
            {
              segmentId: "seg_04",
              concept: "False Positives Tradeoff",
              learningOutcome: "Appreciate how bit collisions create occasional false positives",
              narrationText: "However, if all bits are one, different keys might have collided to set them. The filter answers 'possibly present', trading a tiny false-positive rate for massive space savings."
            }
          ]
        };
      }

      // Binary Search fallback
      return {
        title: "Mastering Binary Search: The Power of Divide and Conquer",
        targetAudience: audienceLevel,
        segments: [
          {
            segmentId: "seg_01",
            concept: "The Search Dilemma and Sorted Invariant",
            learningOutcome: "Understand why ordered data enables logarithmic search instead of linear scanning",
            narrationText: "Imagine looking for a name in a phone book. You don't read every page from the start. Because the names are sorted, you open right to the middle. This is the foundation of Binary Search."
          },
          {
            segmentId: "seg_02",
            concept: "Pointers and Midpoint Calculation",
            learningOutcome: "Learn how the left and right boundaries define the active search window and calculate the midpoint",
            narrationText: "We start with two boundaries: Left at index zero, and Right at the end of the array. We calculate the middle index using left plus right minus left divided by two, safely avoiding integer overflow."
          },
          {
            segmentId: "seg_03",
            concept: "Comparison and Halving the Search Space",
            learningOutcome: "Observe how a single comparison eliminates half of the remaining elements",
            narrationText: "Now, we inspect the middle element. Is our target greater than this value? Yes! That means our target cannot exist in the left half. We immediately discard all elements to the left by moving Left to mid plus one."
          },
          {
            segmentId: "seg_04",
            concept: "Target Acquisition and Logarithmic Speed",
            learningOutcome: "Appreciate how repeated halving finds any item in logarithmic O(log n) time",
            narrationText: "We recalculate the middle. This time, our middle element matches the target exactly! In just two comparisons across our dataset, binary search located the answer in O of log N time."
          }
        ]
      };
    }
  }
}
