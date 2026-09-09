import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { hashPassword, createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email tidak valid.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Periksa apakah email sudah terdaftar
    const existing = await query<any>(`SELECT id FROM auth_users WHERE email = $1 LIMIT 1`, [cleanEmail]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar. Silakan login.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const inserted = await query<any>(
      `INSERT INTO auth_users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name as "fullName"`,
      [cleanEmail, passwordHash, fullName || null]
    );

    const user = inserted[0];
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
    console.error('Error saat registrasi:', err);
    return NextResponse.json({ error: 'Gagal melakukan registrasi akun.' }, { status: 500 });
  }
}
