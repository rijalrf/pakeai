import { NextResponse } from 'next/server';
import { authenticateAgentRequest } from '@/lib/agent/auth';
import { INITIAL_TASKS } from '@/lib/ai/tasks';

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
  const task = INITIAL_TASKS.find((t) => t.id === taskId);

  if (!task) {
    return NextResponse.json(
      { success: false, error: `Task dengan ID ${taskId} tidak ditemukan.` },
      { status: 404 }
    );
  }

  task.status = 'IN_PROGRESS';

  return NextResponse.json({
    success: true,
    taskId,
    status: 'IN_PROGRESS',
    message: `Task #${taskId} berhasil diubah statusnya menjadi IN_PROGRESS. AI Coding Agent dapat mulai eksekusi file.`,
    started_at: new Date().toISOString(),
  });
}
