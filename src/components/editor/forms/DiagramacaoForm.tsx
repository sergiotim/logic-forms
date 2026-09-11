import React from 'react';
import { DiagramacaoQuestion } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface DiagramacaoFormProps {
  question: DiagramacaoQuestion;
  onChange: (updated: DiagramacaoQuestion) => void;
}

export const DiagramacaoForm: React.FC<DiagramacaoFormProps> = ({ question, onChange }) => {
  const handleEnunciadoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...question, enunciado: e.target.value });
  };

  const handleTopicoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...question, topico: e.target.value });
  };

  const handleFraseTextChange = (id: string, text: string) => {
    const novasFrases = question.frases.map((f) => (f.id === id ? { ...f, texto: text } : f));
    onChange({ ...question, frases: novasFrases });
  };

  const handleFraseTypeToggle = (id: string, tipo: 'P' | 'C') => {
    onChange({
      ...question,
      resposta_esperada: {
        ...question.resposta_esperada,
        [id]: tipo,
      },
    });
  };

  const handleAddFrase = () => {
    const newId = 'f_' + Math.random().toString(36).substring(2, 9);
    onChange({
      ...question,
      frases: [...question.frases, { id: newId, texto: '' }],
      resposta_esperada: {
        ...question.resposta_esperada,
        [newId]: 'P',
      },
    });
  };

  const handleRemoveFrase = (id: string) => {
    const novasFrases = question.frases.filter((f) => f.id !== id);
    const novaResposta = { ...question.resposta_esperada };
    delete novaResposta[id];
    onChange({
      ...question,
      frases: novasFrases,
      resposta_esperada: novaResposta,
    });
  };

  return (
    <div className="space-y-4 font-sans text-sm">
      <div>
        <label htmlFor="enunciado" className="block text-text-main font-semibold mb-1">
          Enunciado
        </label>
        <textarea
          id="enunciado"
          value={question.enunciado}
          onChange={handleEnunciadoChange}
          rows={3}
          placeholder="Instrução do exercício de diagramação..."
          className="w-full bg-base border border-border-subtle rounded-lg p-3 text-text-main focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div>
        <label htmlFor="topico" className="block text-text-main font-semibold mb-1">
          Tópico
        </label>
        <input
          id="topico"
          type="text"
          value={question.topico}
          onChange={handleTopicoChange}
          placeholder="Ex: Estrutura de um Argumento"
          className="w-full bg-base border border-border-subtle rounded-lg p-3 text-text-main focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-main font-semibold">Frases do Argumento ({question.frases.length})</span>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddFrase}
            className="text-xs px-3 py-1 flex items-center gap-1"
          >
            <Plus size={14} /> Adicionar Frase
          </Button>
        </div>

        <div className="space-y-3">
          {question.frases.map((frase, idx) => {
            const tipo = question.resposta_esperada[frase.id] || 'P';
            return (
              <div
                key={frase.id}
                className="bg-base border border-border-subtle rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center gap-3"
              >
                <span className="text-text-muted font-mono font-bold text-xs">{idx + 1}.</span>
                <input
                  type="text"
                  value={frase.texto}
                  onChange={(e) => handleFraseTextChange(frase.id, e.target.value)}
                  placeholder={`Texto da frase ${idx + 1}...`}
                  className="flex-1 bg-surface border border-border-subtle rounded px-3 py-1.5 text-text-main text-sm focus:outline-none focus:border-primary transition-colors"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex bg-surface rounded p-0.5 border border-border-subtle">
                    <button
                      type="button"
                      onClick={() => handleFraseTypeToggle(frase.id, 'P')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        tipo === 'P' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'
                      }`}
                    >
                      Premissa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFraseTypeToggle(frase.id, 'C')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        tipo === 'C' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'
                      }`}
                    >
                      Conclusão
                    </button>
                  </div>

                  {question.frases.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFrase(frase.id)}
                      className="p-1.5 text-text-muted hover:text-error transition-colors"
                      title="Remover frase"
                      aria-label="Remover frase"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

