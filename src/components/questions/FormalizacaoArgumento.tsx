import React, { useState, useRef, useMemo } from 'react';
import { FormalizacaoArgumentoQuestion } from '@/types';
import { Plus, Trash2, Delete } from 'lucide-react';

interface FormalizacaoArgumentoProps {
  question: FormalizacaoArgumentoQuestion;
  userAnswer: {
    premissas: string[];
    conclusao: string;
  };
  onChange: (value: { premissas: string[]; conclusao: string }) => void;
}

type ActiveFocusTarget = { type: 'premise'; index: number } | { type: 'conclusion' };

export const FormalizacaoArgumento: React.FC<FormalizacaoArgumentoProps> = ({
  question,
  userAnswer,
  onChange,
}) => {
  const premises = userAnswer.premissas && userAnswer.premissas.length > 0
    ? userAnswer.premissas
    : [''];
  const conclusion = userAnswer.conclusao || '';

  const [activeTarget, setActiveTarget] = useState<ActiveFocusTarget>({
    type: 'premise',
    index: 0,
  });

  // Extrai dinamicamente todas as variáveis proposicionais e predicados das premissas, conclusão e dicas
  const keyboardKeys = useMemo(() => {
    const vars = new Set<string>();

    const extractLetters = (formula: string) => {
      // 1. Variáveis ligadas a quantificadores: ∀x, ∃y
      const quantMatches = Array.from((formula || '').matchAll(/[∀∃]\s*([a-z])/g));
      for (const m of quantMatches) vars.add(m[1]);

      // 2. Predicados e constantes: [A-Za-z]
      const matches = Array.from((formula || '').matchAll(/[A-Za-z]/g));
      for (const m of matches) vars.add(m[0]);
    };

    // Extrai das premissas esperadas do gabarito
    (question.resposta_esperada?.premissas || []).forEach(extractLetters);

    // Extrai da conclusão esperada do gabarito
    extractLetters(question.resposta_esperada?.conclusao || '');

    const configuredKeys = question.teclado_virtual || [];
    const configuredSymbols = configuredKeys.filter((k) => !/^[a-zA-Z]$/.test(k) && k !== '(' && k !== ')');

    // Letras (variáveis/predicados) ordenadas aparecem primeiro (maiúsculas e depois minúsculas), seguidas pelos conectivos lógicos e parênteses
    const allLetters = Array.from(vars).sort((a, b) => {
      const aUpper = a === a.toUpperCase();
      const bUpper = b === b.toUpperCase();
      if (aUpper && !bUpper) return -1;
      if (!aUpper && bUpper) return 1;
      return a.localeCompare(b);
    });
    return [...allLetters, ...configuredSymbols, '(', ')'];
  }, [question.resposta_esperada, question.teclado_virtual]);

  const premiseRefs = useRef<(HTMLInputElement | null)[]>([]);
  const conclusionRef = useRef<HTMLInputElement | null>(null);

  const handleUpdatePremise = (index: number, text: string) => {
    const next = [...premises];
    next[index] = text;
    onChange({
      premissas: next,
      conclusao: conclusion,
    });
  };

  const handleAddPremise = () => {
    const next = [...premises, ''];
    onChange({
      premissas: next,
      conclusao: conclusion,
    });
    const newIdx = next.length - 1;
    setActiveTarget({ type: 'premise', index: newIdx });
    setTimeout(() => {
      premiseRefs.current[newIdx]?.focus();
    }, 0);
  };

  const handleRemovePremise = (index: number) => {
    if (premises.length <= 1) return;
    const next = premises.filter((_, i) => i !== index);
    onChange({
      premissas: next,
      conclusao: conclusion,
    });
    const nextActiveIdx = Math.max(0, index - 1);
    setActiveTarget({ type: 'premise', index: nextActiveIdx });
  };

  const handleUpdateConclusion = (text: string) => {
    onChange({
      premissas: premises,
      conclusao: text,
    });
  };

  const handleKeyPress = (char: string) => {
    if (activeTarget.type === 'conclusion') {
      const input = conclusionRef.current;
      if (!input) {
        handleUpdateConclusion(conclusion + char);
        return;
      }
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const nextVal = conclusion.substring(0, start) + char + conclusion.substring(end);
      handleUpdateConclusion(nextVal);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + char.length, start + char.length);
      }, 0);
    } else {
      const idx = activeTarget.index;
      const input = premiseRefs.current[idx];
      const currentText = premises[idx] || '';
      if (!input) {
        handleUpdatePremise(idx, currentText + char);
        return;
      }
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const nextVal = currentText.substring(0, start) + char + currentText.substring(end);
      handleUpdatePremise(idx, nextVal);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + char.length, start + char.length);
      }, 0);
    }
  };

  const handleBackspace = () => {
    if (activeTarget.type === 'conclusion') {
      const input = conclusionRef.current;
      const currentText = conclusion;
      if (!input) {
        handleUpdateConclusion(currentText.slice(0, -1));
        return;
      }
      const start = input.selectionStart ?? currentText.length;
      const end = input.selectionEnd ?? currentText.length;
      if (start === end) {
        if (start === 0) return;
        const nextVal = currentText.substring(0, start - 1) + currentText.substring(end);
        handleUpdateConclusion(nextVal);
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(start - 1, start - 1);
        }, 0);
      } else {
        const nextVal = currentText.substring(0, start) + currentText.substring(end);
        handleUpdateConclusion(nextVal);
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(start, start);
        }, 0);
      }
    } else {
      const idx = activeTarget.index;
      const input = premiseRefs.current[idx];
      const currentText = premises[idx] || '';
      if (!input) {
        handleUpdatePremise(idx, currentText.slice(0, -1));
        return;
      }
      const start = input.selectionStart ?? currentText.length;
      const end = input.selectionEnd ?? currentText.length;
      if (start === end) {
        if (start === 0) return;
        const nextVal = currentText.substring(0, start - 1) + currentText.substring(end);
        handleUpdatePremise(idx, nextVal);
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(start - 1, start - 1);
        }, 0);
      } else {
        const nextVal = currentText.substring(0, start) + currentText.substring(end);
        handleUpdatePremise(idx, nextVal);
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(start, start);
        }, 0);
      }
    }
  };

  const keyboardRows = useMemo(() => {
    const all = [...keyboardKeys, '__BACKSPACE__'];
    if (all.length <= 6) {
      return [all];
    }
    const mid = Math.ceil(all.length / 2);
    return [all.slice(0, mid), all.slice(mid)];
  }, [keyboardKeys]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Dicas / Léxico (Quebra Natural em Chips - Sem Rolagem Lateral) */}
      {question.dicas && question.dicas.length > 0 && (
        <div
          data-testid="dicas-container"
          className="sticky top-0 z-10 bg-base/95 md:bg-surface/95 backdrop-blur-md py-1.5 pb-2 border-b border-border-subtle/50 flex flex-wrap items-center gap-1.5 shrink-0"
        >
          <span className="text-[10px] sm:text-xs font-mono text-text-muted uppercase tracking-wider shrink-0 font-semibold mr-1">
            Léxico:
          </span>
          {question.dicas.map((dica, idx) => (
            <span
              key={idx}
              className="text-xs font-mono bg-surface md:bg-base border border-border-subtle text-text-muted px-2.5 py-0.5 rounded-md shadow-sm"
            >
              {dica}
            </span>
          ))}
        </div>
      )}

      {/* Área Central de Trabalho (Premissas + Linha de Dedução + Conclusão) */}
      <div className="flex-1 space-y-3 pt-2 pb-4">
        {/* Bloco de Premissas */}
        <div className="space-y-2.5">
          <label className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-text-muted block">
            Premissas do Argumento
          </label>

          {premises.map((premiseText, idx) => {
            const isActive = activeTarget.type === 'premise' && activeTarget.index === idx;
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted select-none">
                    P{idx + 1}:
                  </span>
                  <input
                    ref={(el) => {
                      premiseRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="none"
                    value={premiseText}
                    onFocus={() => setActiveTarget({ type: 'premise', index: idx })}
                    onChange={(e) => handleUpdatePremise(idx, e.target.value)}
                    placeholder={`Ex: D → V`}
                    className={`w-full bg-base border text-text-main text-base sm:text-lg py-2.5 sm:py-3 pl-11 sm:pl-12 pr-4 rounded-xl font-mono focus:outline-none transition-all ${
                      isActive
                        ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                        : 'border-border-subtle hover:border-border-subtle/80'
                    }`}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>

                {premises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePremise(idx)}
                    className="p-2.5 sm:p-3 text-text-muted hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-xl transition-colors"
                    title="Remover esta premissa"
                    aria-label={`Remover premissa ${idx + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAddPremise}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg border border-primary/20 transition-colors"
          >
            <Plus size={13} />
            <span>Adicionar outra premissa</span>
          </button>
        </div>

        {/* Linha de Dedução */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-dashed border-border-subtle"></div>
          <span className="flex-shrink mx-3 text-[11px] font-mono text-text-muted bg-surface px-2.5 py-0.5 rounded border border-border-subtle">
            Portanto (Conclusão ∴)
          </span>
          <div className="flex-grow border-t border-dashed border-border-subtle"></div>
        </div>

        {/* Bloco de Conclusão */}
        <div className="space-y-1.5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted select-none">
              C:
            </span>
            <input
              ref={conclusionRef}
              type="text"
              inputMode="none"
              value={conclusion}
              onFocus={() => setActiveTarget({ type: 'conclusion' })}
              onChange={(e) => handleUpdateConclusion(e.target.value)}
              placeholder="Ex: V"
              className={`w-full bg-base border text-text-main text-base sm:text-lg py-2.5 sm:py-3 pl-11 sm:pl-12 pr-4 rounded-xl font-mono focus:outline-none transition-all ${
                activeTarget.type === 'conclusion'
                  ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                  : 'border-border-subtle hover:border-border-subtle/80'
              }`}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </div>
      </div>

      {/* Teclado Virtual Global com Foco Ativo (Ancorado na Base - Linhas Equilibradas) */}
      <div
        data-testid="virtual-keyboard-panel"
        className="sticky bottom-0 z-20 bg-base/95 md:bg-surface/95 backdrop-blur-md pt-2 pb-1.5 border-t border-border-subtle shadow-[0_-8px_16px_rgba(0,0,0,0.3)] md:shadow-none shrink-0 space-y-1 sm:space-y-1.5"
      >
        <div className="flex items-center justify-between text-xs font-mono px-1 pb-0.5">
          <span className="text-[11px] text-text-muted">Teclado Virtual</span>
          <span className="text-primary font-semibold text-xs flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {activeTarget.type === 'conclusion'
              ? 'Editando Conclusão'
              : `Editando Premissa ${activeTarget.index + 1}`}
          </span>
        </div>

        <div className="space-y-1 sm:space-y-1.5 font-mono">
          {keyboardRows.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center justify-center gap-1 sm:gap-1.5">
              {row.map((item, idx) => {
                if (item === '__BACKSPACE__') {
                  return (
                    <button
                      key="backspace"
                      type="button"
                      data-testid="backspace-button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleBackspace}
                      className="flex-1 min-w-[2.2rem] max-w-[4rem] h-9 sm:h-10 border rounded-lg px-2 text-text-muted hover:text-error hover:bg-error/10 border-border-subtle hover:border-error/40 transition-all shadow-sm flex items-center justify-center active:scale-95"
                      title="Apagar caractere anterior"
                      aria-label="Apagar"
                    >
                      <Delete size={18} />
                    </button>
                  );
                }

                const isLetter = /^[a-zA-Z]$/.test(item);
                return (
                  <button
                    key={idx}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleKeyPress(item)}
                    className={`flex-1 min-w-[2.2rem] max-w-[4rem] h-9 sm:h-10 border rounded-lg px-2 text-base sm:text-lg transition-all shadow-sm text-center active:scale-95 flex items-center justify-center ${
                      isLetter
                        ? 'bg-primary/15 text-primary font-bold border-primary/40 hover:bg-primary hover:text-white hover:border-primary'
                        : 'bg-surface md:bg-base hover:bg-surface text-text-main border-border-subtle hover:border-primary'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

