import React, { useRef } from 'react';
import { FormalizacaoQuestion } from '@/types';

interface FormalizacaoProps {
  question: FormalizacaoQuestion;
  userAnswer: string;
  onChange: (value: string) => void;
}

export const Formalizacao: React.FC<FormalizacaoProps> = ({ question, userAnswer, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 font-mono">
        {question.dicas.map((dica, idx) => (
          <span key={idx} className="text-xs bg-surface border border-border-subtle text-text-muted px-2 py-1 rounded">
            {dica}
          </span>
        ))}
      </div>
      
      <div className="bg-base p-2 md:p-3 rounded-t-lg border border-border-subtle border-b-0 flex flex-wrap gap-2 font-mono">
        {question.teclado_virtual.map((tecla, idx) => {
          const isLetter = /^[a-zA-Z]$/.test(tecla);
          return (
            <button 
              key={idx}
              onClick={() => handleKeyPress(tecla)}
              className={`flex-1 min-w-[2.5rem] border rounded px-2 md:px-4 py-2 text-lg md:text-xl transition-colors shadow-sm text-center ${
                isLetter 
                  ? "bg-primary/10 text-primary font-bold border-primary/30 hover:bg-primary hover:text-white hover:border-primary" 
                  : "bg-surface hover:bg-surface text-text-main border-border-subtle hover:border-primary"
              }`}
            >
              {tecla}
            </button>
          );
        })}
      </div>
      
      <input 
        ref={inputRef}
        type="text" 
        value={userAnswer}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-base border border-border-subtle text-text-main text-xl p-4 rounded-b-lg font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted/50" 
        placeholder="Digite ou use os botões acima..." 
        autoComplete="off" 
        spellCheck="false" 
      />
    </div>
  );
};
