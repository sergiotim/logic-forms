import React, { useState, useEffect } from 'react';
import { MultiplaEscolhaQuestion } from '@/types';
import ReactMarkdown from 'react-markdown';

interface MultiplaEscolhaProps {
  question: MultiplaEscolhaQuestion;
  userAnswer: string;
  onChange: (id: string) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export const MultiplaEscolha: React.FC<MultiplaEscolhaProps> = ({ question, userAnswer, onChange }) => {
  const [shuffledOpcoes, setShuffledOpcoes] = useState(question?.opcoes || []);

  useEffect(() => {
    if (!question?.opcoes || question.opcoes.length === 0) {
      setShuffledOpcoes([]);
      return;
    }
    const shuffleArray = [...question.opcoes];
    // Fisher-Yates Shuffle
    for (let i = shuffleArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffleArray[i], shuffleArray[j]] = [shuffleArray[j], shuffleArray[i]];
    }
    setShuffledOpcoes(shuffleArray);
  }, [question?.id, question?.opcoes]);

  if (!shuffledOpcoes || shuffledOpcoes.length === 0) {
    return (
      <div className="p-6 bg-surface border border-dashed border-border-subtle rounded-xl text-center text-text-muted text-sm font-sans">
        Esta questão de múltipla escolha não possui alternativas cadastradas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shuffledOpcoes.map((opcao, index) => {
        const isSelected = userAnswer === opcao.id;
        const letter = LETTERS[index] || '?';

        return (
          <button
            key={opcao.id}
            onClick={() => onChange(opcao.id)}
            className={`w-full text-left p-4 rounded-lg flex items-start gap-3 transition-colors border font-sans
              ${
                isSelected
                  ? 'bg-primary text-white border-primary'
                  : 'bg-base text-text-main border-border-subtle hover:border-text-muted'
              }
            `}
          >
            <div className={`font-semibold shrink-0 ${isSelected ? 'text-white' : 'text-primary'}`}>
              {letter})
            </div>
            <div className={`flex-1 prose prose-sm max-w-none ${isSelected ? 'prose-invert text-white' : 'text-text-main'} prose-p:my-0 prose-strong:text-current`}>
              <ReactMarkdown>{opcao.texto}</ReactMarkdown>
            </div>
          </button>
        );
      })}
    </div>
  );
};

