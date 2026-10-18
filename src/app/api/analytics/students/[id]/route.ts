import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStudentDetailAnalytics } from '@/lib/analytics';

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const isTeacher =
      session?.user?.role === 'TEACHER' ||
      (process.env.TEACHER_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
        .includes((session?.user?.email || '').toLowerCase());

    if (!isTeacher) {
      return NextResponse.json(
        { error: 'Não autorizado. Acesso restrito a professores.' },
        { status: 403 }
      );
    }

    const { id } = await props.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Identificador do estudante não informado' },
        { status: 400 }
      );
    }

    const detailData = await getStudentDetailAnalytics(id);
    return NextResponse.json(detailData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    const status = message.includes('não encontrado') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

