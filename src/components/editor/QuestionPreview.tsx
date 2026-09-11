import React, { useState } from 'react';
import { Question, DiagramacaoQuestion, TabelaVerdadeQuestion, FormalizacaoQuestion } from '@/types';
import { Diagramacao } from '@/components/questions/Diagramacao';
import { TabelaVerdade } from '@/components/questions/TabelaVerdade';
import { Formalizacao } from '@/components/questions/Formalizacao';
import { Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuestionPreviewProps {
  question: Question;
}

export const QuestionPreview: React.FC<QuestionPreviewProps> = ({ question }) => {
  const [tabelaPreviewAnswer, setTabelaPreviewAnswer] = useState<Record<string, string>>({});

  return (
    <div
      data-testid="question-preview"
      className="bg-surface border border-border-subtle rounded-xl p-5 shadow-inner flex flex-col h-full"
    >
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border-subtle text-primary font-semibold text-sm">
        <Eye size={16} />
        <span>Preview do Aluno</span>
        <span className="text-xs font-mono text-text-muted ml-auto bg-base px-2 py-0.5 rounded border border-border-subtle uppercase">
          {question.tipo.replace('_', ' ')}
        </span>
      </div>

      <div className="mb-4">
        {question.topico && (
          <span className="text-xs font-mono text-text-muted block mb-1">{question.topico}</span>
        )}
        <div className="text-lg font-bold text-white leading-snug flex flex-col gap-3">
          {question.enunciado ? <ReactMarkdown>{question.enunciado}</ReactMarkdown> : <span className="italic text-text-muted">Sem enunciado ainda...</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {question.tipo === 'diagramacao' && (
          <Diagramacao
            question={question as DiagramacaoQuestion}
            userAnswer={{}}
            onChange={() => {}}
          />
        )}
        {question.tipo === 'tabela_verdade' && (
          <TabelaVerdade
            question={question as TabelaVerdadeQuestion}
            userAnswer={tabelaPreviewAnswer}
            onChange={(rowIdx, val, colKey = 'final') =>
              setTabelaPreviewAnswer((prev) => ({
                ...prev,
                [`${rowIdx}_${colKey}`]: val,
              }))
            }
          />
        )}
        {question.tipo === 'formalizacao' && (
          <Formalizacao
            question={question as FormalizacaoQuestion}
            userAnswer=""
            onChange={() => {}}
          />
        )}
      </div>
    </div>
  );
};
