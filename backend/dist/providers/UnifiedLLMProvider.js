import dotenv from "dotenv";
dotenv.config();
import { MetaModelAPIProvider } from "./meta/MetaModelAPIProvider.js";
import { FireworksLlamaProvider } from "./fireworks/FireworksLlamaProvider.js";
import { BasetenLlamaProvider } from "./baseten/BasetenLlamaProvider.js";
export class UnifiedLLMProvider {
    name;
    metaProvider;
    fireworksProvider;
    basetenProvider;
    constructor() {
        this.metaProvider = new MetaModelAPIProvider();
        this.fireworksProvider = new FireworksLlamaProvider();
        this.basetenProvider = new BasetenLlamaProvider();
        this.name = this.getActiveProviderName();
    }
    getActiveProviderName() {
        if (this.metaProvider.isConfigured()) {
            return `meta-model-api (${this.metaProvider.getTextModel()})`;
        }
        if (this.fireworksProvider.isConfigured()) {
            return "fireworks-llama";
        }
        if (this.basetenProvider.isConfigured()) {
            return "baseten-llama";
        }
        return "meta-open-weight-emulator (local)";
    }
    isRealModelConnected() {
        return (this.metaProvider.isConfigured() ||
            this.fireworksProvider.isConfigured() ||
            this.basetenProvider.isConfigured());
    }
    getMetaProvider() {
        return this.metaProvider;
    }
    async generateCompletion(messages, options) {
        // 1. Check official Meta Model API first (Muse Spark 1.3)
        if (this.metaProvider.isConfigured()) {
            return this.metaProvider.generateCompletion(messages, options);
        }
        // 2. Check Fireworks AI (Meta Llama 3.3 70B / Llama 3.1 8B)
        if (this.fireworksProvider.isConfigured()) {
            return this.fireworksProvider.generateCompletion(messages, options);
        }
        // 3. Check Baseten
        if (this.basetenProvider.isConfigured()) {
            return this.basetenProvider.generateCompletion(messages, options);
        }
        // 4. Return an explicit error rather than silently pretending a remote model was invoked
        throw new Error("No real model provider configured. Set MODEL_API_KEY (for Meta Muse Spark) or FIREWORKS_API_KEY (for Meta Llama 3.3 70B).");
    }
}
