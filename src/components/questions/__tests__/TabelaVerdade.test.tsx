import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabelaVerdade } from '../TabelaVerdade';
import { TabelaVerdadeQuestion } from '@/types';

const mockQuestion: TabelaVerdadeQuestion = {
  id: 'q-tabela-1',
  tipo: 'tabela_verdade',
  topico: 'Cálculo Proposicional',
  enunciado: 'Preencha a tabela-verdade para (P ∨ Q).',
  expressao: 'P ∨ Q',
  variaveis: ['P', 'Q', 'P ∨ Q'],
  linhas: [
    { id: 'l1', valores: ['V', 'V', 'V'] },
    { id: 'l2', valores: ['V', 'F', 'V'] },
    { id: 'l3', valores: ['F', 'V', 'V'] },
    { id: 'l4', valores: ['F', 'F', 'F'] },
  ],
  resposta_esperada: ['V', 'V', 'V', 'F'],
};

describe('TabelaVerdade Component', () => {
  it('renderiza o banner de instruções de preenchimento com 1 toque V, 2 toques F e 3 toques Limpar', () => {
    render(
      <TabelaVerdade
        question={mockQuestion}
        userAnswer={{}}
        onChange={jest.fn()}
      />
    );

    expect(
      screen.getByText(/Clique nas células vazias/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/1 toque/i)).toBeInTheDocument();
    expect(screen.getByText(/2 toques/i)).toBeInTheDocument();
    expect(screen.getByText(/3 toques/i)).toBeInTheDocument();
  });

  it('exibe células vazias com hífen e acessibilidade adequada', () => {
    render(
      <TabelaVerdade
        question={mockQuestion}
        userAnswer={{}}
        onChange={jest.fn()}
      />
    );

    const buttons = screen.getAllByRole('button', { name: /Célula vazia/i });
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]).toHaveTextContent('-');
    expect(buttons[0]).toHaveAttribute('title', '1 toque para V, 2 toques para F');
  });

  it('chama onChange com "V" ao clicar em uma célula vazia (1 toque)', () => {
    const handleChange = jest.fn();
    render(
      <TabelaVerdade
        question={mockQuestion}
        userAnswer={{}}
        onChange={handleChange}
      />
    );

    const firstButton = screen.getAllByRole('button', { name: /Célula vazia/i })[0];
    fireEvent.click(firstButton);

    expect(handleChange).toHaveBeenCalledWith(0, 'V', 'P ∨ Q');
  });

  it('chama onChange com "F" ao clicar em uma célula que já contém "V" (2 toques)', () => {
    const handleChange = jest.fn();
    render(
      <TabelaVerdade
        question={mockQuestion}
        userAnswer={{ '0_P ∨ Q': 'V' }}
        onChange={handleChange}
      />
    );

    const vButton = screen.getByRole('button', { name: /Célula preenchida com V/i });
    expect(vButton).toHaveTextContent('V');
    expect(vButton).toHaveAttribute('title', 'Valor: V. Clique para mudar para F');

    fireEvent.click(vButton);
    expect(handleChange).toHaveBeenCalledWith(0, 'F', 'P ∨ Q');
  });

  it('chama onChange com "" para limpar ao clicar em uma célula que contém "F" (3 toques)', () => {
    const handleChange = jest.fn();
    render(
      <TabelaVerdade
        question={mockQuestion}
        userAnswer={{ '0_P ∨ Q': 'F' }}
        onChange={handleChange}
      />
    );

    const fButton = screen.getByRole('button', { name: /Célula preenchida com F/i });
    expect(fButton).toHaveTextContent('F');
    expect(fButton).toHaveAttribute('title', 'Valor: F. Clique para limpar (-)');

    fireEvent.click(fButton);
    expect(handleChange).toHaveBeenCalledWith(0, '', 'P ∨ Q');
  });
});

