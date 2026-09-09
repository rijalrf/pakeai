import { NextResponse } from 'next/server';
import { authenticateAgentRequest } from '@/lib/agent/auth';
import { INITIAL_TASKS } from '@/lib/ai/tasks';
import { query } from '@/lib/db/postgres';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await authenticateAgentRequest(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Autentikasi gagal.' },
      { status: 401 }
    );
  }

  const { taskId } = await params;

  // 1. Update in-memory task
  const memTask = INITIAL_TASKS.find(
    (t) => t.id === taskId || t.sequence.toString() === taskId
  );
  if (memTask) {
    memTask.status = 'IN_PROGRESS';
  }

  // 2. Update in PostgreSQL
  try {
    await query(
      `UPDATE tasks
       SET status = 'IN_PROGRESS', started_at = NOW(), updated_at = NOW()
       WHERE id::text = $1 OR sequence::text = $1 OR title ILIKE '%' || $1 || '%'`,
      [taskId]
    );
  } catch (err) {
    // Database query fallback
  }

  return NextResponse.json({
    success: true,
    taskId,
    status: 'IN_PROGRESS',
    message: `Task #${taskId} berhasil diubah statusnya menjadi IN_PROGRESS. AI Coding Agent dapat mulai eksekusi file.`,
    started_at: new Date().toISOString(),
  });
}
