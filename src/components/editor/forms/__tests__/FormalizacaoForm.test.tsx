import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormalizacaoForm } from '../FormalizacaoForm';
import { FormalizacaoArgumentoForm } from '../FormalizacaoArgumentoForm';
import { FormalizacaoQuestion, FormalizacaoArgumentoQuestion } from '@/types';

describe('FormalizacaoForm - Gestão automática de variáveis no teclado virtual', () => {
  const baseQuestion: FormalizacaoQuestion = {
    id: 'test-q1',
    tipo: 'formalizacao',
    topico: 'Lógica Proposicional',
    enunciado: 'Formalize a proposição',
    dicas: [],
    teclado_virtual: ['~', '∧', '∨', '→'],
    resposta_esperada: '',
  };

  it('adiciona variáveis automaticamente ao teclado ao digitar na resposta esperada', () => {
    let currentQuestion = { ...baseQuestion };
    const handleChange = jest.fn((updated) => {
      currentQuestion = updated;
    });

    const { rerender } = render(
      <FormalizacaoForm question={currentQuestion} onChange={handleChange} />
    );

    const input = screen.getByPlaceholderText(/Ex: P → Q/i);
    fireEvent.change(input, { target: { value: 'R ∧ T' } });

    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall.teclado_virtual).toContain('R');
    expect(lastCall.teclado_virtual).toContain('T');
    expect(lastCall.teclado_virtual).toContain('∧');
  });

  it('remove automaticamente do teclado variáveis que deixaram de existir na fórmula', () => {
    // Começa com R e T no teclado e na resposta esperada
    let currentQuestion: FormalizacaoQuestion = {
      ...baseQuestion,
      resposta_esperada: 'R ∧ T',
      teclado_virtual: ['∧', 'R', 'T'],
    };

    const handleChange = jest.fn((updated) => {
      currentQuestion = updated;
    });

    const { rerender } = render(
      <FormalizacaoForm question={currentQuestion} onChange={handleChange} />
    );

    const input = screen.getByPlaceholderText(/Ex: P → Q/i);
    // Professor corrige R para F (agora F ∧ T)
    fireEvent.change(input, { target: { value: 'F ∧ T' } });

    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    // R deve ser removido automaticamente
    expect(lastCall.teclado_virtual).not.toContain('R');
    // F e T devem estar presentes
    expect(lastCall.teclado_virtual).toContain('F');
    expect(lastCall.teclado_virtual).toContain('T');
    // Operador mantido
    expect(lastCall.teclado_virtual).toContain('∧');
  });

  it('posiciona as variáveis sempre no início do teclado virtual', () => {
    let currentQuestion: FormalizacaoQuestion = {
      ...baseQuestion,
      teclado_virtual: ['~', '∧', '∨', '→'],
      resposta_esperada: '',
    };

    const handleChange = jest.fn((updated) => {
      currentQuestion = updated;
    });

    render(
      <FormalizacaoForm question={currentQuestion} onChange={handleChange} />
    );

    const input = screen.getByPlaceholderText(/Ex: P → Q/i);
    fireEvent.change(input, { target: { value: 'G ∧ L' } });

    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    const keys: string[] = lastCall.teclado_virtual;

    const gIdx = keys.indexOf('G');
    const lIdx = keys.indexOf('L');
    const andIdx = keys.indexOf('∧');

    expect(gIdx).toBe(0);
    expect(lIdx).toBe(1);
    expect(andIdx).toBeGreaterThan(lIdx);
  });

  it('não exibe botões de variáveis na área de edição do teclado virtual (apenas operadores)', () => {
    const currentQuestion: FormalizacaoQuestion = {
      ...baseQuestion,
      resposta_esperada: 'G ∧ L',
      teclado_virtual: ['G', 'L', '∧'],
    };

    render(
      <FormalizacaoForm question={currentQuestion} onChange={jest.fn()} />
    );

    const buttons = screen.getAllByRole('button');
    const singleCharButtons = buttons
      .map((b) => b.textContent?.trim())
      .filter((text) => text && text.length === 1);

    expect(singleCharButtons).not.toContain('G');
    expect(singleCharButtons).not.toContain('L');
    expect(singleCharButtons).toContain('∧');
    expect(singleCharButtons).toContain('∨');
  });
});

describe('FormalizacaoArgumentoForm - Gestão automática de variáveis no argumento', () => {
  const baseArgQuestion: FormalizacaoArgumentoQuestion = {
    id: 'test-arg1',
    tipo: 'formalizacao_argumento',
    topico: 'Argumentos',
    enunciado: 'Formalize o argumento',
    dicas: [],
    teclado_virtual: ['→', 'P', 'Q'],
    resposta_esperada: {
      premissas: ['P → Q', 'P'],
      conclusao: 'Q',
    },
  };

  it('remove variável automaticamente do teclado quando a premissa que a continha é apagada ou alterada', () => {
    let currentQuestion: FormalizacaoArgumentoQuestion = {
      ...baseArgQuestion,
      resposta_esperada: {
        premissas: ['R → T', 'R'],
        conclusao: 'T',
      },
      teclado_virtual: ['→', 'R', 'T'],
    };

    const handleChange = jest.fn((updated) => {
      currentQuestion = updated;
    });

    const { rerender } = render(
      <FormalizacaoArgumentoForm question={currentQuestion} onChange={handleChange} />
    );

    // Altera a primeira premissa para F → T
    const inputs = screen.getAllByPlaceholderText(/Ex: P → Q/i);
    fireEvent.change(inputs[0], { target: { value: 'F → T' } });

    expect(handleChange).toHaveBeenCalled();
    let lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    // R ainda existe na premissa 2 ('R')
    expect(lastCall.teclado_virtual).toContain('R');
    expect(lastCall.teclado_virtual).toContain('F');

    // Rerender com a questão atualizada
    rerender(<FormalizacaoArgumentoForm question={lastCall} onChange={handleChange} />);

    // Agora altera a premissa 2 para F
    const updatedInputs = screen.getAllByPlaceholderText(/Ex: P → Q/i);
    fireEvent.change(updatedInputs[1], { target: { value: 'F' } });
    const callAfterSecondChange = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    // R não existe mais em nenhuma parte do argumento e deve sumir
    expect(callAfterSecondChange.teclado_virtual).not.toContain('R');
    expect(callAfterSecondChange.teclado_virtual).toContain('F');
    expect(callAfterSecondChange.teclado_virtual).toContain('T');
  });
});
