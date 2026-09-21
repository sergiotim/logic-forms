import React from 'react';
import { render, screen } from '@testing-library/react';
import { Formalizacao } from '../Formalizacao';
import { FormalizacaoQuestion } from '@/types';

describe('Formalizacao Component (Visão do Aluno)', () => {
  const mockQuestion: FormalizacaoQuestion = {
    id: 'q-form-1',
    tipo: 'formalizacao',
    topico: 'Lógica Proposicional',
    enunciado: 'Formalize a proposição',
    dicas: ['G: Ganha o jogo', 'L: Leva o troféu'],
    // Mesmo se o array configurado tiver operadores antes de variáveis
    teclado_virtual: ['~', '∧', '∨', '→', 'G', 'L'],
    resposta_esperada: 'G ∧ L',
  };

  it('renderiza as variáveis sempre no início do teclado virtual, antes dos operadores e parênteses', () => {
    render(<Formalizacao question={mockQuestion} userAnswer="" onChange={jest.fn()} />);

    // Pega todos os botões do teclado virtual
    const buttons = screen.getAllByRole('button');
    const buttonLabels = buttons.map((b) => b.textContent?.trim());

    // Deve começar com as variáveis 'G' e 'L'
    expect(buttonLabels[0]).toBe('G');
    expect(buttonLabels[1]).toBe('L');

    // Em seguida os conectivos e por último parênteses
    const gIdx = buttonLabels.indexOf('G');
    const lIdx = buttonLabels.indexOf('L');
    const andIdx = buttonLabels.indexOf('∧');
    const openParenIdx = buttonLabels.indexOf('(');

    expect(gIdx).toBeLessThan(andIdx);
    expect(lIdx).toBeLessThan(andIdx);
    expect(andIdx).toBeLessThan(openParenIdx);
  });

  it('NÃO inclui variáveis presentes apenas nas dicas se elas não existirem na fórmula esperada', () => {
    const questionComDicaExtra: FormalizacaoQuestion = {
      ...mockQuestion,
      dicas: ['G: Ganha o jogo', 'L: Leva o troféu', 'Z: Distrator apenas na dica'],
      resposta_esperada: 'G ∧ L',
    };

    render(<Formalizacao question={questionComDicaExtra} userAnswer="" onChange={jest.fn()} />);

    const buttons = screen.getAllByRole('button');
    const buttonLabels = buttons.map((b) => b.textContent?.trim());

    expect(buttonLabels).toContain('G');
    expect(buttonLabels).toContain('L');
    expect(buttonLabels).not.toContain('Z');
  });

  it('configura inputMode="none" e permite apagar com o botão de Backspace', () => {
    const handleChange = jest.fn();
    render(<Formalizacao question={mockQuestion} userAnswer="G ∧ L" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('inputMode', 'none');

    const backspaceBtn = screen.getByTestId('backspace-button');
    expect(backspaceBtn).toBeInTheDocument();

    const { fireEvent } = require('@testing-library/react');
    fireEvent.click(backspaceBtn);

    expect(handleChange).toHaveBeenCalledWith('G ∧ ');
  });
});

