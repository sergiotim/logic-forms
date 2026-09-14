import React, { useState } from 'react';
import { Phase, Question, LucideIconName } from '@/types';
import { PhaseSidebar } from './PhaseSidebar';
import { PhaseEditor } from './PhaseEditor';
import { QuestionFormModal } from './QuestionFormModal';

interface EditorLayoutProps {
  phases: Phase[];
  selectedPhaseId: string | null;
  onSelectPhase: (phaseId: string) => void;
  onCreatePhase: (titulo: string, icone: LucideIconName) => void;
  onUpdatePhase: (phase: Phase) => void;
  onDeletePhase: (phaseId: string) => void;
  onSaveQuestion: (phaseId: string, question: Question) => void;
  onDeleteQuestion: (phaseId: string, questionId: string) => void;
  onReorderPhases: (oldIndex: number, newIndex: number) => void;
  onReorderQuestions: (phaseId: string, oldIndex: number, newIndex: number) => void;
  onImportPackage?: (pkg: unknown) => void;
  onExportPhase?: (phaseId: string) => void;
  onExportAll?: () => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  phases,
  selectedPhaseId,
  onSelectPhase,
  onCreatePhase,
  onUpdatePhase,
  onDeletePhase,
  onSaveQuestion,
  onDeleteQuestion,
  onReorderPhases,
  onReorderQuestions,
  onImportPackage,
  onExportPhase,
  onExportAll,
}) => {
  const [modalQuestion, setModalQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) || null;

  const handleOpenNewQuestion = () => {
    setModalQuestion(null);
    setIsModalOpen(true);
  };

  const handleOpenEditQuestion = (question: Question) => {
    setModalQuestion(question);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalQuestion(null);
    setIsModalOpen(false);
  };

  const handleSaveModalQuestion = (question: Question) => {
    if (selectedPhase) {
      onSaveQuestion(selectedPhase.id, question);
    }
    handleCloseModal();
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-65px)] overflow-hidden">
      {/* Sidebar de Fases */}
      <PhaseSidebar
        phases={phases}
        selectedPhaseId={selectedPhaseId}
        onSelectPhase={onSelectPhase}
        onCreatePhase={onCreatePhase}
        onReorderPhases={onReorderPhases}
        onImportPackage={onImportPackage}
        onExportAll={onExportAll}
      />

      {/* Conteúdo Principal do Editor */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-base">
        <div className="max-w-4xl mx-auto">
          {selectedPhase ? (
            <PhaseEditor
              phase={selectedPhase}
              totalPhasesCount={phases.length}
              onUpdatePhase={onUpdatePhase}
              onDeletePhase={onDeletePhase}
              onAddQuestion={handleOpenNewQuestion}
              onEditQuestion={handleOpenEditQuestion}
              onDeleteQuestion={(qId) => onDeleteQuestion(selectedPhase.id, qId)}
              onReorderQuestions={(oldIdx, newIdx) =>
                onReorderQuestions(selectedPhase.id, oldIdx, newIdx)
              }
              onExportPhase={onExportPhase}
            />
          ) : phases.length > 0 ? (
            <div className="text-center py-16 bg-surface border border-border-subtle rounded-xl p-8">
              <h3 className="text-lg font-bold text-white mb-2">Nenhuma fase selecionada</h3>
              <p className="text-text-muted text-sm mb-4">
                Selecione uma fase na barra lateral para visualizar e gerenciar suas questões.
              </p>
            </div>
          ) : (
            <div className="text-center py-16 bg-surface border border-border-subtle rounded-xl p-8">
              <h3 className="text-lg font-bold text-white mb-2">Nenhuma fase configurada</h3>
              <p className="text-text-muted text-sm">
                Utilize o botão &ldquo;Nova Fase&rdquo; na barra lateral para começar a estruturar o conteúdo.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Criação / Edição de Questão */}
      {isModalOpen && (
        <QuestionFormModal
          initialQuestion={modalQuestion}
          onSave={handleSaveModalQuestion}
          onCancel={handleCloseModal}
        />
      )}
    </div>
  );
};

