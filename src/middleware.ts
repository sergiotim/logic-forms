import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { userAgent } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // 1. Usuário não autenticado
  if (!token) {
    if (pathname === '/login') {
      return NextResponse.next();
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Usuário autenticado tentando acessar o /login
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. Verificação de permissões (RBAC) para o /editor
  // 3. Verificação de permissões (RBAC) e Dispositivo para o /editor
  if (pathname.startsWith('/editor')) {
    const { device } = userAgent(request);
    
    // Bloqueia qualquer dispositivo classificado como mobile (smartphones)
    // device.type pode ser 'console', 'mobile', 'tablet', 'smarttv', 'wearable' ou undefined (desktop)
    if (device.type === 'mobile') {
      const url = new URL('/', request.url);
      url.searchParams.set('error', 'mobile_not_supported');
      return NextResponse.redirect(url);
    }
    const teacherEmails = (process.env.TEACHER_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const email = (token.email || '').toLowerCase();
    const isTeacher = (token as { role?: string }).role === 'TEACHER' || teacherEmails.includes(email);

    if (!isTeacher) {
      // Bloqueia alunos e redireciona para a raiz
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/editor/:path*', '/login'],
};
