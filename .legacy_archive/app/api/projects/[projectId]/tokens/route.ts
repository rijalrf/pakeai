import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { query } from '@/lib/db/postgres';
import { generatePersonalAccessToken } from '@/lib/agent/token';

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

async function verifyProjectAccess(projectId: string, userId: string): Promise<boolean> {
  if (!isValidUUID(projectId)) {
    return true;
  }
  const rows = await query<any>(
    `SELECT id FROM projects WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [projectId, userId]
  );
  return rows.length > 0;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { projectId } = await context.params;
    const hasAccess = await verifyProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan atau akses ditolak.' }, { status: 403 });
    }

    if (!isValidUUID(projectId)) {
      return NextResponse.json({ tokens: [] });
    }

    const tokens = await query<any>(
      `SELECT id, name, token_prefix as "prefix", created_at as "createdAt", last_used_at as "lastUsedAt", is_revoked as "isRevoked"
       FROM agent_tokens
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    );

    return NextResponse.json({ tokens });
  } catch (err: any) {
    console.error('Error saat mengambil token agent:', err);
    return NextResponse.json({ error: 'Gagal memuat daftar token.' }, { status: 500 });
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { projectId } = await context.params;
    const hasAccess = await verifyProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan atau akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const tokenName = body?.name?.trim() || 'Agent Token';

    const generated = generatePersonalAccessToken(tokenName);

    const rows = await query<any>(
      `INSERT INTO agent_tokens (user_id, project_id, name, token_hash, token_prefix)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, token_prefix as "prefix", created_at as "createdAt"`,
      [user.id, projectId, tokenName, generated.tokenHash, generated.tokenPrefix]
    );

    return NextResponse.json({
      token: {
        ...rows[0],
        rawToken: generated.plainToken, // Hanya dikembalikan saat pembuatan
      },
    });
  } catch (err: any) {
    console.error('Error saat membuat token agent:', err);
    return NextResponse.json({ error: 'Gagal menghasilkan token agent.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { projectId } = await context.params;
    const hasAccess = await verifyProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan atau akses ditolak.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json({ error: 'Parameter tokenId wajib diisi.' }, { status: 400 });
    }

    await query(
      `UPDATE agent_tokens SET is_revoked = TRUE WHERE id = $1 AND project_id = $2`,
      [tokenId, projectId]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error saat mencabut token agent:', err);
    return NextResponse.json({ error: 'Gagal mencabut token agent.' }, { status: 500 });
  }
}
