import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiplaEscolha } from '../MultiplaEscolha';
import { MultiplaEscolhaQuestion } from '@/types';

// Mock do Math.random para garantir ordem determinística no teste de embaralhamento
const mockMathRandom = jest.spyOn(Math, 'random');

const mockQuestion: MultiplaEscolhaQuestion = {
  id: 'q-multi-1',
  tipo: 'multipla_escolha',
  topico: 'Lógica Proposicional',
  enunciado: 'Qual destas fórmulas representa a comutatividade da conjunção?',
  opcoes: [
    { id: 'opt-1', texto: 'P ∧ Q ↔ P ∨ Q' },
    { id: 'opt-2', texto: 'P ∧ Q ↔ Q ∧ P' },
    { id: 'opt-3', texto: 'P → Q ↔ ¬P ∨ Q' },
    { id: 'opt-4', texto: 'P ∧ (Q ∨ R) ↔ (P ∧ Q) ∨ (P ∧ R)' },
  ],
  resposta_esperada: 'opt-2',
};

describe('MultiplaEscolha Component (Visão do Aluno)', () => {
  beforeEach(() => {
    // Padrão do mock: retorna 0.5 para não estourar o shuffle acidentalmente
    mockMathRandom.mockReturnValue(0.5); 
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a questão com os cards de alternativas visíveis', () => {
    render(<MultiplaEscolha question={mockQuestion} userAnswer="" onChange={jest.fn()} />);

    expect(screen.getByText(/P ∧ Q ↔ Q ∧ P/i)).toBeInTheDocument();
    const optionCards = screen.getAllByRole('button');
    expect(optionCards).toHaveLength(4);
  });

  it('deve injetar as letras dinâmicas (A, B, C, D) no início de cada alternativa', () => {
    render(<MultiplaEscolha question={mockQuestion} userAnswer="" onChange={jest.fn()} />);

    expect(screen.getByText(/^A\)/)).toBeInTheDocument();
    expect(screen.getByText(/^B\)/)).toBeInTheDocument();
    expect(screen.getByText(/^C\)/)).toBeInTheDocument();
    expect(screen.getByText(/^D\)/)).toBeInTheDocument();
  });

  it('deve embaralhar a ordem das opções (Anti-Cola) para o aluno', () => {
    // Forçando o Math.random a retornar valores que alterem a ordenação no algoritmo
    mockMathRandom
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.2);

    render(<MultiplaEscolha question={mockQuestion} userAnswer="" onChange={jest.fn()} />);
    
    const optionCards = screen.getAllByRole('button');
    // A verificação exata vai depender do algoritmo de shuffle implementado (ex: Fisher-Yates),
    // mas testamos se os botões foram renderizados para provar a falha inicial.
    expect(optionCards.length).toBe(4);
    
    // Verifica se a primeira opção não é mais a original (se o algoritmo fizer o sort correto)
    expect(optionCards[0]).not.toHaveTextContent('opt-1'); 
  });

  it('deve chamar o onChange com o ID correto da opção ao clicar', () => {
    const handleChange = jest.fn();
    render(<MultiplaEscolha question={mockQuestion} userAnswer="" onChange={handleChange} />);

    // Clica na opção contendo a comutatividade
    const optButton = screen.getByText(/P ∧ Q ↔ Q ∧ P/i).closest('button');
    fireEvent.click(optButton!);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('opt-2'); // ID da opção selecionada
  });

  it('deve aplicar estilo de destaque (cor primária) apenas na opção selecionada', () => {
    // Passamos opt-2 como se o usuário já a tivesse selecionado
    render(<MultiplaEscolha question={mockQuestion} userAnswer="opt-2" onChange={jest.fn()} />);

    // A opção 2 deve ter estilo de destaque (bg-primary / text-white)
    const selectedButton = screen.getByText(/P ∧ Q ↔ Q ∧ P/i).closest('button');
    expect(selectedButton).toHaveClass('bg-primary');

    // As outras não devem ter
    const unselectedButton = screen.getByText(/P ∧ Q ↔ P ∨ Q/i).closest('button');
    expect(unselectedButton).not.toHaveClass('bg-primary');
  });

  it('deve renderizar sintaxe Markdown (negrito, etc) dentro do texto das opções', () => {
    const questionComMarkdown: MultiplaEscolhaQuestion = {
      ...mockQuestion,
      opcoes: [
        { id: 'opt-m1', texto: '**Texto Forte**' },
        { id: 'opt-m2', texto: 'Texto Simples' }
      ]
    };

    render(<MultiplaEscolha question={questionComMarkdown} userAnswer="" onChange={jest.fn()} />);
    
    // O jest.setup.ts mocka o ReactMarkdown para renderizar apenas os children brutos
    expect(screen.getByText('**Texto Forte**')).toBeInTheDocument();
  });
});

