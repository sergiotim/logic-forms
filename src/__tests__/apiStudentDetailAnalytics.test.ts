jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/lib/analytics', () => ({
  getStudentDetailAnalytics: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

import { GET } from '@/app/api/analytics/students/[id]/route';
import { getStudentDetailAnalytics } from '@/lib/analytics';
import { getServerSession } from 'next-auth';

describe('/api/analytics/students/[id] Route Handler (SPEC-009)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TEACHER_EMAILS = 'professor@faculdade.edu';
  });

  it('deve retornar 401 Unauthorized se o usuário não estiver autenticado', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const mockReq = {} as Request;
    const res = await GET(mockReq, { params: Promise.resolve({ id: 'student-1' }) });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/Não autenticado/i);
  });

  it('deve retornar 403 Forbidden se o usuário autenticado não for professor', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'aluno@faculdade.edu', role: 'STUDENT' },
    });

    const mockReq = {} as Request;
    const res = await GET(mockReq, { params: Promise.resolve({ id: 'student-1' }) });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/Acesso restrito a professores/i);
  });

  it('deve retornar 200 OK com o Raio-X individual do estudante quando autenticado como professor', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'professor@faculdade.edu', role: 'TEACHER' },
    });

    const mockDetail = {
      student: {
        id: 'student-1',
        name: 'Aluno Teste',
        email: 'aluno@faculdade.edu',
      },
      fases: [
        {
          phaseId: 'p-1',
          titulo: 'Fase 1',
          questoesConcluidas: 1,
          totalQuestoes: 1,
          questoes: [],
        },
      ],
    };

    (getStudentDetailAnalytics as jest.Mock).mockResolvedValue(mockDetail);

    const mockReq = {} as Request;
    const res = await GET(mockReq, { params: Promise.resolve({ id: 'student-1' }) });

    expect(res.status).toBe(200);
    expect(getStudentDetailAnalytics).toHaveBeenCalledWith('student-1');
    const data = await res.json();
    expect(data.student.name).toBe('Aluno Teste');
    expect(data.fases).toHaveLength(1);
  });

  it('deve retornar 404 se o estudante não for encontrado', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'professor@faculdade.edu', role: 'TEACHER' },
    });

    (getStudentDetailAnalytics as jest.Mock).mockRejectedValue(
      new Error('Estudante não encontrado para o id: student-999')
    );

    const mockReq = {} as Request;
    const res = await GET(mockReq, { params: Promise.resolve({ id: 'student-999' }) });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/não encontrado/i);
  });
});

