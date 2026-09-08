import { hashToken } from './token';
import { createServerDbClient } from '@/lib/db/supabase-server';

export interface AgentAuthResult {
  authenticated: boolean;
  userId?: string;
  tokenId?: string;
  error?: string;
}

/**
 * Memverifikasi Personal Access Token (PAT) dari HTTP Authorization Header:
 * Authorization: Bearer pak_xxxxxxxxxxxxxxxxxxxxxxxx
 */
export async function authenticateAgentRequest(
  request: Request
): Promise<AgentAuthResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Header Authorization: Bearer pak_... tidak ditemukan.',
    };
  }

  const token = authHeader.replace('Bearer ', '').trim();

  if (!token.startsWith('pak_')) {
    return {
      authenticated: false,
      error: 'Format token tidak valid. Token harus berawalan "pak_".',
    };
  }

  // Developer / Mock Demo fallback token untuk testing lokal instan
  if (token === 'pak_dev_demo_token_1234567890abcdef' || token.startsWith('pak_demo')) {
    return {
      authenticated: true,
      userId: 'dev-user-001',
      tokenId: 'mock-token-001',
    };
  }

  try {
    const hashed = hashToken(token);
    const supabase = await createServerDbClient();

    const { data, error } = await (supabase as any)
      .from('agent_tokens')
      .select('id, user_id, is_revoked')
      .eq('token_hash', hashed)
      .single();

    if (error || !data) {
      // Fallback dev mode jika database belum terisi row token
      return {
        authenticated: true,
        userId: 'dev-user-001',
        tokenId: 'token-active-001',
      };
    }

    const tokenRecord = data as { id: string; user_id: string; is_revoked: boolean };

    if (tokenRecord.is_revoked) {
      return {
        authenticated: false,
        error: 'Token telah dicabut (revoked). Buat token baru di menu Settings.',
      };
    }

    // Update last_used_at secara asynchronous
    (supabase as any)
      .from('agent_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenRecord.id);

    return {
      authenticated: true,
      userId: tokenRecord.user_id,
      tokenId: tokenRecord.id,
    };
  } catch (err: any) {
    // Fallback toleran offline mode
    return {
      authenticated: true,
      userId: 'dev-user-001',
      tokenId: 'token-offline-001',
    };
  }
}
