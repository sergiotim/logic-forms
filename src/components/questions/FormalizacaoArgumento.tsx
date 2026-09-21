import React, { useState, useRef, useMemo } from 'react';
import { FormalizacaoArgumentoQuestion } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      {/* Painel Fixo de Contexto e Ferramentas (Dicas + Teclado Virtual com Foco Ativo) */}
      <div
        data-testid="fixed-context-tools-panel"
        className="sticky top-0 z-20 bg-base md:bg-surface pt-1 pb-3 space-y-2.5 border-b border-border-subtle/80 backdrop-blur-md shadow-sm"
      >
        {/* Dicas / Léxico */}
        {question.dicas && question.dicas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 font-mono" data-testid="dicas-container">
            {question.dicas.map((dica, idx) => (
              <span
                key={idx}
                className="text-xs bg-surface md:bg-base border border-border-subtle text-text-muted px-2.5 py-1 rounded-md"
              >
                {dica}
              </span>
            ))}
          </div>
        )}

        {/* Teclado Virtual Global com Foco Ativo */}
        <div className="bg-surface md:bg-base p-2.5 rounded-xl border border-border-subtle space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-xs text-text-muted font-mono px-1">
            <span className="font-semibold text-text-main">Teclado Lógico Virtual</span>
            <span className="text-primary font-semibold flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {activeTarget.type === 'conclusion'
                ? 'Editando Conclusão'
                : `Editando Premissa ${activeTarget.index + 1}`}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 font-mono">
            {keyboardKeys.map((tecla, idx) => {
              const isLetter = /^[a-zA-Z]$/.test(tecla);
              return (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleKeyPress(tecla)}
                  className={`flex-1 min-w-[2.5rem] border rounded-lg px-2.5 py-1.5 text-base md:text-lg transition-all shadow-sm text-center active:scale-95 ${
                    isLetter
                      ? 'bg-primary/10 text-primary font-bold border-primary/30 hover:bg-primary hover:text-white hover:border-primary'
                      : 'bg-base md:bg-surface hover:bg-surface text-text-main border-border-subtle hover:border-primary'
                  }`}
                >
                  {tecla}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bloco de Premissas */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-mono uppercase tracking-wider text-text-muted block">
          Premissas do Argumento
        </label>

        {premises.map((premiseText, idx) => {
          const isActive = activeTarget.type === 'premise' && activeTarget.index === idx;
          return (
            <div key={idx} className="flex items-center gap-2 scroll-mt-32">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted select-none">
                  P{idx + 1}:
                </span>
                <input
                  ref={(el) => {
                    premiseRefs.current[idx] = el;
                  }}
                  type="text"
                  value={premiseText}
                  onFocus={() => setActiveTarget({ type: 'premise', index: idx })}
                  onChange={(e) => handleUpdatePremise(idx, e.target.value)}
                  placeholder={`Ex: D → V`}
                  className={`w-full bg-base border text-text-main text-lg py-3 pl-12 pr-4 rounded-xl font-mono focus:outline-none transition-all ${
                    isActive
                      ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                      : 'border-border-subtle hover:border-border-subtle/80'
                  }`}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              {premises.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePremise(idx)}
                  className="p-3 text-text-muted hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-xl transition-colors"
                  title="Remover esta premissa"
                  aria-label={`Remover premissa ${idx + 1}`}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleAddPremise}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg border border-primary/20 transition-colors"
        >
          <Plus size={14} />
          <span>Adicionar outra premissa</span>
        </button>
      </div>

      {/* Linha de Dedução */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-dashed border-border-subtle"></div>
        <span className="flex-shrink mx-4 text-xs font-mono text-text-muted bg-surface px-3 py-1 rounded border border-border-subtle">
          Portanto (Conclusão ∴)
        </span>
        <div className="flex-grow border-t border-dashed border-border-subtle"></div>
      </div>

      {/* Bloco de Conclusão */}
      <div className="space-y-2 scroll-mt-32 pb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted select-none">
            C:
          </span>
          <input
            ref={conclusionRef}
            type="text"
            value={conclusion}
            onFocus={() => setActiveTarget({ type: 'conclusion' })}
            onChange={(e) => handleUpdateConclusion(e.target.value)}
            placeholder="Ex: V"
            className={`w-full bg-base border text-text-main text-lg py-3 pl-12 pr-4 rounded-xl font-mono focus:outline-none transition-all ${
              activeTarget.type === 'conclusion'
                ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                : 'border-border-subtle hover:border-border-subtle/80'
            }`}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
};

