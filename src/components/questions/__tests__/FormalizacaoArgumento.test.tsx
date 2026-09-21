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

  it('renderiza dicas compactas no topo e teclado virtual acoplado na base', () => {
    render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: [''], conclusao: '' }}
        onChange={jest.fn()}
      />
    );

    // Dicas compactas no topo
    const dicasContainer = screen.getByTestId('dicas-container');
    expect(dicasContainer).toBeInTheDocument();
    expect(dicasContainer).toHaveClass('sticky');
    expect(dicasContainer).toHaveClass('top-0');
    expect(screen.getByText('H(x): x é homem')).toBeInTheDocument();
    expect(screen.getByText('M(x): x é mortal')).toBeInTheDocument();
    expect(screen.getByText('s: Sócrates')).toBeInTheDocument();

    // Teclado virtual ancorado na base
    const keyboardPanel = screen.getByTestId('virtual-keyboard-panel');
    expect(keyboardPanel).toBeInTheDocument();
    expect(keyboardPanel).toHaveClass('sticky');
    expect(keyboardPanel).toHaveClass('bottom-0');
    expect(screen.getByText('Teclado Virtual')).toBeInTheDocument();
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

  it('configura inputMode="none" em todos os inputs para suprimir o teclado nativo do celular', () => {
    render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: ['P1', 'P2'], conclusao: 'C' }}
        onChange={jest.fn()}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(3);
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('inputMode', 'none');
    });
  });

  it('apaga o caractere anterior ao clicar no botão de apagar (Backspace)', () => {
    const handleChange = jest.fn();
    render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: ['H(s)'], conclusao: '' }}
        onChange={handleChange}
      />
    );

    // Botão de backspace
    const backspaceBtn = screen.getByTestId('backspace-button');
    expect(backspaceBtn).toBeInTheDocument();

    fireEvent.click(backspaceBtn);

    expect(handleChange).toHaveBeenCalledWith({
      premissas: ['H(s'],
      conclusao: '',
    });
  });

  it('apaga o caractere da conclusão quando a conclusão está em foco', () => {
    const handleChange = jest.fn();
    render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: ['H(s)'], conclusao: 'M(s)' }}
        onChange={handleChange}
      />
    );

    const conclusionInput = screen.getByPlaceholderText('Ex: V');
    fireEvent.focus(conclusionInput);

    const backspaceBtn = screen.getByTestId('backspace-button');
    fireEvent.click(backspaceBtn);

    expect(handleChange).toHaveBeenCalledWith({
      premissas: ['H(s)'],
      conclusao: 'M(s',
    });
  });

  it('renderiza dicas e teclado virtual com flex-wrap sem barras de rolagem lateral', () => {
    render(
      <FormalizacaoArgumento
        question={mockQuestion}
        userAnswer={{ premissas: [''], conclusao: '' }}
        onChange={jest.fn()}
      />
    );

    const dicasContainer = screen.getByTestId('dicas-container');
    expect(dicasContainer).toHaveClass('flex-wrap');
    expect(dicasContainer).not.toHaveClass('overflow-x-auto');

    const keyboardPanel = screen.getByTestId('virtual-keyboard-panel');
    const keysContainer = keyboardPanel.querySelector('.flex-wrap');
    expect(keysContainer).toBeInTheDocument();
    expect(keysContainer).not.toHaveClass('overflow-x-auto');
  });
});

