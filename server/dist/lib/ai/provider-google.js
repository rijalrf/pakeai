"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
class GoogleProvider {
    name = 'google';
    client = null;
    model;
    constructor(apiKey, model = 'gemini-1.5-pro') {
        const key = apiKey || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
        if (key) {
            this.client = new generative_ai_1.GoogleGenerativeAI(key);
        }
        this.model = model;
    }
    async generateText(params) {
        if (!this.client) {
            throw new Error('GOOGLE_AI_API_KEY tidak dikonfigurasi.');
        }
        const genModel = this.client.getGenerativeModel({
            model: this.model,
            systemInstruction: params.systemPrompt,
        });
        const result = await genModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: params.userPrompt }] }],
            generationConfig: {
                temperature: params.temperature ?? 0.2,
                maxOutputTokens: params.maxTokens || 4096,
            },
        });
        const response = await result.response;
        const text = response.text();
        return {
            text,
            model: this.model,
            provider: this.name,
        };
    }
    async generateJSON(params) {
        if (!this.client) {
            throw new Error('GOOGLE_AI_API_KEY tidak dikonfigurasi.');
        }
        const maxRetries = params.retries ?? 2;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const strictPrompt = `${params.userPrompt}\n\nIMPORTANT: Keluarkan HANYA JSON murni yang valid tanpa awalan atau akhiran markdown.`;
                const res = await this.generateText({
                    ...params,
                    userPrompt: strictPrompt,
                });
                const cleaned = res.text
                    .replace(/```json/gi, '')
                    .replace(/```/g, '')
                    .trim();
                const parsed = JSON.parse(cleaned);
                return params.schema.parse(parsed);
            }
            catch (err) {
                lastError = err;
            }
        }
        throw new Error(`Gagal menghasilkan JSON valid dengan Gemini: ${lastError?.message}`);
    }
}
exports.GoogleProvider = GoogleProvider;
