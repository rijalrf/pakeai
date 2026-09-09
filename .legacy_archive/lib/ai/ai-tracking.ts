import 'server-only';
import { getAIService } from './ai-service';
import { recordAIGeneration } from './cost-tracker';
import type { AIProvider } from './types';

/**
 * Wrapper pelacakan performa & konsumsi token AI.
 *
 * Dipasang `server-only` agar tidak ikut terbundel ke client bundle
 * (modul ini menarik `cost-tracker` -> `pg` yang berisi modul Node.js).
 *
 * Hanya boleh dipanggil dari Server Components, Route Handlers, atau
 * Server Actions. Client component harus panggil AI via API route.
 */
export async function executeWithTracking<T>(
  options: {
    stage: string;
    projectId?: string | null;
    userId?: string | null;
    provider?: string;
  },
  operation: (ai: AIProvider) => Promise<T>
): Promise<T> {
  const start = performance.now();
  const ai = getAIService(options.provider);

  try {
    const result = await operation(ai);
    const latency = Math.round(performance.now() - start);

    // Perkiraan rata-rata token per stage jika provider tidak mengekspos
    const stageTokenMap: Record<string, { prompt: number; completion: number }> = {
      discovery: { prompt: 600, completion: 450 },
      prd: { prompt: 1200, completion: 1800 },
      roadmap: { prompt: 1500, completion: 1400 },
      tasks: { prompt: 2000, completion: 2500 },
      review: { prompt: 1000, completion: 500 },
    };

    const tokens = stageTokenMap[options.stage.toLowerCase()] || { prompt: 800, completion: 800 };

    recordAIGeneration({
      userId: options.userId,
      projectId: options.projectId,
      stage: options.stage,
      provider: ai.name,
      model: (ai as any).model || 'default-model',
      promptTokens: tokens.prompt,
      completionTokens: tokens.completion,
      latencyMs: latency,
      status: 'success',
    }).catch(() => {});

    return result;
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);

    recordAIGeneration({
      userId: options.userId,
      projectId: options.projectId,
      stage: options.stage,
      provider: ai.name,
      model: (ai as any).model || 'default-model',
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: latency,
      status: 'error',
      errorMessage: err.message,
    }).catch(() => {});

    throw err;
  }
}
