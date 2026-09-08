"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class AnthropicProvider {
    name = 'anthropic';
    client = null;
    model;
    constructor(apiKey, model = 'claude-3-5-sonnet-20241022') {
        const key = apiKey || process.env.ANTHROPIC_API_KEY;
        if (key) {
            this.client = new sdk_1.default({ apiKey: key });
        }
        this.model = model;
    }
    async generateText(params) {
        if (!this.client) {
            throw new Error('ANTHROPIC_API_KEY tidak dikonfigurasi.');
        }
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: params.maxTokens || 4096,
            temperature: params.temperature ?? 0.2,
            system: params.systemPrompt,
            messages: [{ role: 'user', content: params.userPrompt }],
        });
        const text = response.content
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join('\n');
        return {
            text,
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            },
            model: this.model,
            provider: this.name,
        };
    }
    async generateJSON(params) {
        const maxRetries = params.retries ?? 2;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const strictPrompt = `${params.userPrompt}\n\nIMPORTANT: Keluarkan HANYA raw JSON murni yang valid tanpa Markdown codeblocks (\`\`\`json), tanpa kata pengantar, dan tanpa penutup.`;
                const res = await this.generateText({
                    ...params,
                    userPrompt: strictPrompt,
                });
                const cleaned = res.text
                    .replace(/```json/gi, '')
                    .replace(/```/g, '')
                    .trim();
                const parsed = JSON.parse(cleaned);
                const validated = params.schema.parse(parsed);
                return validated;
            }
            catch (err) {
                lastError = err;
            }
        }
        throw new Error(`Gagal menghasilkan JSON valid setelah ${maxRetries + 1} percobaan: ${lastError?.message}`);
    }
}
exports.AnthropicProvider = AnthropicProvider;
