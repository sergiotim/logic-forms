import React from 'react';
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
      'w-full h-full min-h-[40px] bg-base border border-border-subtle rounded-md text-text-muted font-bold cursor-pointer transition-colors hover:border-primary';
    if (val === 'V') btnClasses += ' text-success border-success bg-success/10';
    if (val === 'F') btnClasses += ' text-error border-error bg-error/10';

    return (
      <button type="button" onClick={onClick} className={btnClasses}>
        {val === '' ? '-' : val}
      </button>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle font-mono">
      <table className="w-full border-collapse bg-base">
        <thead>
          <tr>
            {question.variaveis.map((v, i) => {
              const connective = isConnectiveColumn(v);
              return (
                <th
                  key={i}
                  className={`border border-border-subtle text-center p-3 whitespace-nowrap ${
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
            <th className="border border-border-subtle text-center p-3 bg-primary/10 border-l-2 border-l-primary text-primary whitespace-nowrap">
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
                          className="p-2 min-w-[80px] border border-border-subtle text-center"
                        >
                          <div
                            className="w-full py-1.5 bg-surface/80 border border-primary/30 rounded text-primary font-bold text-sm select-none"
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
                        className="p-2 min-w-[80px] border border-border-subtle text-center"
                      >
                        {renderButton(cellVal, () => handleToggle(rowIndex, header))}
                      </td>
                    );
                  }

                  // Variável atômica (P, Q, R) -> célula estática pré-preenchida
                  return (
                    <td key={cIdx} className="border border-border-subtle text-center p-3 text-text-muted whitespace-nowrap">
                      {v}
                    </td>
                  );
                })}

                {/* Coluna final */}
                <td className="p-2 min-w-[100px] border border-border-subtle border-l-2 border-l-border-subtle text-center">
                  {isFinalRevealed ? (
                    <div
                      className="w-full py-1.5 bg-surface/80 border border-primary/30 rounded text-primary font-bold text-sm select-none"
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
  );
};
