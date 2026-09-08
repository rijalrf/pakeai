import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, GenerateJSONParams, GenerateTextParams, GenerateTextResult } from './types';

export class GoogleProvider implements AIProvider {
  name = 'google';
  private client: GoogleGenerativeAI | null = null;
  private model: string;

  constructor(apiKey?: string, model = 'gemini-1.5-pro') {
    const key = apiKey || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (key) {
      this.client = new GoogleGenerativeAI(key);
    }
    this.model = model;
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
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

  async generateJSON<T>(params: GenerateJSONParams<T>): Promise<T> {
    if (!this.client) {
      throw new Error('GOOGLE_AI_API_KEY tidak dikonfigurasi.');
    }

    const maxRetries = params.retries ?? 2;
    let lastError: Error | null = null;

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
      } catch (err: any) {
        lastError = err;
      }
    }

    throw new Error(`Gagal menghasilkan JSON valid dengan Gemini: ${lastError?.message}`);
  }
}
