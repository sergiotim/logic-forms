import React, { useState, useEffect } from 'react';
import { TabelaVerdadeQuestion } from '@/types';
import { generateTruthTable, TruthTableData } from '@/lib/parser';
import { Eye, EyeOff } from 'lucide-react';

interface TabelaVerdadeFormProps {
  question: TabelaVerdadeQuestion;
  onChange: (updated: TabelaVerdadeQuestion) => void;
}

export const TabelaVerdadeForm: React.FC<TabelaVerdadeFormProps> = ({ question, onChange }) => {
  const [parseError, setParseError] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TruthTableData | null>(null);

  // Filtra apenas variáveis atômicas reais (ex: P, Q, R), ignorando colunas de conectivos (ex: P ∨ Q, ~R)
  const getBaseVariables = (variables: string[]) => {
    return variables.filter(
      (v) => /^[A-Z][a-z0-9_]*$/i.test(v.trim()) && !/[∧∨~¬→↔&|^()]/.test(v)
    );
  };

  // Sincroniza a tabela ao abrir uma questão existente com fórmula
  useEffect(() => {
    if (question.expressao && question.expressao.trim()) {
      try {
        const data = generateTruthTable(question.expressao);
        setTableData(data);
        if (question.linhas.length !== data.rows.length || question.variaveis.length !== data.allHeaders.length) {
          onChange({
            ...question,
            variaveis: data.allHeaders,
            linhas: data.rows,
            resposta_esperada: data.expected,
          });
        }
      } catch {
        // expressão ainda não válida ou em edição
      }
    }
  }, []);

  const handleExpressionChange = (newExpression: string) => {
    try {
      if (!newExpression.trim()) {
        onChange({
          ...question,
          expressao: newExpression,
          variaveis: [],
          linhas: [],
          resposta_esperada: [],
          celulas_reveladas: {},
        });
        setTableData(null);
        setParseError(null);
        return;
      }

      // Parser completo: extrai variáveis base + conectivos intermediários + valoração de cada linha
      const data = generateTruthTable(newExpression);
      setTableData(data);

      onChange({
        ...question,
        expressao: newExpression,
        variaveis: data.allHeaders,
        linhas: data.rows,
        resposta_esperada: data.expected,
      });
      setParseError(null);
    } catch (error: any) {
      onChange({
        ...question,
        expressao: newExpression,
      });
      setParseError(error.message);
    }
  };

  const handleInsertSymbol = (symbol: string) => {
    handleExpressionChange(question.expressao + symbol);
  };

  // Alterna visibilidade de uma célula individual para o aluno
  const handleToggleCell = (rowIndex: number, colKey: string) => {
    const current = !!question.celulas_reveladas?.[`${rowIndex}_${colKey}`];
    const updated = {
      ...(question.celulas_reveladas || {}),
      [`${rowIndex}_${colKey}`]: !current,
    };
    onChange({
      ...question,
      celulas_reveladas: updated,
    });
  };

  // Alterna visibilidade de toda uma coluna de conectivo para o aluno
  const handleToggleColumn = (colKey: string) => {
    const allRevealed = question.linhas.every((_, r) => !!question.celulas_reveladas?.[`${r}_${colKey}`]);
    const updated = { ...(question.celulas_reveladas || {}) };

    question.linhas.forEach((_, r) => {
      updated[`${r}_${colKey}`] = !allRevealed;
    });

    onChange({
      ...question,
      celulas_reveladas: updated,
    });
  };

  // Separação das variáveis base e conectivos
  const baseVars = tableData?.baseVariables ?? getBaseVariables(question.variaveis);
  const intermediateConnectives = tableData?.intermediateHeaders ?? question.variaveis.filter(v => !baseVars.includes(v));

  return (
    <div className="space-y-4 font-sans text-sm">
      {/* Enunciado */}
      <div>
        <label htmlFor="enunciado" className="block text-text-main font-semibold mb-1">
          Enunciado
        </label>
        <textarea
          id="enunciado"
          value={question.enunciado}
          onChange={(e) => onChange({ ...question, enunciado: e.target.value })}
          rows={3}
          placeholder="Instrução do exercício de tabela-verdade..."
          className="w-full bg-base border border-border-subtle rounded-lg p-3 text-text-main focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Tópico */}
      <div>
        <label htmlFor="topico" className="block text-text-main font-semibold mb-1">
          Tópico
        </label>
        <input
          id="topico"
          type="text"
          value={question.topico}
          onChange={(e) => onChange({ ...question, topico: e.target.value })}
          placeholder="Ex: Cálculo Proposicional"
          className="w-full bg-base border border-border-subtle rounded-lg p-3 text-text-main focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Expressão Lógica com Teclado Virtual Integrado */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="expressao" className="block text-text-main font-semibold">
            Expressão Lógica (Fórmula a avaliar)
          </label>
          <span className="text-xs text-text-muted">
            Digite ou use a barra de atalhos
          </span>
        </div>

        <div className={`rounded-lg border bg-base overflow-hidden transition-colors ${
          parseError 
            ? 'border-error focus-within:border-error' 
            : 'border-border-subtle focus-within:border-primary'
        }`}>
          {/* Barra de atalhos acoplada */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/70 border-b border-border-subtle font-mono text-xs">
            <span className="text-text-muted font-sans text-[11px] mr-1 select-none">Conectivos:</span>
            {['~', '∧', '∨', '→', '↔', '(', ')'].map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => handleInsertSymbol(sym)}
                className="px-2.5 py-0.5 bg-surface border border-border-subtle rounded text-text-main hover:bg-primary hover:border-primary hover:text-white transition-colors font-bold text-xs"
              >
                {sym}
              </button>
            ))}
          </div>

          <input
            id="expressao"
            type="text"
            value={question.expressao}
            onChange={(e) => handleExpressionChange(e.target.value)}
            placeholder="Ex: (P ∨ Q) ∧ (~R)"
            className="w-full bg-transparent p-3 text-text-main font-mono text-base focus:outline-none"
          />
        </div>

        {parseError && (
          <p className="text-error text-xs mt-1.5 font-medium flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-error rounded-full" />
            {parseError}
          </p>
        )}
      </div>

      {/* Seção da Tabela-Verdade & Scaffolding Pedagógico */}
      {question.linhas.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {/* Cabeçalho da Seção com Contador */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-text-main font-semibold text-sm">
                Tabela-Verdade & Gabarito
              </h4>
              <p className="text-xs text-text-muted">
                {baseVars.length} variáveis ({Math.pow(2, baseVars.length)} linhas) • {intermediateConnectives.length + 1} conectivos
              </p>
            </div>
          </div>

          {/* Matriz da Tabela-Verdade */}
          <div className="overflow-x-auto rounded-lg border border-border-subtle font-mono">
            <table className="w-full border-collapse bg-base text-xs md:text-sm">
              <thead>
                <tr>
                  {question.variaveis.map((v, i) => {
                    const isBase = baseVars.includes(v);
                    if (isBase) {
                      return (
                        <th key={i} className="border border-border-subtle text-center p-2.5 bg-surface text-primary whitespace-nowrap">
                          {v}
                        </th>
                      );
                    }

                    const isAllRevealed = question.linhas.every((_, r) => !!question.celulas_reveladas?.[`${r}_${v}`]);

                    return (
                      <th key={i} className="border border-border-subtle p-2 bg-primary/5 text-primary whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{v}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleColumn(v)}
                            className={`p-1 rounded transition-colors ${
                              isAllRevealed
                                ? 'bg-primary/20 text-primary hover:bg-primary/30'
                                : 'bg-surface text-text-muted hover:text-white border border-border-subtle'
                            }`}
                            title={isAllRevealed ? 'Coluna inteira visível ao aluno. Clique para deixar o aluno responder.' : 'Clique para mostrar a resposta da coluna inteira ao aluno.'}
                          >
                            {isAllRevealed ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                        </div>
                      </th>
                    );
                  })}

                  {/* Cabeçalho da coluna final */}
                  <th className="border border-border-subtle p-2 bg-primary/10 border-l-2 border-l-primary text-primary whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{question.expressao || 'Resultado'}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleColumn('final')}
                        className={`p-1 rounded transition-colors ${
                          question.linhas.every((_, r) => !!question.celulas_reveladas?.[`${r}_final`])
                            ? 'bg-primary/20 text-primary hover:bg-primary/30'
                            : 'bg-surface text-text-muted hover:text-white border border-border-subtle'
                        }`}
                        title={
                          question.linhas.every((_, r) => !!question.celulas_reveladas?.[`${r}_final`])
                            ? 'Coluna final visível ao aluno. Clique para deixar o aluno responder.'
                            : 'Clique para mostrar a resposta da coluna final ao aluno.'
                        }
                      >
                        {question.linhas.every((_, r) => !!question.celulas_reveladas?.[`${r}_final`]) ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {question.linhas.map((linha, idx) => {
                  const val = question.resposta_esperada[idx] || 'V';
                  const isFinalRevealed = !!question.celulas_reveladas?.[`${idx}_final`];

                  return (
                    <tr key={linha.id} className="hover:bg-primary/5 transition-colors duration-200">
                      {linha.valores.map((v, cIdx) => {
                        const colName = question.variaveis[cIdx] || '';
                        const isConnective = !baseVars.includes(colName);

                        if (isConnective) {
                          const isRevealed = !!question.celulas_reveladas?.[`${idx}_${colName}`];

                          return (
                            <td key={cIdx} className="border border-border-subtle text-center p-1.5 min-w-[90px]">
                              <button
                                type="button"
                                onClick={() => handleToggleCell(idx, colName)}
                                className={`w-full py-1 px-2 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                                  isRevealed
                                    ? 'bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30'
                                    : v === 'V'
                                      ? 'bg-success/10 text-success border border-dashed border-success/40 hover:bg-success/20'
                                      : 'bg-error/10 text-error border border-dashed border-error/40 hover:bg-error/20'
                                }`}
                                title={
                                  isRevealed
                                    ? `Célula visível ao aluno (${v}). Clique para deixar o aluno responder.`
                                    : `Aluno deve responder (Gabarito: ${v}). Clique para revelar ao aluno.`
                                }
                              >
                                <span>{v}</span>
                                <span className="text-[10px] font-normal opacity-80 flex items-center">
                                  {isRevealed ? <Eye size={11} /> : <EyeOff size={11} />}
                                </span>
                              </button>
                            </td>
                          );
                        }

                        // Variável atômica pré-preenchida
                        return (
                          <td key={cIdx} className={`border border-border-subtle text-center p-2 whitespace-nowrap font-bold ${v === 'V' ? 'text-success bg-success/5' : 'text-error bg-error/5'}`}>
                            {v}
                          </td>
                        );
                      })}

                      {/* Coluna final */}
                      <td className="border border-border-subtle border-l-2 border-l-border-subtle text-center p-1.5 min-w-[90px]">
                        <button
                          type="button"
                          onClick={() => handleToggleCell(idx, 'final')}
                          className={`w-full py-1 px-2 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                            isFinalRevealed
                              ? 'bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30'
                              : val === 'V'
                                ? 'bg-success/10 text-success border border-dashed border-success/40 hover:bg-success/20'
                                : 'bg-error/10 text-error border border-error/40 border-dashed hover:bg-error/20'
                          }`}
                          title={
                            isFinalRevealed
                              ? `Célula final visível ao aluno (${val}). Clique para deixar o aluno responder.`
                              : `Aluno deve responder (Gabarito: ${val}). Clique para revelar ao aluno.`
                          }
                        >
                          <span>{val}</span>
                          <span className="text-[10px] font-normal opacity-80 flex items-center">
                            {isFinalRevealed ? <Eye size={11} /> : <EyeOff size={11} />}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
