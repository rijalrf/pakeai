import OpenAI from 'openai';
import type { AIProvider, GenerateJSONParams, GenerateTextParams, GenerateTextResult } from './types';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI | null = null;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || 'http://localhost:20128/v1';
    this.model = model || process.env.OPENAI_MODEL || 'ai-builder';

    if (key) {
      this.client = new OpenAI({
        apiKey: key,
        baseURL,
      });
    }
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
    if (!this.client) {
      throw new Error('OPENAI_API_KEY tidak dikonfigurasi.');
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      stream: false,
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

  async generateJSON<T>(params: GenerateJSONParams<T>): Promise<T> {
    if (!this.client) {
      throw new Error('OPENAI_API_KEY tidak dikonfigurasi.');
    }

    const maxRetries = params.retries ?? 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          stream: false,
          temperature: params.temperature ?? 0.1,
          max_tokens: params.maxTokens || 4096,
          messages: [
            {
              role: 'system',
              content: `${params.systemPrompt}\n\nPENTING: Kembalikan HANYA format JSON valid tanpa tag markdown code block (\`\`\`json) atau teks pengantar apapun.`,
            },
            { role: 'user', content: params.userPrompt },
          ],
        });

        let raw = response.choices[0]?.message?.content || '{}';

        // Bersihkan markdown codeblock jika model membungkusnya
        raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

        const parsed = JSON.parse(raw);
        return params.schema.parse(parsed);
      } catch (err: any) {
        lastError = err;
      }
    }

    throw new Error(`Gagal menghasilkan JSON valid dengan model ${this.model}: ${lastError?.message}`);
  }
}
