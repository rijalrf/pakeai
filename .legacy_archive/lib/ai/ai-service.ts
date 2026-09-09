import type { AIProvider, GenerateJSONParams, GenerateTextParams, GenerateTextResult } from './types';
import { AnthropicProvider } from './provider-anthropic';
import { OpenAIProvider } from './provider-openai';
import { GoogleProvider } from './provider-google';

class MockProvider implements AIProvider {
  name = 'mock';

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
    return {
      text: 'Mock response untuk pengujian offline development mode.',
      model: 'mock-model-v1',
      provider: 'mock',
    };
  }

  async generateJSON<T>(params: GenerateJSONParams<T>): Promise<T> {
    // Digunakan saat API key belum diisi untuk keperluan preview UI
    const dummy = {} as any;
    try {
      return params.schema.parse(dummy);
    } catch {
      throw new Error('Mock provider: skema validasi membutuhkan input nyata. Silakan konfigurasikan ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_AI_API_KEY.');
    }
  }
}

export function getAIService(providerName?: string): AIProvider {
  const provider = (providerName || process.env.AI_PROVIDER || 'openai').toLowerCase();

  switch (provider) {
    case 'openai':
      if (process.env.OPENAI_API_KEY) {
        return new OpenAIProvider();
      }
      break;
    case 'anthropic':
    case 'claude':
      if (process.env.ANTHROPIC_API_KEY) {
        return new AnthropicProvider();
      }
      break;
    case 'google':
    case 'gemini':
      if (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY) {
        return new GoogleProvider();
      }
      break;
  }

  // Fallback ke provider yang memiliki key
  if (process.env.OPENAI_API_KEY) return new OpenAIProvider();
  if (process.env.ANTHROPIC_API_KEY) return new AnthropicProvider();
  if (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY) return new GoogleProvider();

  return new MockProvider();
}
