"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIService = getAIService;
const provider_anthropic_1 = require("./provider-anthropic");
const provider_openai_1 = require("./provider-openai");
const provider_google_1 = require("./provider-google");
class MockProvider {
    name = 'mock';
    async generateText(params) {
        return {
            text: 'Mock response untuk pengujian offline development mode.',
            model: 'mock-model-v1',
            provider: 'mock',
        };
    }
    async generateJSON(params) {
        // Digunakan saat API key belum diisi untuk keperluan preview UI
        const dummy = {};
        try {
            return params.schema.parse(dummy);
        }
        catch {
            throw new Error('Mock provider: skema validasi membutuhkan input nyata. Silakan konfigurasikan ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_AI_API_KEY.');
        }
    }
}
function getAIService(providerName) {
    const provider = (providerName || process.env.AI_PROVIDER || 'anthropic').toLowerCase();
    switch (provider) {
        case 'anthropic':
        case 'claude':
            if (process.env.ANTHROPIC_API_KEY) {
                return new provider_anthropic_1.AnthropicProvider();
            }
            break;
        case 'openai':
            if (process.env.OPENAI_API_KEY) {
                return new provider_openai_1.OpenAIProvider();
            }
            break;
        case 'google':
        case 'gemini':
            if (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY) {
                return new provider_google_1.GoogleProvider();
            }
            break;
    }
    // Fallback ke provider yang memiliki key
    if (process.env.ANTHROPIC_API_KEY)
        return new provider_anthropic_1.AnthropicProvider();
    if (process.env.OPENAI_API_KEY)
        return new provider_openai_1.OpenAIProvider();
    if (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY)
        return new provider_google_1.GoogleProvider();
    return new MockProvider();
}
