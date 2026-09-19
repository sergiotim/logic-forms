import React, { useState } from 'react';
import { Question } from '@/types';
import { QuestionCard } from './QuestionCard';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface QuestionListProps {
  questoes: Question[];
  onAddQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onToggleQuestionVisibility?: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  onReorderQuestions: (oldIndex: number, newIndex: number) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questoes,
  onAddQuestion,
  onEditQuestion,
  onToggleQuestionVisibility,
  onDeleteQuestion,
  onReorderQuestions,
}) => {
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questoes.findIndex((q) => q.id === active.id);
      const newIndex = questoes.findIndex((q) => q.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderQuestions(oldIndex, newIndex);
      }
    }
  };

  const questionToDelete = questoes.find((q) => q.id === deletingQuestionId);

  const confirmDelete = () => {
    if (deletingQuestionId) {
      onDeleteQuestion(deletingQuestionId);
      setDeletingQuestionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">
          Questões da Fase ({questoes.length})
        </h3>
        {questoes.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={onAddQuestion}
            className="text-xs px-3 py-1.5 flex items-center gap-1.5 text-primary border-primary/40 hover:bg-primary/10"
          >
            <Plus size={16} /> Nova Questão
          </Button>
        )}
      </div>

      {questoes.length === 0 ? (
        <div className="bg-surface border border-dashed border-border-subtle rounded-xl p-8 text-center">
          <p className="text-text-muted text-sm mb-4">Esta fase ainda não possui questões.</p>
          <Button type="button" variant="primary" onClick={onAddQuestion}>
            <Plus size={16} className="mr-1.5 inline" /> Nova Questão
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement, restrictToVerticalAxis]}
        >
          <SortableContext
            items={questoes.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {questoes.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={idx}
                  onEdit={onEditQuestion}
                  onToggleVisibility={
                    onToggleQuestionVisibility
                      ? () => onToggleQuestionVisibility(q)
                      : undefined
                  }
                  onDelete={(id) => setDeletingQuestionId(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal de confirmação de exclusão */}
      {deletingQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border-subtle p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-2">Excluir questão</h3>
            <p className="text-text-muted text-sm mb-6">
              Tem certeza que deseja excluir esta questão?
              {questionToDelete?.enunciado && (
                <span className="block mt-2 font-mono text-xs text-text-main bg-base p-2 rounded border border-border-subtle truncate">
                  &ldquo;{questionToDelete.enunciado}&rdquo;
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingQuestionId(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={confirmDelete}
                className="bg-error hover:bg-error/90 text-white"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
