import { NextResponse } from 'next/server';
import { authenticateAgentRequest } from '@/lib/agent/auth';

export async function POST(request: Request) {
  const auth = await authenticateAgentRequest(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Autentikasi gagal.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Autentikasi PAT berhasil.',
    user: {
      id: auth.userId,
    },
    activeProject: {
      id: 'demo-futsal-project',
      name: 'Aplikasi Booking Lapangan Futsal',
      description: 'Platform reservasi lapangan olahraga real-time dengan hold slot 15 menit dan QRIS.',
    },
  });
}
