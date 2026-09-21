import React, { useRef, useMemo } from 'react';
import { FormalizacaoQuestion } from '@/types';
import { Delete } from 'lucide-react';

interface FormalizacaoProps {
  question: FormalizacaoQuestion;
  userAnswer: string;
  onChange: (value: string) => void;
}

export const Formalizacao: React.FC<FormalizacaoProps> = ({ question, userAnswer, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const keyboardKeys = useMemo(() => {
    const vars = new Set<string>();

    const extractLetters = (formula: string) => {
      const quantMatches = Array.from((formula || '').matchAll(/[∀∃]\s*([a-z])/g));
      for (const m of quantMatches) vars.add(m[1]);
      const matches = Array.from((formula || '').matchAll(/[A-Za-z]/g));
      for (const m of matches) vars.add(m[0]);
    };

    extractLetters(question.resposta_esperada || '');

    const configured = question.teclado_virtual || [];
    const symbols = configured.filter((k) => !/^[a-zA-Z]$/.test(k) && k !== '(' && k !== ')');

    const allLetters = Array.from(vars).sort((a, b) => {
      const aUpper = a === a.toUpperCase();
      const bUpper = b === b.toUpperCase();
      if (aUpper && !bUpper) return -1;
      if (!aUpper && bUpper) return 1;
      return a.localeCompare(b);
    });

    return [...allLetters, ...symbols, '(', ')'];
  }, [question.resposta_esperada, question.teclado_virtual]);

  const handleKeyPress = (char: string) => {
    const input = inputRef.current;
    if (!input) {
      onChange(userAnswer + char);
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    const newVal = userAnswer.substring(0, start) + char + userAnswer.substring(end);
    onChange(newVal);

    // Focus and restore cursor position after render
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  };

  const handleBackspace = () => {
    const input = inputRef.current;
    if (!input) {
      onChange(userAnswer.slice(0, -1));
      return;
    }

    const start = input.selectionStart ?? userAnswer.length;
    const end = input.selectionEnd ?? userAnswer.length;

    if (start === end) {
      if (start === 0) return;
      const newVal = userAnswer.substring(0, start - 1) + userAnswer.substring(end);
      onChange(newVal);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start - 1, start - 1);
      }, 0);
    } else {
      const newVal = userAnswer.substring(0, start) + userAnswer.substring(end);
      onChange(newVal);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start, start);
      }, 0);
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5 font-mono">
        {question.dicas.map((dica, idx) => (
          <span
            key={idx}
            className="text-xs bg-surface border border-border-subtle text-text-muted px-2 py-0.5 rounded-md"
          >
            {dica}
          </span>
        ))}
      </div>

      <div className="bg-base p-2 md:p-3 rounded-t-lg border border-border-subtle border-b-0 flex flex-wrap gap-1.5 sm:gap-2 font-mono">
        {keyboardKeys.map((tecla, idx) => {
          const isLetter = /^[a-zA-Z]$/.test(tecla);
          return (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleKeyPress(tecla)}
              className={`flex-1 min-w-[2.2rem] max-w-[3.5rem] border rounded px-2 md:px-3 py-2 text-base md:text-xl transition-colors shadow-sm text-center ${
                isLetter
                  ? 'bg-primary/10 text-primary font-bold border-primary/30 hover:bg-primary hover:text-white hover:border-primary'
                  : 'bg-surface hover:bg-surface text-text-main border-border-subtle hover:border-primary'
              }`}
            >
              {tecla}
            </button>
          );
        })}

        {/* Botão de Apagar (Backspace) */}
        <button
          type="button"
          data-testid="backspace-button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleBackspace}
          className="flex-1 min-w-[2.6rem] max-w-[4rem] border rounded px-2 md:px-3 py-2 text-text-muted hover:text-error hover:bg-error/10 border-border-subtle hover:border-error/40 transition-all shadow-sm flex items-center justify-center active:scale-95"
          title="Apagar caractere anterior"
          aria-label="Apagar"
        >
          <Delete size={18} />
        </button>
      </div>

      <input
        ref={inputRef}
        type="text"
        inputMode="none"
        value={userAnswer}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-base border border-border-subtle text-text-main text-xl p-4 rounded-b-lg font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted/50"
        placeholder="Digite usando o teclado acima..."
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
      />
    </div>
  );
};
