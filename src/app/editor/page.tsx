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
import { ArrowLeft, Settings, X, Loader2, CheckCircle2, BarChart3 } from 'lucide-react';
import { fetchPhasesApi, savePhasesApi } from '@/lib/api';

export default function EditorPage() {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.screen.width > 0 && Math.min(window.screen.width, window.screen.height) < 768;
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    // Checagem de tela para bloquear smartphones fisicamente
    if (typeof window !== 'undefined' && window.screen.width > 0) {
      const isMobile = Math.min(window.screen.width, window.screen.height) < 768;
      setIsMobileDevice(isMobile);
    }
  }, []);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    // 1. Inicia imediatamente com o estado local para renderização instantânea
    const local = loadEditorState();
    setEditorState(local);
    if (local.phases.length > 0) {
      setSelectedPhaseId(local.phases[0].id);
    }
    setIsLoaded(true);

    // 2. Busca os dados reais e atualizados do Neon PostgreSQL
    fetchPhasesApi()
      .then((dbPhases) => {
        const stateFromDb: EditorState = {
          version: local.version || 1,
          updatedAt: new Date().toISOString(),
          phases: dbPhases,
        };
        setEditorState(stateFromDb);
        saveEditorState(stateFromDb);
        if (dbPhases.length > 0) {
          setSelectedPhaseId((prev) =>
            prev && dbPhases.some((p) => p.id === prev) ? prev : dbPhases[0].id,
          );
        } else {
          setSelectedPhaseId(null);
        }
      })
      .catch((err) => {
        console.warn('Sincronização com o banco falhou, usando cache local:', err.message);
      });
  }, []);

  const persistState = async (updatedState: EditorState) => {
    setEditorState(updatedState);
    saveEditorState(updatedState);
    try {
      setIsSaving(true);
      await savePhasesApi(updatedState.phases);
    } catch (err: unknown) {
      console.error('Erro ao persistir no banco:', err);
      const msg = err instanceof Error ? err.message : '';
      setFeedback({
        type: 'warning',
        message: 'Alteração salva localmente, mas houve erro ao sincronizar com o banco: ' + msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePhase = async (titulo: string, icone: LucideIconName) => {
    if (!editorState) return;
    const newPhase = createPhase(titulo, icone);
    const updatedState: EditorState = {
      ...editorState,
      phases: [...editorState.phases, newPhase],
    };
    setSelectedPhaseId(newPhase.id);
    await persistState(updatedState);
  };

  const handleUpdatePhase = async (phase: Phase) => {
    if (!editorState) return;
    const updatedState = updatePhase(editorState, phase);
    await persistState(updatedState);
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!editorState) return;
    if (editorState.phases.length <= 1) return;

    const updatedState = deletePhase(editorState, phaseId);
    if (selectedPhaseId === phaseId) {
      setSelectedPhaseId(updatedState.phases.length > 0 ? updatedState.phases[0].id : null);
    }
    await persistState(updatedState);
  };

  const handleSaveQuestion = async (phaseId: string, question: Question) => {
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

    await persistState(updatedState);
  };

  const handleDeleteQuestion = async (phaseId: string, questionId: string) => {
    if (!editorState) return;
    const updatedState = deleteQuestion(editorState, phaseId, questionId);
    await persistState(updatedState);
  };

  const handleReorderPhases = async (oldIndex: number, newIndex: number) => {
    if (!editorState) return;
    const updatedState = reorderPhases(editorState, oldIndex, newIndex);
    await persistState(updatedState);
  };

  const handleReorderQuestions = async (phaseId: string, oldIndex: number, newIndex: number) => {
    if (!editorState) return;
    const updatedState = reorderQuestions(editorState, phaseId, oldIndex, newIndex);
    await persistState(updatedState);
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

  const handleExportAll = () => {
    if (!editorState || editorState.phases.length === 0) return;
    const pkg = exportPackage(editorState);
    const json = JSON.stringify(pkg, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `logica-dinamica-todas-fases-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({
      type: 'success',
      message: `Todas as ${editorState.phases.length} fases foram exportadas em um único pacote com sucesso!`,
    });
  };

  const handleImportPackage = async (packageData: unknown) => {
    if (!editorState) return;
    try {
      const result = importPackage(editorState, packageData);
      const lastImported = result.state.phases[result.state.phases.length - 1];
      if (lastImported) {
        setSelectedPhaseId(lastImported.id);
      }
      await persistState(result.state);
      setFeedback({
        type: 'success',
        message: `${result.importedPhasesCount} fase(s) e ${result.importedQuestionsCount} questão(ões) importada(s) e salvas no banco com sucesso!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao importar pacote.';
      setFeedback({
        type: 'error',
        message: msg,
      });
    }
  };

  if (isMobileDevice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base p-6 text-center">
        <div className="bg-surface border border-border-subtle rounded-xl p-8 max-w-sm">
          <h2 className="text-xl font-bold text-error mb-4">Acesso Bloqueado</h2>
          <p className="text-text-muted mb-6">O Modo Editor é uma ferramenta administrativa que não suporta smartphones.</p>
          <p className="text-text-muted text-sm mb-6">Por favor, acesse via Tablet ou Computador.</p>
          <Link href="/" className="inline-flex items-center justify-center bg-primary text-white font-bold py-2 px-4 rounded-lg w-full transition-colors hover:bg-primary/90">
            Voltar ao Modo Estudo
          </Link>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white leading-tight">Editor de Conteúdo</h1>
              {isSaving ? (
                <span className="flex items-center gap-1 text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  <Loader2 size={11} className="animate-spin" /> Salvando...
                </span>
              ) : (
                <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                  <CheckCircle2 size={11} /> Sincronizado
                </span>
              )}
            </div>
            <span className="text-xs text-text-muted hidden sm:inline">
              Gerencie fases, formule questões e acompanhe o preview em tempo real
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/editor/analytics"
            className="text-sm font-medium text-text-muted hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg bg-surface hover:bg-surface/80 border border-border-subtle transition-colors"
          >
            <BarChart3 size={16} className="text-primary" /> Análises
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-text-muted hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-base transition-colors border border-transparent hover:border-border-subtle"
          >
            <ArrowLeft size={16} /> Voltar ao Modo Estudo
          </Link>
        </div>
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
        onExportAll={handleExportAll}
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
