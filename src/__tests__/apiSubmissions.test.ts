jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/lib/db', () => ({
  getUserSubmissions: jest.fn(),
  saveUserSubmission: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

import { GET, POST } from '@/app/api/submissions/route';
import { getUserSubmissions, saveUserSubmission } from '@/lib/db';
import { getServerSession } from 'next-auth';

describe('/api/submissions Route Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('retorna 401 se o usuário não estiver autenticado', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/Não autenticado/i);
    });

    it('retorna a lista de submissões do usuário com status 200', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1', email: 'aluno@ulbra.br' },
      });
      (getUserSubmissions as jest.Mock).mockResolvedValue([
        { questionId: 'q-1', isCorrect: true, answer: { f1: 'P' } },
      ]);

      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.submissions).toHaveLength(1);
      expect(json.submissions[0].questionId).toBe('q-1');
      expect(getUserSubmissions).toHaveBeenCalledWith('user-1');
    });
  });

  describe('POST', () => {
    it('retorna 401 se o usuário não estiver autenticado', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const mockReq = {
        json: async () => ({ questionId: 'q-1', isCorrect: true }),
      } as unknown as Request;

      const res = await POST(mockReq);
      expect(res.status).toBe(401);
    });

    it('retorna 400 se questionId estiver ausente', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1', email: 'aluno@ulbra.br' },
      });

      const mockReq = {
        json: async () => ({ isCorrect: true }),
      } as unknown as Request;

      const res = await POST(mockReq);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/questionId é obrigatório/i);
    });

    it('salva a submissão com sucesso no banco', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1', email: 'aluno@ulbra.br' },
      });
      (saveUserSubmission as jest.Mock).mockResolvedValue(undefined);

      const mockReq = {
        json: async () => ({
          questionId: 'q-1',
          isCorrect: true,
          answer: { f1: 'P' },
        }),
      } as unknown as Request;

      const res = await POST(mockReq);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(saveUserSubmission).toHaveBeenCalledWith({
        userId: 'user-1',
        questionId: 'q-1',
        isCorrect: true,
        answer: { f1: 'P' },
      });
    });
  });
});
