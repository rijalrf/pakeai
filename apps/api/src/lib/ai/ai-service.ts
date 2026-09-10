// AI service: pilih provider via env, generate JSON dengan retry Zod.
// Port setia dari lib/ai/ai-service.ts & provider-openai.ts.
import OpenAI from 'openai';
import { z } from 'zod';

export type GenerateJsonParams<T> = {
  system: string;
  user: string;
  schema: z.ZodType<T, any, any>;
  maxRetries?: number;
};

const provider = process.env.AI_PROVIDER ?? 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? 'sk-local',
  baseURL: process.env.OPENAI_BASE_URL ?? 'http://localhost:20128/v1',
});

function cleanJsonText(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```json')) {
    text = text.slice(7);
  } else if (text.startsWith('```')) {
    text = text.slice(3);
  }
  if (text.endsWith('```')) {
    text = text.slice(0, -3);
  }
  return text.trim();
}

export async function generateJson<T>({
  system,
  user,
  schema,
  maxRetries = 2,
}: GenerateJsonParams<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const resp = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'ai-builder',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });
      const rawText = resp.choices[0]?.message?.content ?? '';
      const text = cleanJsonText(rawText);
      const parsed = JSON.parse(text);
      const validated = schema.parse(parsed);
      return validated;
    } catch (err) {
      lastErr = err;
      if (i === maxRetries) break;
    }
  }
  // Error eksplisit (TIDAK silent fallback) — caller memutuskan mau fallback atau tidak.
  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(`AI generate JSON gagal: ${msg}`);
}

export async function generateText(system: string, user: string): Promise<string> {
  const resp = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'ai-builder',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.5,
  });
  return resp.choices[0]?.message?.content ?? '';
}
