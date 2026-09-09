import 'server-only';
import { query } from '@/lib/db/postgres';

interface RecordAIGenerationParams {
  userId?: string | null;
  projectId?: string | null;
  stage: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  status: 'success' | 'error';
  errorMessage?: string | null;
  retryCount?: number;
}

/**
 * Tabel tarif estimasi per 1.000 tokens (USD)
 */
const PRICING_TABLE: Record<string, { promptPer1k: number; completionPer1k: number }> = {
  'gpt-4o': { promptPer1k: 0.005, completionPer1k: 0.015 },
  'gpt-4o-mini': { promptPer1k: 0.00015, completionPer1k: 0.0006 },
  'claude-3-5-sonnet-20241022': { promptPer1k: 0.003, completionPer1k: 0.015 },
  'claude-3-5-sonnet': { promptPer1k: 0.003, completionPer1k: 0.015 },
  'claude-3-haiku': { promptPer1k: 0.00025, completionPer1k: 0.00125 },
  'gemini-1.5-pro': { promptPer1k: 0.00125, completionPer1k: 0.005 },
  'gemini-1.5-flash': { promptPer1k: 0.000075, completionPer1k: 0.0003 },
  'ai-builder': { promptPer1k: 0, completionPer1k: 0 }, // Local model gateway
};

export function calculateEstimatedCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const normalizedModel = model.toLowerCase();
  const matchedKey = Object.keys(PRICING_TABLE).find((k) =>
    normalizedModel.includes(k.toLowerCase())
  );

  const rates = matchedKey
    ? PRICING_TABLE[matchedKey]
    : { promptPer1k: 0.001, completionPer1k: 0.003 };

  const promptCost = (promptTokens / 1000) * rates.promptPer1k;
  const completionCost = (completionTokens / 1000) * rates.completionPer1k;
  return Number((promptCost + completionCost).toFixed(6));
}

/**
 * Mencatat histori dan konsumsi token AI generation ke database PostgreSQL
 */
export async function recordAIGeneration(params: RecordAIGenerationParams): Promise<void> {
  const totalTokens = (params.promptTokens || 0) + (params.completionTokens || 0);
  const cost = calculateEstimatedCost(params.model, params.promptTokens || 0, params.completionTokens || 0);

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const validProjectId = params.projectId && uuidRegex.test(params.projectId) ? params.projectId : null;
  const validUserId = params.userId && uuidRegex.test(params.userId) ? params.userId : null;

  try {
    await query(
      `INSERT INTO ai_generations (
        user_id, project_id, stage, provider, model,
        prompt_tokens, completion_tokens, total_tokens,
        latency_ms, estimated_cost_usd, status, error_message, retry_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        validUserId,
        validProjectId,
        params.stage,
        params.provider,
        params.model,
        params.promptTokens || 0,
        params.completionTokens || 0,
        totalTokens,
        params.latencyMs || 0,
        cost,
        params.status,
        params.errorMessage || null,
        params.retryCount || 0,
      ]
    );
  } catch (err: any) {
    console.error('Gagal mencatat ai_generations:', err.message);
  }
}
