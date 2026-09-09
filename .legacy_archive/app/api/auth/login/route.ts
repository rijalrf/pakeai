import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { verifyPassword, createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const rows = await query<any>(
      `SELECT id, email, password_hash, full_name as "fullName"
       FROM auth_users
       WHERE email = $1
       LIMIT 1`,
      [cleanEmail]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    const user = rows[0];
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id);

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return res;
  } catch (err: any) {
    console.error('Error saat login:', err);
    return NextResponse.json({ error: 'Gagal melakukan login.' }, { status: 500 });
  }
}
