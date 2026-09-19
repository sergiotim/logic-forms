import React from 'react';
import { MultiplaEscolhaQuestion } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface MultiplaEscolhaFormProps {
  question: MultiplaEscolhaQuestion;
  onChange: (updated: MultiplaEscolhaQuestion) => void;
}

export const MultiplaEscolhaForm: React.FC<MultiplaEscolhaFormProps> = ({ question, onChange }) => {
  const handleEnunciadoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...question, enunciado: e.target.value });
  };

  const handleTopicoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...question, topico: e.target.value });
  };

  const handleOpcaoTextChange = (id: string, text: string) => {
    const novasOpcoes = question.opcoes.map((o) => (o.id === id ? { ...o, texto: text } : o));
    onChange({ ...question, opcoes: novasOpcoes });
  };

  const handleSetRespostaEsperada = (id: string) => {
    onChange({ ...question, resposta_esperada: id });
  };

  const handleAddOpcao = () => {
    const newId = 'opt_' + Math.random().toString(36).substring(2, 9);
    onChange({
      ...question,
      opcoes: [...question.opcoes, { id: newId, texto: '' }],
    });
  };

  const handleRemoveOpcao = (id: string) => {
    const novasOpcoes = question.opcoes.filter((o) => o.id !== id);
    let novaResposta = question.resposta_esperada;
    
    // Se removemos a resposta correta, limpa o gabarito
    if (novaResposta === id) {
      novaResposta = '';
    }

    onChange({
      ...question,
      opcoes: novasOpcoes,
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
          placeholder="Pergunta da questão..."
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
          placeholder="Ex: Lógica Proposicional"
          className="w-full bg-base border border-border-subtle rounded-lg p-3 text-text-main focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-main font-semibold">Opções de Resposta ({question.opcoes.length})</span>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddOpcao}
            className="text-xs px-3 py-1 flex items-center gap-1"
          >
            <Plus size={14} /> Adicionar Opção
          </Button>
        </div>

        <div className="space-y-3">
          {question.opcoes.map((opcao, idx) => {
            const isCorrect = question.resposta_esperada === opcao.id;
            return (
              <div
                key={opcao.id}
                className={`bg-base border rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center gap-3 transition-colors ${
                  isCorrect ? 'border-success' : 'border-border-subtle'
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetRespostaEsperada(opcao.id)}
                    className={`flex items-center justify-center w-6 h-6 rounded-full border transition-colors ${
                      isCorrect 
                        ? 'bg-success border-success text-white' 
                        : 'bg-surface border-border-subtle text-transparent hover:border-text-muted'
                    }`}
                    title="Marcar como resposta correta"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <span className="text-text-muted font-mono font-bold text-xs">Opção {idx + 1}</span>
                </div>

                <input
                  type="text"
                  value={opcao.texto}
                  onChange={(e) => handleOpcaoTextChange(opcao.id, e.target.value)}
                  placeholder="Texto da opção (Suporta Markdown)..."
                  className="flex-1 bg-surface border border-border-subtle rounded px-3 py-1.5 text-text-main text-sm focus:outline-none focus:border-primary transition-colors w-full md:w-auto"
                />

                {question.opcoes.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOpcao(opcao.id)}
                    className="p-1.5 text-text-muted hover:text-error transition-colors shrink-0"
                    title="Remover opção"
                    aria-label="Remover opção"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

