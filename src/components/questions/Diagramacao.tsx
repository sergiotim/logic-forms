import React, { useState, useEffect } from 'react';
import { DiagramacaoQuestion } from '@/types';
import ReactMarkdown from 'react-markdown';

interface DiagramacaoProps {
  question: DiagramacaoQuestion;
  userAnswer: Record<string, string>;
  onChange: (id: string, value: 'P' | 'C') => void;
}

export const Diagramacao: React.FC<DiagramacaoProps> = ({ question, userAnswer, onChange }) => {
  const [shuffledFrases, setShuffledFrases] = useState(question.frases);

  useEffect(() => {
    const shuffleArray = [...question.frases];
    for (let i = shuffleArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffleArray[i], shuffleArray[j]] = [shuffleArray[j], shuffleArray[i]];
    }
    setShuffledFrases(shuffleArray);
  }, [question.id, question.frases]);

  return (
    <div className="space-y-4">
      {shuffledFrases.map((frase, index) => {
        const selectedVal = userAnswer[frase.id];

        return (
          <div key={frase.id} className="p-4 bg-base border border-border-subtle rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-border-subtle transition-colors">
            <div className="text-text-main font-sans mb-2 md:mb-0 flex gap-1">
              <span>{index + 1}.</span> 
              <ReactMarkdown>{frase.texto}</ReactMarkdown>
            </div>
            <div className="flex w-full md:w-auto bg-surface rounded-md p-1 border border-border-subtle shrink-0 font-sans">
              <button 
                onClick={() => onChange(frase.id, 'P')}
                className={`flex-1 md:w-32 px-4 py-2 md:py-1 text-sm rounded font-medium transition-colors ${selectedVal === 'P' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
              >
                Premissa
              </button>
              <button 
                onClick={() => onChange(frase.id, 'C')}
                className={`flex-1 md:w-32 px-4 py-2 md:py-1 text-sm rounded font-medium transition-colors ${selectedVal === 'C' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
              >
                Conclusão
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
