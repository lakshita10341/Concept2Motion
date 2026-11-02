import https from "https";
import { LLMMessage, LLMProvider } from "../fireworks/FireworksLlamaProvider.js";

export class MetaModelAPIProvider implements LLMProvider {
  name = "meta-model-api";
  private apiKey: string;
  private baseUrl: string;
  private textModel: string;
  private imageModel: string;

  constructor(options?: { apiKey?: string; baseUrl?: string; textModel?: string; imageModel?: string }) {
    this.apiKey = options?.apiKey || process.env.MODEL_API_KEY || "";
    this.baseUrl = (options?.baseUrl || process.env.META_API_BASE_URL || "https://api.meta.ai/v1").replace(/\/$/, "");
    this.textModel = options?.textModel || process.env.META_TEXT_MODEL || "muse-spark-1.3";
    this.imageModel = options?.imageModel || process.env.META_IMAGE_MODEL || "muse-image-1.0";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  getTextModel(): string {
    return this.textModel;
  }

  getImageModel(): string {
    return this.imageModel;
  }

  /**
   * Internal HTTPS request with explicit IPv4 connection (family: 4) to ensure high reliability.
   */
  private makeRequest(path: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      const postData = JSON.stringify(payload);

      const req = https.request(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname,
          method: "POST",
          family: 4, // Prevents ENETUNREACH on IPv6-unroutable networks
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Length": Buffer.byteLength(postData),
          },
        },
        (res) => {
          res.setEncoding("utf8");
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                resolve(data);
              }
            } else {
              reject(new Error(`Meta Model API error (${res.statusCode}): ${data}`));
            }
          });
        }
      );

      req.on("error", (err) => reject(err));
      req.setTimeout(180000, () => {
        req.destroy();
        reject(new Error("Meta Model API request timed out after 180s"));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Generates completions via Muse Spark (e.g. muse-spark-1.3)
   */
  async generateCompletion(
    messages: LLMMessage[],
    options?: { jsonMode?: boolean; temperature?: number; maxTokens?: number }
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Meta Model API key is not configured. Set MODEL_API_KEY in your environment or backend/.env");
    }

    const payload: any = {
      model: this.textModel,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 8192,
    };

    const data = await this.makeRequest("/chat/completions", payload);
    return data.choices?.[0]?.message?.content || "";
  }

  /**
   * Generates images via Muse Image (e.g. muse-image-1.0)
   */
  async generateImage(prompt: string, options?: { size?: string; n?: number }): Promise<{ url?: string; b64_json?: string }> {
    if (!this.isConfigured()) {
      throw new Error("Meta Model API key is not configured. Set MODEL_API_KEY in your environment or backend/.env");
    }

    const payload = {
      model: this.imageModel,
      prompt,
      n: options?.n ?? 1,
      size: options?.size ?? "1024x1024",
    };

    const data = await this.makeRequest("/images/generations", payload);
    return data.data?.[0] || {};
  }
}
