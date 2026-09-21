/**
 * @file submissionErrorTracking.test.tsx
 * @description Testes de persistência de tentativas com erro no Modo Estudo (TDD - Fase Vermelha)
 * SPEC: analytics-spec.md — Cenário 1 (Registro de erro e repetição no banco)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const MOCK_PHASES = [
  {
    id: 'fase-teste',
    titulo: 'Fase de Teste',
    icone: 'Network' as const,
    questoes: [
      {
        id: 'q-erro-1',
        tipo: 'diagramacao' as const,
        topico: 'Diagramação',
        enunciado: 'Classifique as frases',
        frases: [
          { id: 'f1', texto: 'Frase 1' },
          { id: 'f2', texto: 'Frase 2' },
        ],
        resposta_esperada: { f1: 'P', f2: 'C' },
      },
    ],
  },
];

// Mock da API para verificar se respostas com erro são persistidas
jest.mock('@/lib/api', () => ({
  fetchPhasesApi: jest.fn().mockImplementation(() => Promise.resolve(MOCK_PHASES)),
  fetchUserSubmissionsApi: jest.fn().mockResolvedValue([]),
  saveUserSubmissionApi: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock do storage
jest.mock('@/lib/storage', () => ({
  loadEditorState: jest.fn(() => ({
    version: 1,
    updatedAt: '2026-09-20T00:00:00.000Z',
    phases: MOCK_PHASES,
  })),
}));

// Mock do next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { email: 'aluno@faculdade.edu' } },
    status: 'authenticated',
  })),
  signOut: jest.fn(),
}));

import Home from '@/app/page';
import { saveUserSubmissionApi } from '@/lib/api';

describe('Rastreamento de Erros e Tentativas no Modo Estudo (SPEC-007 v2.8.0 - TDD Fase Vermelha)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar saveUserSubmissionApi com isCorrect: false ao submeter uma resposta incorreta', async () => {
    render(<Home />);

    // Iniciar a fase
    const startBtn = await screen.findByRole('button', { name: /^iniciar$/i });
    fireEvent.click(startBtn);

    // Responder errado: preenche ambas como 'Conclusão' (o gabarito é f1: P, f2: C)
    const conclusaoButtons = screen.getAllByRole('button', { name: /conclus[aã]o/i });
    fireEvent.click(conclusaoButtons[0]);
    fireEvent.click(conclusaoButtons[1]);

    // Clicar em Validar Resposta
    const validateBtn = screen.getByRole('button', { name: /validar resposta/i });
    fireEvent.click(validateBtn);

    // Deve exibir o feedback de erro
    expect(await screen.findByText(/resposta incorreta/i)).toBeInTheDocument();

    // CRUCIAL (SPEC-007 Cenário 1): A API deve ser chamada persistindo o erro do aluno
    await waitFor(() => {
      expect(saveUserSubmissionApi).toHaveBeenCalledWith(
        'q-erro-1',
        false,
        expect.objectContaining({ f1: 'C', f2: 'C' })
      );
    });
  });
});
