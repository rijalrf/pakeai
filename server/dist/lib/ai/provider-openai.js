"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
class OpenAIProvider {
    name = 'openai';
    client = null;
    model;
    constructor(apiKey, model = 'gpt-4o') {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (key) {
            this.client = new openai_1.default({ apiKey: key });
        }
        this.model = model;
    }
    async generateText(params) {
        if (!this.client) {
            throw new Error('OPENAI_API_KEY tidak dikonfigurasi.');
        }
        const response = await this.client.chat.completions.create({
            model: this.model,
            temperature: params.temperature ?? 0.2,
            max_tokens: params.maxTokens || 4096,
            messages: [
                { role: 'system', content: params.systemPrompt },
                { role: 'user', content: params.userPrompt },
            ],
        });
        const text = response.choices[0]?.message?.content || '';
        return {
            text,
            usage: {
                promptTokens: response.usage?.prompt_tokens || 0,
                completionTokens: response.usage?.completion_tokens || 0,
                totalTokens: response.usage?.total_tokens || 0,
            },
            model: this.model,
            provider: this.name,
        };
    }
    async generateJSON(params) {
        if (!this.client) {
            throw new Error('OPENAI_API_KEY tidak dikonfigurasi.');
        }
        const maxRetries = params.retries ?? 2;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.client.chat.completions.create({
                    model: this.model,
                    temperature: params.temperature ?? 0.2,
                    max_tokens: params.maxTokens || 4096,
                    response_format: { type: 'json_object' },
                    messages: [
                        {
                            role: 'system',
                            content: `${params.systemPrompt}\nKeluarkan HANYA JSON murni yang sesuai dengan struktur permintaan.`,
                        },
                        { role: 'user', content: params.userPrompt },
                    ],
                });
                const text = response.choices[0]?.message?.content || '{}';
                const parsed = JSON.parse(text);
                return params.schema.parse(parsed);
            }
            catch (err) {
                lastError = err;
            }
        }
        throw new Error(`Gagal menghasilkan JSON valid dengan OpenAI: ${lastError?.message}`);
    }
}
exports.OpenAIProvider = OpenAIProvider;
