import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncSinglePhaseToDb } from '@/lib/db';
import type { Phase } from '@/types';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const phase = body.phase as Phase;

    if (!phase || !phase.id) {
      return NextResponse.json(
        { error: 'Dados da fase inválidos ou ausentes.' },
        { status: 400 }
      );
    }

    const { id } = await params;
    if (id !== phase.id) {
      return NextResponse.json(
        { error: 'O identificador da rota não corresponde ao ID da fase.' },
        { status: 400 }
      );
    }

    await syncSinglePhaseToDb(phase);

    return NextResponse.json({ success: true, phaseId: phase.id });
  } catch (error: unknown) {
    console.error('Erro ao atualizar fase no banco:', error);
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar fase com o banco';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

