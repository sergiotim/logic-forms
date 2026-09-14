jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/lib/db', () => ({
  getPhasesFromDb: jest.fn(),
  syncPhasesToDb: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

import { GET, POST } from '@/app/api/phases/route';
import { getPhasesFromDb, syncPhasesToDb } from '@/lib/db';
import { getServerSession } from 'next-auth';

describe('/api/phases Route Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TEACHER_EMAILS = 'prof@teste.com';
  });

  describe('GET', () => {
    it('retorna a lista de fases com status 200', async () => {
      (getPhasesFromDb as jest.Mock).mockResolvedValue([
        { id: 'f-1', titulo: 'Fase 1', icone: 'Network', questoes: [] },
      ]);

      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.phases).toHaveLength(1);
      expect(json.phases[0].id).toBe('f-1');
    });
  });

  describe('POST', () => {
    it('retorna 403 se o usuário não for professor', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'aluno@teste.com', role: 'STUDENT' },
      });

      const mockReq = {
        json: async () => ({ phases: [] }),
      } as unknown as Request;

      const res = await POST(mockReq);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Não autorizado/i);
      expect(syncPhasesToDb).not.toHaveBeenCalled();
    });

    it('permite que professor salve alterações e sincronize com o banco', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'prof@teste.com', role: 'TEACHER' },
      });
      (syncPhasesToDb as jest.Mock).mockResolvedValue(undefined);

      const phases = [
        { id: 'f-1', titulo: 'Nova Fase', icone: 'Table2', questoes: [] },
      ];

      const mockReq = {
        json: async () => ({ phases }),
      } as unknown as Request;

      const res = await POST(mockReq);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(1);
      expect(syncPhasesToDb).toHaveBeenCalledWith(phases);
    });
  });
});
