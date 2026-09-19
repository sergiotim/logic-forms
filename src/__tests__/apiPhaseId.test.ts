jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/lib/db', () => ({
  syncSinglePhaseToDb: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

import { PUT } from '@/app/api/phases/[id]/route';
import { syncSinglePhaseToDb } from '@/lib/db';
import { getServerSession } from 'next-auth';

describe('/api/phases/[id] Route Handler (PUT)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TEACHER_EMAILS = 'prof@teste.com';
  });

  it('retorna 403 se o usuário não for professor', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'aluno@teste.com', role: 'STUDENT' },
    });

    const mockReq = {
      json: async () => ({ phase: { id: 'f-1', titulo: 'Fase 1' } }),
    } as unknown as Request;

    const res = await PUT(mockReq, { params: Promise.resolve({ id: 'f-1' }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/Não autorizado/i);
    expect(syncSinglePhaseToDb).not.toHaveBeenCalled();
  });

  it('retorna 400 se o corpo da requisição não contiver phase válida', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'prof@teste.com', role: 'TEACHER' },
    });

    const mockReq = {
      json: async () => ({}),
    } as unknown as Request;

    const res = await PUT(mockReq, { params: Promise.resolve({ id: 'f-1' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/inválidos ou ausentes/i);
    expect(syncSinglePhaseToDb).not.toHaveBeenCalled();
  });

  it('retorna 400 se o ID da rota for diferente do ID da fase no payload', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'prof@teste.com', role: 'TEACHER' },
    });

    const mockReq = {
      json: async () => ({ phase: { id: 'f-2', titulo: 'Fase 2' } }),
    } as unknown as Request;

    const res = await PUT(mockReq, { params: Promise.resolve({ id: 'f-1' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/não corresponde ao ID/i);
    expect(syncSinglePhaseToDb).not.toHaveBeenCalled();
  });

  it('sincroniza a fase e retorna 200 quando o professor é autorizado e os dados são válidos', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'prof@teste.com', role: 'TEACHER' },
    });
    (syncSinglePhaseToDb as jest.Mock).mockResolvedValue(undefined);

    const phase = {
      id: 'f-1',
      titulo: 'Fase 1 Atualizada',
      icone: 'Network',
      questoes: [],
    };

    const mockReq = {
      json: async () => ({ phase }),
    } as unknown as Request;

    const res = await PUT(mockReq, { params: Promise.resolve({ id: 'f-1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.phaseId).toBe('f-1');
    expect(syncSinglePhaseToDb).toHaveBeenCalledWith(phase);
  });

  it('retorna 500 caso a sincronização falhe', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'prof@teste.com', role: 'TEACHER' },
    });
    (syncSinglePhaseToDb as jest.Mock).mockRejectedValue(new Error('Erro de conexão no banco'));

    const phase = {
      id: 'f-1',
      titulo: 'Fase 1',
      icone: 'Network',
      questoes: [],
    };

    const mockReq = {
      json: async () => ({ phase }),
    } as unknown as Request;

    const res = await PUT(mockReq, { params: Promise.resolve({ id: 'f-1' }) });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Erro de conexão no banco');
  });
});

