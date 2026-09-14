import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPhasesFromDb, syncPhasesToDb } from '@/lib/db';
import type { Phase } from '@/types';

export async function GET() {
  try {
    const phases = await getPhasesFromDb();
    return NextResponse.json({ phases });
  } catch (error: unknown) {
    console.error('Erro ao buscar fases do banco:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar fases do banco de dados' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    const isTeacher =
      session?.user?.role === 'TEACHER' ||
      (process.env.TEACHER_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
        .includes((session?.user?.email || '').toLowerCase());

    if (!isTeacher) {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas professores podem salvar alterações.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const phases = (body.phases || []) as Phase[];

    await syncPhasesToDb(phases);

    return NextResponse.json({ success: true, count: phases.length });
  } catch (error: unknown) {
    console.error('Erro ao salvar fases no banco:', error);
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar dados com o banco';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
