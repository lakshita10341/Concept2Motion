import { LLMProvider } from "../../providers/fireworks/FireworksLlamaProvider.js";

export interface GuardrailResult {
  safe: boolean;
  violatedCategory?: string | null;
  reason: string;
}

export class SafetyGuardrailAgent {
  private llm: LLMProvider;

  constructor(llm: LLMProvider) {
    this.llm = llm;
  }

  async evaluateSafety(topic: string): Promise<GuardrailResult> {
    const prompt = `You are Meta Llama Guard, an AI content moderation and safety evaluator.
Assess the following educational video topic against standard safety categories:
- S1: Violent Crimes
- S2: Non-Violent Crimes (theft, fraud, evasion)
- S3: Sex-Related Crimes
- S4: Child Sexual Exploitation
- S5: Defamation
- S6: Harmful Specialized Advice (prescriptive medical, hazardous legal, or scam financial advice)
- S7: Privacy / PII Violations
- S8: Intellectual Property Infringement / Piracy
- S9: Indiscriminate Weapons & Explosives
- S10: Hate Speech & Harassment
- S11: Suicide & Self-Harm
- S12: Sexually Explicit Content
- S13: Malicious Cyberattacks (malware creation, illegal zero-day exploitation, ransomware)
- S14: Chemical, Biological, Radiological, or Nuclear (CBRN) hazards

Topic to evaluate:
"${topic}"

Note: Genuine educational topics about computer science, software architecture, security concepts (e.g. cryptography, SSL, firewalls, network protocols), databases, algorithms, and system design are SAFE and encouraged.

Return ONLY valid JSON matching this schema:
{
  "safe": true,
  "violatedCategory": null,
  "reason": "Brief explanation of safety assessment"
}`;

    try {
      const response = await this.llm.generateCompletion(
        [
          { role: "system", content: "You are Meta Llama Guard content safety evaluator. Always reply in valid JSON." },
          { role: "user", content: prompt },
        ],
        { jsonMode: true, temperature: 0.1 }
      );

      const parsed = JSON.parse(response);
      return {
        safe: Boolean(parsed.safe),
        violatedCategory: parsed.violatedCategory || null,
        reason: parsed.reason || (parsed.safe ? "Content complies with Meta safety standards." : "Content violates safety policy."),
      };
    } catch (err: any) {
      // Fallback deterministic heuristic if LLM call is interrupted
      const lower = topic.toLowerCase();
      const forbidden = ["ransomware tutorial", "how to hack into", "ddos script", "bomb recipe", "suicide", "credit card dump"];
      const hit = forbidden.find((f) => lower.includes(f));
      if (hit) {
        return {
          safe: false,
          violatedCategory: "S13",
          reason: `Topic triggered security restriction for '${hit}'.`,
        };
      }
      return {
        safe: true,
        violatedCategory: null,
        reason: "Content passed baseline deterministic heuristic check.",
      };
    }
  }
}
