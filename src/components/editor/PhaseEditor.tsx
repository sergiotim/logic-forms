import React, { useState, useRef, useEffect } from 'react';
import { Phase, Question, LucideIconName } from '@/types';
import { QuestionList } from './QuestionList';
import { ICON_OPTIONS, ICON_MAP } from '@/lib/icons';
import { Button } from '@/components/ui/Button';
import { Trash2, ChevronDown, DownloadCloud } from 'lucide-react';

interface PhaseEditorProps {
  phase: Phase;
  totalPhasesCount: number;
  onUpdatePhase: (updated: Phase) => void;
  onDeletePhase: (phaseId: string) => void;
  onAddQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  onReorderQuestions: (oldIndex: number, newIndex: number) => void;
  onExportPhase?: (phaseId: string) => void;
}

export const PhaseEditor: React.FC<PhaseEditorProps> = ({
  phase,
  totalPhasesCount,
  onUpdatePhase,
  onDeletePhase,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onReorderQuestions,
  onExportPhase,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

  const CurrentIcon = ICON_MAP[phase.icone] || ICON_MAP.Network;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false);
      }
    }

    if (showIconPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIconPicker]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdatePhase({
      ...phase,
      titulo: e.target.value,
    });
  };

  const handleIconChange = (newIcon: LucideIconName) => {
    onUpdatePhase({
      ...phase,
      icone: newIcon,
    });
  };

  const handleClickDelete = () => {
    if (totalPhasesCount <= 1) {
      setDeleteWarning('Deve existir pelo menos 1 fase. Não é possível excluir.');
      setShowDeleteModal(true);
      return;
    }
    setDeleteWarning(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    onDeletePhase(phase.id);
  };

  return (
    <div className="space-y-6">
      {/* Header Compacto da Fase */}
      <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1 min-w-0">
            {/* Ícone Clicável com Popover */}
            <div className="relative shrink-0" ref={iconPickerRef}>
              <button
                type="button"
                onClick={() => setShowIconPicker((prev) => !prev)}
                className="p-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/20 hover:border-primary/50 transition-colors flex items-center gap-1.5 group cursor-pointer"
                title="Clique para alterar o ícone da fase"
                aria-label="Alterar ícone da fase"
              >
                <CurrentIcon size={24} />
                <ChevronDown
                  size={14}
                  className={`text-text-muted group-hover:text-primary transition-transform duration-200 ${
                    showIconPicker ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showIconPicker && (
                <div className="absolute top-full left-0 mt-2 z-30 bg-surface border border-border-subtle rounded-xl p-3 shadow-2xl w-64 animate-in fade-in zoom-in-95 duration-150">
                  <span className="block text-xs font-semibold text-text-muted uppercase mb-2 px-1">
                    Selecione um Ícone
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ICON_OPTIONS.map((opt) => {
                      const IconComp = ICON_MAP[opt.name];
                      const isSelected = phase.icone === opt.name;
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => {
                            handleIconChange(opt.name);
                            setShowIconPicker(false);
                          }}
                          className={`p-2 rounded-lg flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-base border-border-subtle text-text-muted hover:text-white hover:border-primary/50'
                          }`}
                          title={opt.label}
                        >
                          <IconComp size={18} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <label htmlFor="phase-title" className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Nome da Fase
              </label>
              <input
                id="phase-title"
                type="text"
                value={phase.titulo}
                onChange={handleTitleChange}
                placeholder="Ex: Diagramação de Argumentos"
                className="w-full bg-base border border-border-subtle rounded-lg px-3 py-2 text-white font-bold text-lg focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {onExportPhase && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onExportPhase(phase.id)}
                className="text-xs px-3 py-2 text-text-muted hover:text-white border-border-subtle hover:border-primary/40 flex items-center gap-1.5"
                title="Exportar esta fase em arquivo .json"
                aria-label={`Exportar fase ${phase.titulo}`}
              >
                <DownloadCloud size={15} /> Exportar Fase
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClickDelete}
              className="text-xs px-3 py-2 text-error border-error/30 hover:bg-error/10 hover:border-error flex items-center gap-1.5"
            >
              <Trash2 size={15} /> Excluir Fase
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Questões */}
      <QuestionList
        questoes={phase.questoes}
        onAddQuestion={onAddQuestion}
        onEditQuestion={onEditQuestion}
        onDeleteQuestion={onDeleteQuestion}
        onReorderQuestions={onReorderQuestions}
      />

      {/* Modal de Confirmação de Exclusão da Fase */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border-subtle p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-2">
              {deleteWarning ? 'Atenção' : 'Excluir Fase'}
            </h3>
            <p className="text-text-muted text-sm mb-6">
              {deleteWarning ? (
                deleteWarning
              ) : (
                <>
                  Tem certeza que deseja excluir a fase <strong>&ldquo;{phase.titulo}&rdquo;</strong>?
                  {phase.questoes.length > 0 && (
                    <span className="block mt-2 text-warning">
                      Esta fase contém {phase.questoes.length} questão(ões) que também serão excluídas.
                    </span>
                  )}
                </>
              )}
            </p>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                {deleteWarning ? 'Fechar' : 'Cancelar'}
              </Button>
              {!deleteWarning && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleConfirmDelete}
                  className="bg-error hover:bg-error/90 text-white"
                >
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
