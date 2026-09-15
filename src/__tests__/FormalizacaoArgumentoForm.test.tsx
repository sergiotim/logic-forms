import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormalizacaoArgumentoForm } from '@/components/editor/forms/FormalizacaoArgumentoForm';
import { FormalizacaoArgumentoQuestion } from '@/types';

describe('FormalizacaoArgumentoForm (UI/UX Alinhada)', () => {
  const mockQuestion: FormalizacaoArgumentoQuestion = {
    id: 'q-arg-test',
    tipo: 'formalizacao_argumento',
    topico: 'Modus Ponens',
    enunciado: 'Se chove, molha a rua. Chove. Logo molha a rua.',
    dicas: ['C: chove', 'M: molha a rua'],
    teclado_virtual: ['→', '(', ')'],
    resposta_esperada: {
      premissas: ['C → M', 'C'],
      conclusao: 'M',
    },
    modo_validacao: 'semantico',
  };

  it('renderiza os campos com as mesmas nomenclaturas da Formalização', () => {
    const onChange = jest.fn();
    render(<FormalizacaoArgumentoForm question={mockQuestion} onChange={onChange} />);

    expect(screen.getByLabelText(/Enunciado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tópico/i)).toBeInTheDocument();
    expect(screen.getByText(/Resposta Esperada \(Premissas e Conclusão\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Modo de validação:/i)).toBeInTheDocument();
    expect(screen.getByText(/Dicionário de Variáveis \(Dicas\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Teclado Virtual do Aluno/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Auto-sugerir/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sincronizar Dicas/i })).toBeInTheDocument();
  });

  it('permite alternar o modo de validação entre Semântico e Estrito', () => {
    const onChange = jest.fn();
    render(<FormalizacaoArgumentoForm question={mockQuestion} onChange={onChange} />);

    const select = screen.getByTitle(/aceita equivalências lógicas/i);
    fireEvent.change(select, { target: { value: 'estrito' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        modo_validacao: 'estrito',
      })
    );
  });

  it('permite adicionar e remover premissas', () => {
    const onChange = jest.fn();
    render(<FormalizacaoArgumentoForm question={mockQuestion} onChange={onChange} />);

    // Adicionar premissa
    const btnAddPremissa = screen.getByRole('button', { name: /Adicionar Premissa/i });
    fireEvent.click(btnAddPremissa);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        resposta_esperada: {
          premissas: ['C → M', 'C', ''],
          conclusao: 'M',
        },
      })
    );

    // Remover premissa
    const removeButtons = screen.getAllByRole('button', { name: /Remover premissa/i });
    expect(removeButtons.length).toBe(2);
    fireEvent.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        resposta_esperada: {
          premissas: ['C'],
          conclusao: 'M',
        },
      })
    );
  });

  it('insere símbolos através da barra de atalhos acoplada', () => {
    const onChange = jest.fn();
    render(<FormalizacaoArgumentoForm question={mockQuestion} onChange={onChange} />);

    // Barra de símbolos acoplada tem botões para cada símbolo: ∀, ∃, ~, ∧, ∨, →, ↔, (, )
    const forallButtons = screen.getAllByRole('button', { name: '∀' });
    expect(forallButtons.length).toBeGreaterThan(0);

    // Clica no botão ∀ da primeira premissa
    fireEvent.click(forallButtons[0]);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        resposta_esperada: expect.objectContaining({
          premissas: ['C → M∀', 'C'],
        }),
      })
    );
  });

  it('sincroniza o dicionário de dicas automaticamente a partir das fórmulas do argumento', () => {
    const onChange = jest.fn();
    const questionQuantificada: FormalizacaoArgumentoQuestion = {
      ...mockQuestion,
      dicas: [],
      resposta_esperada: {
        premissas: ['∀x(Hx → Mx)', 'Hs'],
        conclusao: 'Ms',
      },
    };

    render(<FormalizacaoArgumentoForm question={questionQuantificada} onChange={onChange} />);

    const btnSync = screen.getByRole('button', { name: /Sincronizar Dicas/i });
    fireEvent.click(btnSync);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dicas: expect.arrayContaining([
          'H: ',
          'M: ',
          'x: variável individual',
        ]),
      })
    );
  });

  it('auto-sugere teclas para o teclado virtual do aluno', () => {
    const onChange = jest.fn();
    render(<FormalizacaoArgumentoForm question={mockQuestion} onChange={onChange} />);

    const btnAutoSugerir = screen.getByRole('button', { name: /Auto-sugerir/i });
    fireEvent.click(btnAutoSugerir);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        teclado_virtual: expect.arrayContaining(['→']),
      })
    );
  });

  it('exibe alerta sintático inline caso uma premissa tenha parênteses desbalanceados', () => {
    const onChange = jest.fn();
    const questionWithSyntaxError: FormalizacaoArgumentoQuestion = {
      ...mockQuestion,
      resposta_esperada: {
        premissas: ['(P → Q', 'P'],
        conclusao: 'Q',
      },
    };

    render(<FormalizacaoArgumentoForm question={questionWithSyntaxError} onChange={onChange} />);

    expect(screen.getByText(/Parênteses não balanceados/i)).toBeInTheDocument();
  });
});

