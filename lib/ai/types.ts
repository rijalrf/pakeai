import { z } from 'zod';

export interface GenerateTextParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateJSONParams<T> extends GenerateTextParams {
  schema: z.ZodType<T>;
  retries?: number;
}

export interface GenerateTextResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

export interface AIProvider {
  name: string;
  generateText(params: GenerateTextParams): Promise<GenerateTextResult>;
  generateJSON<T>(params: GenerateJSONParams<T>): Promise<T>;
}
