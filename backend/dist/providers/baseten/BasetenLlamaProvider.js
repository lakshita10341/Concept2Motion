export class BasetenLlamaProvider {
    name = "baseten-llama";
    apiKey;
    modelId;
    constructor(apiKey, modelId) {
        this.apiKey = apiKey || process.env.BASETEN_API_KEY || "";
        this.modelId = modelId || process.env.BASETEN_MODEL_ID || "";
    }
    isConfigured() {
        return Boolean(this.apiKey && this.modelId);
    }
    async generateCompletion(messages, options) {
        if (!this.isConfigured()) {
            throw new Error("Baseten API key or Model ID not configured.");
        }
        const response = await fetch(`https://model-${this.modelId}.api.baseten.co/production/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Api-Key ${this.apiKey}`,
            },
            body: JSON.stringify({
                messages,
                temperature: options?.temperature ?? 0.2,
                max_tokens: 3000,
                response_format: options?.jsonMode ? { type: "json_object" } : undefined,
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Baseten API error (${response.status}): ${err}`);
        }
        const data = await response.json();
        return data.choices?.[0]?.message?.content || data.output || JSON.stringify(data);
    }
}
