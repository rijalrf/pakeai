import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'ai_planner_session';

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasSession = Boolean(sessionToken && sessionToken.trim().length > 0);

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedPageRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/onboarding');
  const isProtectedApiRoute =
    pathname.startsWith('/api/projects') ||
    pathname.startsWith('/api/tasks') ||
    pathname.startsWith('/api/analytics');

  // Proteksi API route: jika tidak ada cookie session, tolak dengan 401
  if (!hasSession && isProtectedApiRoute) {
    return NextResponse.json(
      { error: 'Sesi autentikasi tidak valid atau sudah kedaluwarsa. Silakan login kembali.' },
      { status: 401 }
    );
  }

  // Proteksi halaman web: jika tidak ada cookie session, redirect ke /login
  if (!hasSession && isProtectedPageRoute) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Jika sudah login tapi membuka halaman login/register: redirect ke dashboard
  if (hasSession && isAuthRoute) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
