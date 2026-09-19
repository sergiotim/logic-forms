import React, { useState } from 'react';
import { Question, QuestionType } from '@/types';
import { createQuestion } from '@/lib/storage';
import { DiagramacaoForm } from './forms/DiagramacaoForm';
import { TabelaVerdadeForm } from './forms/TabelaVerdadeForm';
import { FormalizacaoForm } from './forms/FormalizacaoForm';
import { FormalizacaoArgumentoForm } from './forms/FormalizacaoArgumentoForm';
import { MultiplaEscolhaForm } from './forms/MultiplaEscolhaForm';
import { QuestionPreview } from './QuestionPreview';
import { Button } from '@/components/ui/Button';
import { Network, Table2, PenLine, Split, ListChecks, X, Eye } from 'lucide-react';

interface QuestionFormModalProps {
  initialQuestion: Question | null;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  initialQuestion,
  onSave,
  onCancel,
}) => {
  const [selectedType, setSelectedType] = useState<QuestionType | null>(
    initialQuestion ? initialQuestion.tipo : null,
  );
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(initialQuestion);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const handleSelectType = (type: QuestionType) => {
    setSelectedType(type);
    setCurrentQuestion(createQuestion(type));
    setErrorMessage(null);
  };

  const handleSave = () => {
    if (!currentQuestion) return;

    if (!currentQuestion.enunciado.trim()) {
      setErrorMessage('O enunciado é obrigatório.');
      return;
    }

    if (currentQuestion.tipo === 'formalizacao') {
      if (!currentQuestion.resposta_esperada || !currentQuestion.resposta_esperada.trim()) {
        setErrorMessage('A resposta esperada é obrigatória.');
        return;
      }
    }

    if (currentQuestion.tipo === 'formalizacao_argumento') {
      const validPremises = currentQuestion.resposta_esperada.premissas.filter((p) => p.trim());
      if (validPremises.length === 0) {
        setErrorMessage('Adicione pelo menos uma premissa ao gabarito do argumento.');
        return;
      }
      if (!currentQuestion.resposta_esperada.conclusao.trim()) {
        setErrorMessage('A conclusão esperada do argumento é obrigatória.');
        return;
      }
    }

    if (currentQuestion.tipo === 'diagramacao') {
      if (currentQuestion.frases.length < 2) {
        setErrorMessage('A diagramação precisa de pelo menos 2 frases.');
        return;
      }
    }

    if (currentQuestion.tipo === 'tabela_verdade') {
      if (currentQuestion.variaveis.length === 0) {
        setErrorMessage('Adicione pelo menos uma variável à tabela-verdade.');
        return;
      }
    }

    if (currentQuestion.tipo === 'multipla_escolha') {
      if (currentQuestion.opcoes.length < 2) {
        setErrorMessage('A questão de múltipla escolha precisa ter pelo menos 2 alternativas.');
        return;
      }
      if (!currentQuestion.resposta_esperada) {
        setErrorMessage('Selecione uma das alternativas como a resposta correta.');
        return;
      }
      if (currentQuestion.opcoes.some(opt => !opt.texto.trim())) {
        setErrorMessage('Todas as alternativas devem ter algum texto.');
        return;
      }
    }

    onSave(currentQuestion);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface border border-border-subtle rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">
              {initialQuestion ? 'Editar Questão' : 'Nova Questão'}
            </h2>
            {selectedType && (
              <span className="text-xs font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20 uppercase">
                {selectedType.replace('_', ' ')}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-text-muted hover:text-white p-1 rounded-md transition-colors"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Pill-style Tab Bar */}
        {selectedType && (
          <div className="flex items-center justify-center p-3 border-b border-border-subtle bg-surface shrink-0">
            <div className="flex items-center gap-1 bg-base p-1 rounded-xl shadow-inner border border-border-subtle" role="tablist" aria-label="Navegação do formulário">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'editor'}
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-2 px-6 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'editor'
                    ? 'bg-surface text-white shadow-sm ring-1 ring-border-subtle'
                    : 'text-text-muted hover:text-white hover:bg-surface/50'
                }`}
              >
                <PenLine size={14} className={activeTab === 'editor' ? 'text-primary' : 'text-text-muted'} />
                <span>Editor</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'preview'}
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-6 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'preview'
                    ? 'bg-surface text-white shadow-sm ring-1 ring-border-subtle'
                    : 'text-text-muted hover:text-white hover:bg-surface/50'
                }`}
              >
                <Eye size={14} className={activeTab === 'preview' ? 'text-primary' : 'text-text-muted'} />
                <span>Visão do Aluno</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-0.5" title="Sincronizado em tempo real" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-base">
          {!selectedType ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-bold text-white mb-2">Escolha o tipo de questão</h3>
              <p className="text-text-muted text-sm mb-8">
                Selecione o modelo pedagógico para esta questão:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <button
                  type="button"
                  data-testid="type-btn-diagramacao"
                  aria-label="Tipo Diagramação"
                  onClick={() => handleSelectType('diagramacao')}
                  className="bg-base border border-border-subtle hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 rounded-xl p-5 flex flex-col items-center text-center transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Network size={24} />
                  </div>
                  <h4 className="font-bold text-white mb-1 text-sm">Diagramação</h4>
                  <p className="text-xs text-text-muted">
                    Classificação de premissas e conclusão de um argumento.
                  </p>
                </button>

                <button
                  type="button"
                  data-testid="type-btn-tabela_verdade"
                  aria-label="Tipo Tabela-Verdade"
                  onClick={() => handleSelectType('tabela_verdade')}
                  className="bg-base border border-border-subtle hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 rounded-xl p-5 flex flex-col items-center text-center transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Table2 size={24} />
                  </div>
                  <h4 className="font-bold text-white mb-1 text-sm">Tabela-Verdade</h4>
                  <p className="text-xs text-text-muted">
                    Matriz booleana de valorações verdadeiras e falsas.
                  </p>
                </button>

                <button
                  type="button"
                  data-testid="type-btn-formalizacao"
                  aria-label="Tipo Formalização"
                  onClick={() => handleSelectType('formalizacao')}
                  className="bg-base border border-border-subtle hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 rounded-xl p-5 flex flex-col items-center text-center transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <PenLine size={24} />
                  </div>
                  <h4 className="font-bold text-white mb-1 text-sm">Formalização</h4>
                  <p className="text-xs text-text-muted">
                    Transcrição com teclado lógico virtual de sentenças.
                  </p>
                </button>

                <button
                  type="button"
                  data-testid="type-btn-formalizacao_argumento"
                  aria-label="Tipo Formalização de Argumento"
                  onClick={() => handleSelectType('formalizacao_argumento')}
                  className="bg-base border border-border-subtle hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 rounded-xl p-5 flex flex-col items-center text-center transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Split size={24} />
                  </div>
                  <h4 className="font-bold text-white mb-1 text-sm">Argumento</h4>
                  <p className="text-xs text-text-muted">
                    Estruturação de premissas e dedução de conclusão.
                  </p>
                </button>

                <button
                  type="button"
                  data-testid="type-btn-multipla_escolha"
                  aria-label="Tipo Múltipla Escolha"
                  onClick={() => handleSelectType('multipla_escolha')}
                  className="bg-base border border-border-subtle hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 rounded-xl p-5 flex flex-col items-center text-center transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <ListChecks size={24} />
                  </div>
                  <h4 className="font-bold text-white mb-1 text-sm">Múltipla Escolha</h4>
                  <p className="text-xs text-text-muted">
                    Seleção de uma única resposta correta.
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Form Tab Panel */}
              <div className={activeTab === 'editor' ? 'space-y-4' : 'hidden'}>
                {currentQuestion?.tipo === 'diagramacao' && (
                  <DiagramacaoForm
                    question={currentQuestion}
                    onChange={(updated) => {
                      setCurrentQuestion(updated);
                      setErrorMessage(null);
                    }}
                  />
                )}

                {currentQuestion?.tipo === 'tabela_verdade' && (
                  <TabelaVerdadeForm
                    question={currentQuestion}
                    onChange={(updated) => {
                      setCurrentQuestion(updated);
                      setErrorMessage(null);
                    }}
                  />
                )}

                {currentQuestion?.tipo === 'formalizacao' && (
                  <FormalizacaoForm
                    question={currentQuestion}
                    onChange={(updated) => {
                      setCurrentQuestion(updated);
                      setErrorMessage(null);
                    }}
                    error={errorMessage || undefined}
                  />
                )}

                {currentQuestion?.tipo === 'formalizacao_argumento' && (
                  <FormalizacaoArgumentoForm
                    question={currentQuestion}
                    onChange={(updated) => {
                      setCurrentQuestion(updated);
                      setErrorMessage(null);
                    }}
                    error={errorMessage || undefined}
                  />
                )}

                {currentQuestion?.tipo === 'multipla_escolha' && (
                  <MultiplaEscolhaForm
                    question={currentQuestion}
                    onChange={(updated) => {
                      setCurrentQuestion(updated);
                      setErrorMessage(null);
                    }}
                  />
                )}

                {errorMessage && currentQuestion?.tipo !== 'formalizacao' && currentQuestion?.tipo !== 'formalizacao_argumento' && (
                  <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-xs font-medium">
                    {errorMessage}
                  </div>
                )}
              </div>

              {/* Preview Tab Panel */}
              <div className={activeTab === 'preview' ? 'min-h-[350px]' : 'hidden'}>
                {currentQuestion && <QuestionPreview question={currentQuestion} />}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface flex items-center justify-between gap-3 shrink-0">
          <div>
            {selectedType && currentQuestion && (
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-text-muted hover:text-white transition-colors select-none">
                <input
                  type="checkbox"
                  checked={!currentQuestion.oculta}
                  onChange={(e) => {
                    setCurrentQuestion({
                      ...currentQuestion,
                      oculta: !e.target.checked,
                    });
                  }}
                  className="rounded border-border-subtle text-primary focus:ring-primary h-4 w-4 bg-base cursor-pointer"
                />
                <span>Visível para os alunos</span>
              </label>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            {selectedType && (
              <Button type="button" variant="primary" onClick={handleSave}>
                Salvar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
