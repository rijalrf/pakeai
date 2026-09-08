import { NextResponse } from 'next/server';
import { authenticateAgentRequest } from '@/lib/agent/auth';
import { INITIAL_TASKS, type TaskItemData } from '@/lib/ai/tasks';
import { buildAgentTaskContext, formatAgentMarkdownPrompt } from '@/lib/ai/context';

export async function GET(request: Request) {
  const auth = await authenticateAgentRequest(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Autentikasi gagal.' },
      { status: 401 }
    );
  }

  // 1. Cek apakah ada task yang sedang IN_PROGRESS
  const inProgressTask = INITIAL_TASKS.find((t) => t.status === 'IN_PROGRESS');
  if (inProgressTask) {
    const context = buildAgentTaskContext(
      inProgressTask,
      'Aplikasi Booking Lapangan Futsal',
      'Platform reservasi lapangan olahraga real-time.'
    );
    return NextResponse.json({
      success: true,
      hasTask: true,
      status: 'IN_PROGRESS',
      task: inProgressTask,
      context,
      markdownPrompt: formatAgentMarkdownPrompt(context),
      message: 'Melanjutkan task yang sedang berjalan.',
    });
  }

  // 2. Cari task TODO berikutnya yang semua dependensinya sudah DONE
  const nextTask = INITIAL_TASKS.find((t) => {
    if (t.status !== 'TODO') return false;
    if (!t.depends_on_task_ids || t.depends_on_task_ids.length === 0) return true;

    // Pastikan semua dependensi sudah DONE
    return t.depends_on_task_ids.every((depId) => {
      const dep = INITIAL_TASKS.find((item) => item.id === depId);
      return dep && dep.status === 'DONE';
    });
  });

  if (!nextTask) {
    return NextResponse.json({
      success: true,
      hasTask: false,
      message: 'Semua task dalam roadmap saat ini telah selesai atau belum tersedia.',
    });
  }

  const context = buildAgentTaskContext(
    nextTask,
    'Aplikasi Booking Lapangan Futsal',
    'Platform reservasi lapangan olahraga real-time.'
  );

  return NextResponse.json({
    success: true,
    hasTask: true,
    status: 'TODO',
    task: nextTask,
    context,
    markdownPrompt: formatAgentMarkdownPrompt(context),
  });
}
