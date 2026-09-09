import { hashToken } from './token';
import { query } from '@/lib/db/postgres';

export interface AgentAuthResult {
  authenticated: boolean;
  userId?: string;
  projectId?: string;
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

  try {
    const hashed = hashToken(token);

    const rows = await query<any>(
      `SELECT id, user_id, project_id, is_revoked
       FROM agent_tokens
       WHERE token_hash = $1
       LIMIT 1`,
      [hashed]
    );

    if (rows.length === 0) {
      return {
        authenticated: false,
        error: 'Token akses tidak valid atau tidak terdaftar di sistem.',
      };
    }

    const tokenRecord = rows[0];

    if (tokenRecord.is_revoked) {
      return {
        authenticated: false,
        error: 'Token telah dicabut (revoked). Silakan buat token baru di pengaturan proyek.',
      };
    }

    // Perbarui waktu terakhir digunakan tanpa memblokir respon
    query(
      `UPDATE agent_tokens SET last_used_at = NOW() WHERE id = $1`,
      [tokenRecord.id]
    ).catch((e) => console.error('Gagal memperbarui last_used_at token:', e));

    return {
      authenticated: true,
      userId: tokenRecord.user_id,
      projectId: tokenRecord.project_id || undefined,
      tokenId: tokenRecord.id,
    };
  } catch (err: any) {
    console.error('Error saat verifikasi PAT agent:', err);
    return {
      authenticated: false,
      error: 'Terjadi kegagalan saat memverifikasi token di database.',
    };
  }
}
