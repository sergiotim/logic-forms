import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserSubmissions, saveUserSubmission } from '@/lib/db';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let userId = session.user.id;
    if (!userId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const submissions = await getUserSubmissions(userId);
    return NextResponse.json({ submissions });
  } catch (error: unknown) {
    console.error('Erro ao buscar submissões:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar submissões do banco de dados' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let userId = session.user.id;
    if (!userId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const { questionId, isCorrect, answer } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: 'Parâmetro questionId é obrigatório' },
        { status: 400 },
      );
    }

    await saveUserSubmission({
      userId,
      questionId,
      isCorrect: Boolean(isCorrect),
      answer: answer ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Erro ao registrar submissão:', error);
    const message = error instanceof Error ? error.message : 'Erro ao registrar resposta';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
