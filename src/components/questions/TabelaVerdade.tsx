import React from 'react';
import { HelpCircle } from 'lucide-react';
import { TabelaVerdadeQuestion } from '@/types';

interface TabelaVerdadeProps {
  question: TabelaVerdadeQuestion;
  userAnswer: string[] | Record<string, string>;
  onChange: (rowIndex: number, value: string, colKey?: string) => void;
}

// Identifica se a coluna é um conectivo (ex: P ∨ Q, ~R) ou variável atômica (ex: P, Q, R)
export const isConnectiveColumn = (colHeader: string): boolean => {
  const trimmed = colHeader.trim();
  return /[∧∨~¬→↔&|^()]/.test(trimmed) || trimmed.length > 2;
};

export const TabelaVerdade: React.FC<TabelaVerdadeProps> = ({ question, userAnswer, onChange }) => {
  const getCellValue = (rowIndex: number, colKey: string): string => {
    if (Array.isArray(userAnswer)) {
      return colKey === 'final' ? (userAnswer[rowIndex] || '') : '';
    }
    return userAnswer[`${rowIndex}_${colKey}`] || '';
  };

  const handleToggle = (rowIndex: number, colKey: string) => {
    const currentVal = getCellValue(rowIndex, colKey);
    let newVal = '';
    if (currentVal === '') newVal = 'V';
    else if (currentVal === 'V') newVal = 'F';
    else newVal = '';

    onChange(rowIndex, newVal, colKey);
  };

  const renderButton = (val: string, onClick: () => void) => {
    let btnClasses =
      'w-full h-full min-h-[40px] bg-base rounded-md font-bold cursor-pointer transition-all duration-150 active:scale-95';
    if (val === '') {
      btnClasses +=
        ' text-text-muted border border-dashed border-border-subtle hover:border-primary hover:bg-primary/5';
    } else if (val === 'V') {
      btnClasses += ' text-success border border-success bg-success/10 hover:bg-success/20';
    } else if (val === 'F') {
      btnClasses += ' text-error border border-error bg-error/10 hover:bg-error/20';
    }

    const titleText =
      val === ''
        ? '1 toque para V, 2 toques para F'
        : val === 'V'
          ? 'Valor: V. Clique para mudar para F'
          : 'Valor: F. Clique para limpar (-)';

    const ariaLabel =
      val === ''
        ? 'Célula vazia. 1 toque para V, 2 toques para F.'
        : `Célula preenchida com ${val}. Clique para alternar.`;

    return (
      <button
        type="button"
        onClick={onClick}
        className={btnClasses}
        title={titleText}
        aria-label={ariaLabel}
      >
        {val === '' ? '-' : val}
      </button>
    );
  };

  return (
    <div className="space-y-3 w-full">
      {/* Guia de Preenchimento das Células */}
      <div className="p-2.5 sm:p-3 bg-surface/80 border border-border-subtle rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans">
        <div className="flex items-center gap-2 text-text-muted">
          <HelpCircle size={15} className="text-primary shrink-0" />
          <span>
            Clique nas células vazias (<span className="font-mono font-bold text-text-main">-</span>) para preencher:
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] self-start sm:self-auto flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success/15 border border-success/40 text-success font-semibold">
            <span className="text-[10px] font-sans opacity-75">1 toque</span> V
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error/15 border border-error/40 text-error font-semibold">
            <span className="text-[10px] font-sans opacity-75">2 toques</span> F
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-base border border-border-subtle text-text-muted font-medium">
            <span className="text-[10px] font-sans opacity-75">3 toques</span> Limpar
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle font-mono shadow-inner w-full overflow-x-auto">
      <table className="w-full border-collapse bg-base text-[10px] sm:text-[11px] md:text-sm">
        <thead>
          <tr>
            {question.variaveis.map((v, i) => {
              const connective = isConnectiveColumn(v);
              return (
                <th
                  key={i}
                  className={`border border-border-subtle text-center px-1 py-1.5 md:p-3 whitespace-nowrap ${
                    connective
                      ? 'bg-primary/5 text-primary border-t-2 border-t-primary/50'
                      : 'bg-surface text-primary'
                  }`}
                  title={connective ? 'Coluna de Conectivo' : 'Variável Proposicional'}
                >
                  {v}
                </th>
              );
            })}
            <th className="border border-border-subtle text-center px-1 py-1.5 md:p-3 bg-primary/10 border-l-2 border-l-primary text-primary whitespace-nowrap">
              {question.expressao}
            </th>
          </tr>
        </thead>
        <tbody>
          {question.linhas.map((linha, rowIndex) => {
            const finalVal = getCellValue(rowIndex, 'final');
            const isFinalRevealed = !!question.celulas_reveladas?.[`${rowIndex}_final`];

            return (
              <tr key={linha.id}>
                {linha.valores.map((v, cIdx) => {
                  const header = question.variaveis[cIdx] || '';
                  const connective = isConnectiveColumn(header);

                  if (connective) {
                    const isRevealed = !!question.celulas_reveladas?.[`${rowIndex}_${header}`];
                    
                    if (isRevealed) {
                      return (
                        <td
                          key={cIdx}
                          className="px-0.5 py-1 md:p-2 border border-border-subtle text-center"
                        >
                          <div
                            className="w-full py-1 md:py-1.5 bg-surface/80 border border-primary/30 rounded text-primary font-bold text-[10px] md:text-sm select-none"
                            title="Resposta pré-preenchida pelo professor"
                          >
                            {v}
                          </div>
                        </td>
                      );
                    }

                    const cellVal = getCellValue(rowIndex, header);
                    return (
                      <td
                        key={cIdx}
                        className="px-0.5 py-1 md:p-2 border border-border-subtle text-center"
                      >
                        {renderButton(cellVal, () => handleToggle(rowIndex, header))}
                      </td>
                    );
                  }

                  // Variável atômica (P, Q, R)
                  return (
                    <td key={cIdx} className="border border-border-subtle text-center px-1 py-1.5 md:p-3 text-text-muted whitespace-nowrap">
                      {v}
                    </td>
                  );
                })}

                {/* Coluna final */}
                <td className="px-0.5 py-1 md:p-2 border border-border-subtle border-l-2 border-l-border-subtle text-center">
                  {isFinalRevealed ? (
                    <div
                      className="w-full py-1 md:py-1.5 bg-surface/80 border border-primary/30 rounded text-primary font-bold text-[10px] md:text-sm select-none"
                      title="Resposta pré-preenchida pelo professor"
                    >
                      {question.resposta_esperada[rowIndex] || 'V'}
                    </div>
                  ) : (
                    renderButton(finalVal, () => handleToggle(rowIndex, 'final'))
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
  );
};
