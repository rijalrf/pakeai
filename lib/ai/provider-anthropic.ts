import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, GenerateJSONParams, GenerateTextParams, GenerateTextResult } from './types';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: Anthropic | null = null;
  private model: string;

  constructor(apiKey?: string, model = 'claude-3-5-sonnet-20241022') {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (key) {
      this.client = new Anthropic({ apiKey: key });
    }
    this.model = model;
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
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
      .map((block) => (block as { type: 'text'; text: string }).text)
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

  async generateJSON<T>(params: GenerateJSONParams<T>): Promise<T> {
    const maxRetries = params.retries ?? 2;
    let lastError: Error | null = null;

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
      } catch (err: any) {
        lastError = err;
      }
    }

    throw new Error(`Gagal menghasilkan JSON valid setelah ${maxRetries + 1} percobaan: ${lastError?.message}`);
  }
}
