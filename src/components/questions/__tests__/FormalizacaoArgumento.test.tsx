import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormalizacaoArgumento } from '../FormalizacaoArgumento';
import { FormalizacaoArgumentoQuestion } from '@/types';

describe('FormalizacaoArgumento Component (Visão do Estudante)', () => {
  const mockQuestion: FormalizacaoArgumentoQuestion = {
    id: 'q-arg-1',
    tipo: 'formalizacao_argumento',
    topico: 'Cálculo de Predicados',
    enunciado: 'Formalize o seguinte argumento com quantificadores:\nTodo homem é mortal. Sócrates é homem. Logo, Sócrates é mortal.',
    dicas: ['H(x): x é homem', 'M(x): x é mortal', 's: Sócrates'],
    teclado_virtual: ['→', '∀', '∧', '(', ')'],
    resposta_esperada: {
      premissas: ['∀x (H(x) → M(x))', 'H(s)'],
      conclusao: 'M(s)',
    },
  };

  it('renderiza o painel fixo de contexto e ferramentas no topo com dicas e teclado virtual', () => {
    render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: [''], conclusao: '' }}
        onChange={jest.fn()}
      />
    );

    const fixedPanel = screen.getByTestId('fixed-context-tools-panel');
    expect(fixedPanel).toBeInTheDocument();
    expect(fixedPanel).toHaveClass('sticky');
    expect(fixedPanel).toHaveClass('top-0');
    expect(fixedPanel).toHaveClass('z-20');

    // Dicas dentro do painel fixo
    expect(screen.getByText('H(x): x é homem')).toBeInTheDocument();
    expect(screen.getByText('M(x): x é mortal')).toBeInTheDocument();
    expect(screen.getByText('s: Sócrates')).toBeInTheDocument();

    // Teclado virtual dentro do painel fixo
    expect(screen.getByText('Teclado Lógico Virtual')).toBeInTheDocument();
  });

  it('renderiza variáveis e predicados antes dos operadores lógicos no teclado virtual', () => {
    render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: [''], conclusao: '' }}
        onChange={jest.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    const labels = buttons.map((b) => b.textContent?.trim());

    // As variáveis maiúsculas H, M e depois minúsculas s, x devem vir primeiro
    const hIdx = labels.indexOf('H');
    const mIdx = labels.indexOf('M');
    const sIdx = labels.indexOf('s');
    const xIdx = labels.indexOf('x');
    const arrowIdx = labels.indexOf('→');

    expect(hIdx).toBeGreaterThanOrEqual(0);
    expect(mIdx).toBeGreaterThanOrEqual(0);
    expect(sIdx).toBeGreaterThanOrEqual(0);
    expect(xIdx).toBeGreaterThanOrEqual(0);
    expect(arrowIdx).toBeGreaterThanOrEqual(0);

    // Variáveis antes da seta/operador
    expect(hIdx).toBeLessThan(arrowIdx);
    expect(mIdx).toBeLessThan(arrowIdx);
    expect(sIdx).toBeLessThan(arrowIdx);
    expect(xIdx).toBeLessThan(arrowIdx);
  });

  it('atualiza o indicador de foco ativo ao focar premissa ou conclusão', () => {
    render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: ['', ''], conclusao: '' }}
        onChange={jest.fn()}
      />
    );

    // Estado inicial: foco na premissa 1
    expect(screen.getByText('Editando Premissa 1')).toBeInTheDocument();

    // Focar a segunda premissa
    const inputs = screen.getAllByRole('textbox');
    fireEvent.focus(inputs[1]);
    expect(screen.getByText('Editando Premissa 2')).toBeInTheDocument();

    // Focar a conclusão (último textbox)
    fireEvent.focus(inputs[2]);
    expect(screen.getByText('Editando Conclusão')).toBeInTheDocument();
  });

  it('insere caracteres no campo atualmente ativo ao clicar no teclado virtual', () => {
    const handleChange = jest.fn();
    render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: [''], conclusao: '' }}
        onChange={handleChange}
      />
    );

    // Clica no botão 'H' do teclado virtual
    const btnH = screen.getByRole('button', { name: 'H' });
    fireEvent.click(btnH);

    expect(handleChange).toHaveBeenCalledWith({
      premissas: ['H'],
      conclusao: '',
    });
  });

  it('insere caracteres na conclusão quando o foco está na conclusão', () => {
    const handleChange = jest.fn();
    render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: ['H(s)'], conclusao: '' }}
        onChange={handleChange}
      />
    );

    // Foca na conclusão
    const conclusionInput = screen.getByPlaceholderText('Ex: V');
    fireEvent.focus(conclusionInput);

    // Clica na tecla 'M'
    const btnM = screen.getByRole('button', { name: 'M' });
    fireEvent.click(btnM);

    expect(handleChange).toHaveBeenCalledWith({
      premissas: ['H(s)'],
      conclusao: 'M',
    });
  });

  it('permite adicionar e remover premissas dinamicamente', () => {
    const handleChange = jest.fn();
    const { rerender } = render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: ['P1'], conclusao: 'C' }}
        onChange={handleChange}
      />
    );

    // Botão de adicionar
    const addBtn = screen.getByText('Adicionar outra premissa');
    fireEvent.click(addBtn);

    expect(handleChange).toHaveBeenCalledWith({
      premissas: ['P1', ''],
      conclusao: 'C',
    });

    // Re-renderiza com 2 premissas
    rerender(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: ['P1', 'P2'], conclusao: 'C' }}
        onChange={handleChange}
      />
    );

    // Deve exibir botão de remover
    const removeBtn = screen.getByLabelText('Remover premissa 2');
    fireEvent.click(removeBtn);

    expect(handleChange).toHaveBeenCalledWith({
      premissas: ['P1'],
      conclusao: 'C',
    });
  });

  it('previne blur no mousedown das teclas para manter o foco do usuário', () => {
    render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: [''], conclusao: '' }}
        onChange={jest.fn()}
      />
    );

    const btnH = screen.getByRole('button', { name: 'H' });
    const mouseDownEvent = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
    const prevented = !btnH.dispatchEvent(mouseDownEvent);

    expect(prevented).toBe(true);
  });
});
