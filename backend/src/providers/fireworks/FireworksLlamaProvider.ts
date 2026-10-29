export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMProvider {
  name: string;
  generateCompletion(messages: LLMMessage[], options?: { jsonMode?: boolean; temperature?: number }): Promise<string>;
}

export class FireworksLlamaProvider implements LLMProvider {
  name = "fireworks-llama";
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.FIREWORKS_API_KEY || "";
    // Using Meta open-weight Llama 3.3 70B or Llama 3.1 8B
    this.model = model || process.env.FIREWORKS_MODEL || "accounts/fireworks/models/llama-v3p3-70b-instruct";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async generateCompletion(messages: LLMMessage[], options?: { jsonMode?: boolean; temperature?: number }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Fireworks API key is not configured. Please set FIREWORKS_API_KEY.");
    }

    const payload: any = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: 3000,
    };

    if (options?.jsonMode) {
      payload.response_format = { type: "json_object" };
    }

    const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fireworks API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.choices[0]?.message?.content || "";
  }
}
