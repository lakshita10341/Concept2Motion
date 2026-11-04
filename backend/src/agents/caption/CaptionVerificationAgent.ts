import { LLMProvider } from "../../providers/fireworks/FireworksLlamaProvider.js";
import { TeachingScript, WordTiming } from "../../shared/types/index.js";

const PREPOSITIONS = new Set([
  "in", "to", "the", "at", "for", "on", "from", "into", "with",
  "and", "or", "a", "an", "of", "by", "as", "bug", "hit", "hits", "flips", "pushed"
]);

const TOP_LEVEL_DOMAINS = new Set([
  "com", "org", "net", "io", "dev", "edu", "gov", "ai", "co", "app", "tech", "xyz"
]);

const SINGLE_WORD_MAP: Record<string, string> = {
  "dee-en-ess": "DNS",
  "tee-ell-dee": "TLD",
  "eye-pee": "IP",
  "tee-see-pee": "TCP",
  "tee-tee-ell": "TTL",
  "o-see-ess-pee": "OCSP",
  "you-tube": "YouTube",
  "kilo-bytes": "KB",
  "mega-bytes": "MB",
  "giga-bytes": "GB",
  "h-t-t-p": "HTTP",
  "h-t-t-p-s": "HTTPS",
  "ess-queue-ell": "SQL",
  "post-gres": "PostgreSQL",
  "ess-ess-aitch": "SSH",
  "see-pee-you": "CPU",
  "ay-pee-eye": "API",
  "ay-cee-ell": "ACL",
  "syn-ack": "SYN-ACK",
};

export class CaptionVerificationAgent {
  private llm: LLMProvider;

  constructor(llm: LLMProvider) {
    this.llm = llm;
  }

  /**
   * Cleans and aligns word-level timings from spoken phonetic audio to clean on-screen visual captions.
   */
  alignAndCleanWordTimings(rawWords: WordTiming[]): WordTiming[] {
    const cleaned: WordTiming[] = [];
    const n = rawWords.length;
    let i = 0;

    while (i < n) {
      const curWord = rawWords[i].word;
      const cleanCur = curWord.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();

      // 1. Check 4-word math patterns: "O of log n"
      if (i + 3 < n) {
        const w1 = rawWords[i].word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();
        const w2 = rawWords[i + 1].word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();
        const w3 = rawWords[i + 2].word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();
        const w4 = rawWords[i + 3].word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();
        if (w1 === "o" && w2 === "of" && w3 === "log" && w4 === "n") {
          const trailing = rawWords[i + 3].word.match(/[.,;:?!]+$/)?.[0] || "";
          cleaned.push({
            word: `O(log n)${trailing}`,
            startMs: rawWords[i].startMs,
            endMs: rawWords[i + 3].endMs,
          });
          i += 4;
          continue;
        }
      }

      // 2. Check 3-word math patterns: "O of one" or "O of n"
      if (i + 2 < n) {
        const w1 = rawWords[i].word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();
        const w2 = rawWords[i + 1].word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();
        const w3 = rawWords[i + 2].word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();
        if (w1 === "o" && w2 === "of" && (w3 === "one" || w3 === "1")) {
          const trailing = rawWords[i + 2].word.match(/[.,;:?!]+$/)?.[0] || "";
          cleaned.push({
            word: `O(1)${trailing}`,
            startMs: rawWords[i].startMs,
            endMs: rawWords[i + 2].endMs,
          });
          i += 2 + 1;
          continue;
        }
        if (w1 === "o" && w2 === "of" && w3 === "n") {
          const trailing = rawWords[i + 2].word.match(/[.,;:?!]+$/)?.[0] || "";
          cleaned.push({
            word: `O(n)${trailing}`,
            startMs: rawWords[i].startMs,
            endMs: rawWords[i + 2].endMs,
          });
          i += 2 + 1;
          continue;
        }
      }

      // 3. Check 3-word domain patterns: e.g. "example dot com", "shop dot com", "youtube dot com"
      if (i + 2 < n) {
        const wNext = rawWords[i + 1].word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();
        const wAfter = rawWords[i + 2].word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();

        if (wNext === "dot" && TOP_LEVEL_DOMAINS.has(wAfter) && !PREPOSITIONS.has(cleanCur)) {
          let domainPrefix = rawWords[i].word.replace(/^[^\w]+|[^\w]+$/g, "");
          if (domainPrefix.toLowerCase() === "you-tube") {
            domainPrefix = "YouTube";
          }
          const trailing = rawWords[i + 2].word.match(/[.,;:?!]+$/)?.[0] || "";
          cleaned.push({
            word: `${domainPrefix}.${wAfter}${trailing}`,
            startMs: rawWords[i].startMs,
            endMs: rawWords[i + 2].endMs,
          });
          i += 3;
          continue;
        }
      }

      // 4. Check 2-word domain suffix pattern: "dot com" -> ".com"
      if (i + 1 < n) {
        const wNext = rawWords[i + 1].word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();
        if (cleanCur === "dot" && TOP_LEVEL_DOMAINS.has(wNext)) {
          const trailing = rawWords[i + 1].word.match(/[.,;:?!]+$/)?.[0] || "";
          cleaned.push({
            word: `.${wNext}${trailing}`,
            startMs: rawWords[i].startMs,
            endMs: rawWords[i + 1].endMs,
          });
          i += 2;
          continue;
        }
      }

      // 5. Check 2-word unit patterns: e.g. "50 milliseconds" -> "50ms", "1 millisecond" -> "1ms"
      if (i + 1 < n) {
        const wNext = rawWords[i + 1].word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase();
        if (/^\d+$/.test(cleanCur) && (wNext === "millisecond" || wNext === "milliseconds")) {
          const trailing = rawWords[i + 1].word.match(/[.,;:?!]+$/)?.[0] || "";
          cleaned.push({
            word: `${cleanCur}ms${trailing}`,
            startMs: rawWords[i].startMs,
            endMs: rawWords[i + 1].endMs,
          });
          i += 2;
          continue;
        }
      }

      // 6. Check single-word substitutions from dictionary
      const replacement = SINGLE_WORD_MAP[cleanCur];
      if (replacement) {
        const trailing = curWord.match(/[.,;:?!]+$/)?.[0] || "";
        const leading = curWord.match(/^[.,;:?!"'([{]+/)?.[0] || "";
        cleaned.push({
          word: `${leading}${replacement}${trailing}`,
          startMs: rawWords[i].startMs,
          endMs: rawWords[i].endMs,
        });
        i += 1;
        continue;
      }

      // Default: retain word
      cleaned.push(rawWords[i]);
      i += 1;
    }

    return cleaned;
  }

  /**
   * Prompts Meta Muse Spark 1.3 to verify and normalize the phonetic segment text into clean display text.
   */
  async verifyCaptionWithMetaAI(rawNarration: string): Promise<string> {
    const prompt = `You are a Subtitle and Caption Post-Production Specialist for Technical Engineering Reels.
Your task is to take spoken phonetic narration and convert it into pristine, technically accurate, grammatically correct visual subtitles for on-screen display.

TRANSFORMATION RULES:
1. Fix domain names: "example dot com" -> "example.com", "shop dot com" -> "shop.com", "you-tube dot com" -> "youtube.com", "dot com servers" -> ".com servers".
2. Fix technical acronyms: "dee-en-ess" -> "DNS", "tee-ell-dee" -> "TLD", "eye-pee" -> "IP", "tee-see-pee" -> "TCP", "tee-tee-ell" -> "TTL", "o-see-ess-pee" -> "OCSP", "ess-queue-ell" -> "SQL".
3. Fix mathematical notations: "O of log n" -> "O(log n)", "O of one" -> "O(1)", "O of n" -> "O(n)".
4. Fix units and tech terms: "one millisecond" -> "1ms", "fifty milliseconds" -> "50ms", "kilo-bytes" -> "KB", "mega-bytes" -> "MB", "giga-bytes" -> "GB".
5. Preserve the exact rhythm, sentence structure, and tone. Do NOT re-write sentences or add commentary.

Phonetic Spoken Narration:
"${rawNarration}"

Return ONLY valid JSON matching this schema:
{
  "displayText": "Cleaned, visually correct subtitle text"
}`;

    try {
      const response = await this.llm.generateCompletion(
        [
          { role: "system", content: "You sanitize spoken phonetic transcripts into clean, publish-ready technical subtitles. Output valid JSON only." },
          { role: "user", content: prompt }
        ],
        { jsonMode: true, temperature: 0.1 }
      );

      let cleaned = response.trim();
      if (cleaned.includes("```")) {
        const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) cleaned = match[1].trim();
      }
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(cleaned);
      if (parsed.displayText && typeof parsed.displayText === "string") {
        return parsed.displayText.trim();
      }
    } catch (err: any) {
      console.warn(`[CaptionVerificationAgent] Meta AI completion warning: ${err.message}. Applying deterministic regex normalizer.`);
    }

    // Deterministic fallback regex sanitizer
    return this.applyDeterministicRegex(rawNarration);
  }

  private applyDeterministicRegex(text: string): string {
    return text
      .replace(/\b([a-zA-Z0-9_\-]+)\s+dot\s+(com|org|net|io|dev|edu|gov|ai|co)\b/gi, "$1.$2")
      .replace(/\bdot\s+(com|org|net|io|dev|edu|gov|ai|co)\b/gi, ".$1")
      .replace(/\byou-tube\b/gi, "YouTube")
      .replace(/\bdee-en-ess\b/gi, "DNS")
      .replace(/\btee-ell-dee\b/gi, "TLD")
      .replace(/\beye-pee\b/gi, "IP")
      .replace(/\btee-see-pee\b/gi, "TCP")
      .replace(/\btee-tee-ell\b/gi, "TTL")
      .replace(/\bo-see-ess-pee\b/gi, "OCSP")
      .replace(/\bess-queue-ell\b/gi, "SQL")
      .replace(/\bpost-gres\b/gi, "PostgreSQL")
      .replace(/\b[oO]\s+of\s+log\s+n\b/g, "O(log n)")
      .replace(/\b[oO]\s+of\s+(?:one|1)\b/g, "O(1)")
      .replace(/\b[oO]\s+of\s+n\b/g, "O(n)")
      .replace(/\b(\d+)\s+milliseconds?\b/gi, "$1ms")
      .replace(/\bkilo-bytes\b/gi, "KB")
      .replace(/\bmega-bytes\b/gi, "MB")
      .replace(/\bgiga-bytes\b/gi, "GB");
  }

  /**
   * Main entry point: Verifies and cleans captions across all segments in a TeachingScript.
   */
  async verifyAndCleanCaptions(script: TeachingScript): Promise<TeachingScript> {
    const verifiedSegments = await Promise.all(
      script.segments.map(async (seg) => {
        // 1. AI normalization of the full segment display text
        const aiCleanText = await this.verifyCaptionWithMetaAI(seg.narrationText);
        // Ensure deterministic safety pass over AI output
        const finalCleanText = this.applyDeterministicRegex(aiCleanText);

        // 2. Align word-level timings with clean visual tokens
        const rawTimings = seg.wordTimings || [];
        const cleanTimings = this.alignAndCleanWordTimings(rawTimings);

        return {
          ...seg,
          captionText: finalCleanText,
          displayWordTimings: cleanTimings,
        };
      })
    );

    return {
      ...script,
      segments: verifiedSegments,
    };
  }
}
