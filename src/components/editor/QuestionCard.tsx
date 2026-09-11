import React from 'react';
import { Question } from '@/types';
import { Button } from '@/components/ui/Button';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QuestionCardProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const getBadgeLabel = () => {
    switch (question.tipo) {
      case 'diagramacao':
        return 'Diagramação';
      case 'tabela_verdade':
        return 'Tabela-Verdade';
      case 'formalizacao':
        return 'Formalização';
      default:
        return 'Questão';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface border border-border-subtle rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDragging
          ? 'opacity-90 scale-[1.01] shadow-2xl border-primary'
          : 'hover:border-border-subtle/80'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Handle de Drag and Drop */}
        <div
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing p-1 text-text-muted/60 hover:text-white rounded transition-colors shrink-0 pt-1"
          title="Arraste para reordenar a questão"
          aria-label={`Reordenar questão ${index + 1}`}
        >
          <GripVertical size={18} />
        </div>

        <span className="text-text-muted font-mono font-bold text-sm shrink-0 pt-0.5">
          Q{index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              {getBadgeLabel()}
            </span>
            {question.topico && (
              <span className="text-xs font-mono text-text-muted truncate">
                {question.topico}
              </span>
            )}
          </div>
          <p className="text-text-main font-medium text-sm line-clamp-2">
            {question.enunciado || <span className="italic text-text-muted">Sem enunciado</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => onEdit(question)}
          className="text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          <Pencil size={14} /> Editar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onDelete(question.id)}
          className="text-xs px-3 py-1.5 border-border-subtle hover:border-error hover:text-error text-text-muted transition-colors flex items-center gap-1.5"
        >
          <Trash2 size={14} /> Excluir
        </Button>
      </div>
    </div>
  );
};
