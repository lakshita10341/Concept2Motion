export class FireworksLlamaProvider {
    name = "fireworks-llama";
    apiKey;
    model;
    constructor(apiKey, model) {
        this.apiKey = apiKey || process.env.FIREWORKS_API_KEY || "";
        // Using Meta open-weight Llama 3.3 70B or Llama 3.1 8B
        this.model = model || process.env.FIREWORKS_MODEL || "accounts/fireworks/models/llama-v3p3-70b-instruct";
    }
    isConfigured() {
        return Boolean(this.apiKey && this.apiKey.length > 5);
    }
    async generateCompletion(messages, options) {
        if (!this.isConfigured()) {
            throw new Error("Fireworks API key is not configured. Please set FIREWORKS_API_KEY.");
        }
        const payload = {
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
        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    }
}
