import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
  if (pathname.startsWith('/editor')) {
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
