import { NextResponse } from 'next/server';
import { deleteSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

    if (match) {
      const token = match.substring(SESSION_COOKIE_NAME.length + 1);
      await deleteSession(token);
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (err: any) {
    console.error('Error saat logout:', err);
    return NextResponse.json({ error: 'Gagal melakukan logout.' }, { status: 500 });
  }
}
