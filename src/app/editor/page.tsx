'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  loadEditorState,
  saveEditorState,
  createPhase,
  deletePhase,
  updatePhase,
  updateQuestion,
  deleteQuestion,
  reorderPhases,
  reorderQuestions,
} from '@/lib/storage';
import { exportPackage, importPackage } from '@/lib/exportImport';
import { EditorState, Phase, Question, LucideIconName } from '@/types';
import { EditorLayout } from '@/components/editor/EditorLayout';
import { Feedback } from '@/components/ui/Feedback';
import { ArrowLeft, Settings, X } from 'lucide-react';

export default function EditorPage() {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    const state = loadEditorState();
    setEditorState(state);
    if (state.phases.length > 0) {
      setSelectedPhaseId(state.phases[0].id);
    }
    setIsLoaded(true);
  }, []);

  const handleCreatePhase = (titulo: string, icone: LucideIconName) => {
    if (!editorState) return;
    const newPhase = createPhase(titulo, icone);
    const updatedState: EditorState = {
      ...editorState,
      phases: [...editorState.phases, newPhase],
    };
    setEditorState(updatedState);
    saveEditorState(updatedState);
    setSelectedPhaseId(newPhase.id);
  };

  const handleUpdatePhase = (phase: Phase) => {
    if (!editorState) return;
    const updatedState = updatePhase(editorState, phase);
    setEditorState(updatedState);
    saveEditorState(updatedState);
  };

  const handleDeletePhase = (phaseId: string) => {
    if (!editorState) return;
    if (editorState.phases.length <= 1) return;

    const updatedState = deletePhase(editorState, phaseId);
    setEditorState(updatedState);
    saveEditorState(updatedState);

    if (selectedPhaseId === phaseId) {
      setSelectedPhaseId(updatedState.phases.length > 0 ? updatedState.phases[0].id : null);
    }
  };

  const handleSaveQuestion = (phaseId: string, question: Question) => {
    if (!editorState) return;
    const phase = editorState.phases.find((p) => p.id === phaseId);
    if (!phase) return;

    const exists = phase.questoes.some((q) => q.id === question.id);
    let updatedState: EditorState;

    if (exists) {
      updatedState = updateQuestion(editorState, phaseId, question);
    } else {
      updatedState = {
        ...editorState,
        phases: editorState.phases.map((p) =>
          p.id === phaseId ? { ...p, questoes: [...p.questoes, question] } : p,
        ),
      };
    }

    setEditorState(updatedState);
    saveEditorState(updatedState);
  };

  const handleDeleteQuestion = (phaseId: string, questionId: string) => {
    if (!editorState) return;
    const updatedState = deleteQuestion(editorState, phaseId, questionId);
    setEditorState(updatedState);
    saveEditorState(updatedState);
  };

  const handleReorderPhases = (oldIndex: number, newIndex: number) => {
    if (!editorState) return;
    const updatedState = reorderPhases(editorState, oldIndex, newIndex);
    setEditorState(updatedState);
    saveEditorState(updatedState);
  };

  const handleReorderQuestions = (phaseId: string, oldIndex: number, newIndex: number) => {
    if (!editorState) return;
    const updatedState = reorderQuestions(editorState, phaseId, oldIndex, newIndex);
    setEditorState(updatedState);
    saveEditorState(updatedState);
  };

  const handleExportPhase = (phaseId: string) => {
    if (!editorState) return;
    const phase = editorState.phases.find((p) => p.id === phaseId);
    const pkg = exportPackage(editorState, [phaseId]);
    const json = JSON.stringify(pkg, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (phase?.titulo || 'fase')
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_');
    a.download = `fase-${safeTitle}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({
      type: 'success',
      message: `Fase "${phase?.titulo || ''}" exportada com sucesso!`,
    });
  };

  const handleImportPackage = (packageData: unknown) => {
    if (!editorState) return;
    try {
      const result = importPackage(editorState, packageData);
      setEditorState(result.state);
      saveEditorState(result.state);
      const lastImported = result.state.phases[result.state.phases.length - 1];
      if (lastImported) {
        setSelectedPhaseId(lastImported.id);
      }
      setFeedback({
        type: 'success',
        message: `${result.importedPhasesCount} fase(s) e ${result.importedQuestionsCount} questão(ões) importada(s) com sucesso!`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erro ao importar pacote.',
      });
    }
  };

  if (!isLoaded || !editorState) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-base text-text-main font-sans">
      {/* Header do Editor */}
      <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border-subtle px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Settings size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">Editor de Conteúdo</h1>
            <span className="text-xs text-text-muted hidden sm:inline">
              Gerencie fases, formule questões e acompanhe o preview em tempo real
            </span>
          </div>
        </div>

        <Link
          href="/"
          className="text-sm font-medium text-text-muted hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-base transition-colors border border-transparent hover:border-border-subtle"
        >
          <ArrowLeft size={16} /> Voltar ao Modo Estudo
        </Link>
      </header>

      {/* Corpo do Editor */}
      <EditorLayout
        phases={editorState.phases}
        selectedPhaseId={selectedPhaseId}
        onSelectPhase={setSelectedPhaseId}
        onCreatePhase={handleCreatePhase}
        onUpdatePhase={handleUpdatePhase}
        onDeletePhase={handleDeletePhase}
        onSaveQuestion={handleSaveQuestion}
        onDeleteQuestion={handleDeleteQuestion}
        onReorderPhases={handleReorderPhases}
        onReorderQuestions={handleReorderQuestions}
        onImportPackage={handleImportPackage}
        onExportPhase={handleExportPhase}
      />

      {/* Toast flutuante de Feedback */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface border border-border-subtle p-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Feedback type={feedback.type} message={feedback.message} />
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-text-muted hover:text-white text-xs p-1 rounded transition-colors"
            aria-label="Fechar notificação"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
