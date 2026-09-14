import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { getToken } from 'next-auth/jwt';

// Mock do next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}), { virtual: true });

// Mock do NextResponse e userAgent para rastrear os redirecionamentos
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({ type: 'next' })),
    redirect: jest.fn((url) => ({ type: 'redirect', url: url.toString() })),
  },
  userAgent: jest.fn(() => ({ device: { type: undefined } })),
}));

describe('Middleware de Autenticação e Controle de Acesso', () => {
  const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;
  const mockNextResponseRedirect = NextResponse.redirect as jest.MockedFunction<typeof NextResponse.redirect>;
  const mockNextResponseNext = NextResponse.next as jest.MockedFunction<typeof NextResponse.next>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TEACHER_EMAILS = 'teacher1@ulbra.br,teacher2@ulbra.br';
  });

  afterAll(() => {
    delete process.env.TEACHER_EMAILS;
  });

  function createMockRequest(path: string) {
    const url = new URL(`http://localhost:3000${path}`);
    return {
      url: url.toString(),
      nextUrl: {
        pathname: path,
      },
    } as unknown as NextRequest;
  }

  describe('Usuários Não Autenticados', () => {
    beforeEach(() => {
      mockGetToken.mockResolvedValue(null);
    });

    it('deve redirecionar para /login ao tentar acessar a raiz (/)', async () => {
      const req = createMockRequest('/');
      await middleware(req);
      
      expect(mockNextResponseRedirect).toHaveBeenCalledWith(new URL('/login', req.url));
    });

    it('deve redirecionar para /login ao tentar acessar o /editor', async () => {
      const req = createMockRequest('/editor');
      await middleware(req);
      
      expect(mockNextResponseRedirect).toHaveBeenCalledWith(new URL('/login', req.url));
    });
  });

  describe('Usuários Autenticados como Estudante', () => {
    beforeEach(() => {
      mockGetToken.mockResolvedValue({ email: 'aluno@rede.ulbra.br' } as any);
    });

    it('deve permitir acesso à raiz (/)', async () => {
      const req = createMockRequest('/');
      await middleware(req);
      
      expect(mockNextResponseNext).toHaveBeenCalled();
    });

    it('deve redirecionar para a raiz (/) ao tentar acessar o /editor', async () => {
      const req = createMockRequest('/editor');
      await middleware(req);
      
      expect(mockNextResponseRedirect).toHaveBeenCalledWith(new URL('/', req.url));
    });

    it('deve redirecionar para a raiz (/) ao tentar acessar o /editor/analytics', async () => {
      const req = createMockRequest('/editor/analytics');
      await middleware(req);
      
      expect(mockNextResponseRedirect).toHaveBeenCalledWith(new URL('/', req.url));
    });
  });

  describe('Usuários Autenticados como Professor', () => {
    beforeEach(() => {
      mockGetToken.mockResolvedValue({ email: 'teacher1@ulbra.br' } as any);
    });

    it('deve permitir acesso ao /editor', async () => {
      const req = createMockRequest('/editor');
      await middleware(req);
      
      expect(mockNextResponseNext).toHaveBeenCalled();
    });

    it('deve permitir acesso ao /editor/analytics', async () => {
      const req = createMockRequest('/editor/analytics');
      await middleware(req);
      
      expect(mockNextResponseNext).toHaveBeenCalled();
    });

    it('deve permitir acesso à raiz (/)', async () => {
      const req = createMockRequest('/');
      await middleware(req);
      
      expect(mockNextResponseNext).toHaveBeenCalled();
    });
  });
});
