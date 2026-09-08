import { NextResponse } from 'next/server';
import { authenticateAgentRequest } from '@/lib/agent/auth';
import { INITIAL_TASKS } from '@/lib/ai/tasks';
import { buildAgentTaskContext, formatAgentMarkdownPrompt } from '@/lib/ai/context';

export async function GET(
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

  const context = buildAgentTaskContext(
    task,
    'Aplikasi Booking Lapangan Futsal',
    'Platform reservasi lapangan olahraga real-time dengan hold slot 15 menit dan QRIS.'
  );

  return NextResponse.json({
    success: true,
    taskId,
    context,
    markdownPrompt: formatAgentMarkdownPrompt(context),
  });
}
