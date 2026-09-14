'use client';
// Modo Estudo - Plataforma Educacional Lógica Dinâmica (Teste de Permissão OK)
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Feedback } from '@/components/ui/Feedback';
import { Diagramacao } from '@/components/questions/Diagramacao';
import { TabelaVerdade } from '@/components/questions/TabelaVerdade';
import { Formalizacao } from '@/components/questions/Formalizacao';
import { DiagramacaoQuestion, FormalizacaoQuestion, TabelaVerdadeQuestion, Phase } from '@/types';
import { loadEditorState } from '@/lib/storage';
import { fetchPhasesApi, fetchUserSubmissionsApi, saveUserSubmissionApi } from '@/lib/api';
import { ICON_MAP } from '@/lib/icons';
import { validateFormalizacaoAnswer } from '@/lib/formalizacao';
import { CheckCircle2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ProfileMenu } from '@/components/ui/ProfileMenu';

type ViewState = 'lobby' | 'playing' | 'phase_finished';

interface PhaseCardProps {
  fase: Phase;
  index: number;
  completedCount: number;
  isCompleted: boolean;
  startPhase: (id: string) => void;
}

function PhaseCard({ fase, index, completedCount, isCompleted, startPhase }: PhaseCardProps) {
  const Icon = ICON_MAP[fase.icone] || ICON_MAP.Network;
  const hasQuestions = fase.questoes.length > 0;

  return (
    <div
      data-testid="phase-card"
      className="bg-surface border border-border-subtle rounded-xl p-6 shadow-lg flex flex-col hover:border-primary/50 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300"
    >
      <div className="mb-4 text-primary transition-transform duration-300 group-hover:scale-110">
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">
        Fase {index + 1}: {fase.titulo}
      </h3>
      <div className="flex-1 text-sm text-text-muted mb-6">
        {isCompleted ? (
          <span className="text-success font-semibold flex items-center gap-1">
            <CheckCircle2 size={16} /> Concluído
          </span>
        ) : (
          <span>{completedCount}/{fase.questoes.length} concluídas</span>
        )}
      </div>
      {hasQuestions ? (
        <Button
          variant={isCompleted ? 'outline' : 'primary'}
          onClick={() => startPhase(fase.id)}
          className="w-full"
        >
          {isCompleted ? 'Refazer' : 'Iniciar'}
        </Button>
      ) : (
        <Button variant="disabled" disabled className="w-full">
          Sem questões
        </Button>
      )}
    </div>
  );
}

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewState>('lobby');
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [completedQuestionIds, setCompletedQuestionIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // States for answers
  const [diagramacaoAnswer, setDiagramacaoAnswer] = useState<Record<string, string>>({});
  const [tabelaAnswer, setTabelaAnswer] = useState<Record<string, string>>({});
  const [formalizacaoAnswer, setFormalizacaoAnswer] = useState<string>('');

  // Feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [shake, setShake] = useState(false);
  const [glow, setGlow] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    // 1. Carrega local imediatamente para renderização ágil
    const state = loadEditorState();
    setPhases(state.phases);
    setIsLoaded(true);

    // 2. Sincroniza fases atualizadas do Neon PostgreSQL
    fetchPhasesApi()
      .then((dbPhases) => {
        setPhases(dbPhases);
      })
      .catch((err) => {
        console.warn('Sincronização com o banco falhou, usando cache local:', err.message);
      });

    // 3. Sincroniza submissões salvas do aluno logado
    fetchUserSubmissionsApi()
      .then((subs) => {
        const correctIds = new Set(
          subs.filter((s) => s.isCorrect).map((s) => s.questionId),
        );
        setCompletedQuestionIds(correctIds);
      })
      .catch((err) => {
        console.warn('Sincronização de submissões falhou:', err.message);
      });
  }, []);

  const activePhaseData = phases.find((f) => f.id === activePhase);
  const question = activePhaseData?.questoes[currentIndex];

  useEffect(() => {
    setFeedback(null);
    setIsValidated(false);
    setGlow(false);

    if (question?.tipo === 'tabela_verdade') {
      setTabelaAnswer({});
    } else if (question?.tipo === 'diagramacao') {
      setDiagramacaoAnswer({});
    } else if (question?.tipo === 'formalizacao') {
      setFormalizacaoAnswer('');
    }
  }, [currentIndex, question]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const triggerGlow = () => {
    setGlow(true);
  };

  const handleValidate = () => {
    if (!question) return;
    let isCorrect = false;
    let missingData = false;

    if (question.tipo === 'formalizacao') {
      const q = question as FormalizacaoQuestion;
      const cleanUser = formalizacaoAnswer.replace(/\s+/g, '');

      if (cleanUser === '') {
        missingData = true;
      } else {
        const result = validateFormalizacaoAnswer(formalizacaoAnswer, q);
        isCorrect = result.isValid;
      }
    } else if (question.tipo === 'diagramacao') {
      const q = question as DiagramacaoQuestion;
      const keys = Object.keys(q.resposta_esperada);
      missingData = keys.some((k) => !diagramacaoAnswer[k]);

      if (!missingData) {
        isCorrect = keys.every((k) => diagramacaoAnswer[k] === q.resposta_esperada[k]);
      }
    } else if (question.tipo === 'tabela_verdade') {
      const q = question as TabelaVerdadeQuestion;
      const isConnective = (col: string) => /[∧∨~¬→↔&|^()]/.test(col.trim()) || col.trim().length > 2;

      const connectiveIndices = q.variaveis
        .map((col, idx) => ({ col, idx }))
        .filter(({ col }) => isConnective(col));

      let allFilled = true;
      let allCorrect = true;

      for (let r = 0; r < q.linhas.length; r++) {
        // Valida cada conectivo intermediário
        for (const { col, idx } of connectiveIndices) {
          const isRevealed = !!q.celulas_reveladas?.[`${r}_${col}`];
          if (isRevealed) continue;

          const userVal = tabelaAnswer[`${r}_${col}`];
          const expectedVal = q.linhas[r].valores[idx];
          if (!userVal) {
            allFilled = false;
          } else if (userVal !== expectedVal) {
            allCorrect = false;
          }
        }

        // Valida a coluna final
        const isFinalRevealed = !!q.celulas_reveladas?.[`${r}_final`];
        if (!isFinalRevealed) {
          const finalUserVal = tabelaAnswer[`${r}_final`];
          const finalExpectedVal = q.resposta_esperada[r];
          if (!finalUserVal) {
            allFilled = false;
          } else if (finalUserVal !== finalExpectedVal) {
            allCorrect = false;
          }
        }
      }

      missingData = !allFilled;
      if (!missingData) {
        isCorrect = allCorrect;
      }
    }

    if (missingData) {
      setFeedback({ type: 'warning', message: 'Preencha todos os campos antes de validar.' });
      triggerShake();
    } else if (isCorrect) {
      setFeedback({ type: 'success', message: 'Correto! Muito bem.' });
      triggerGlow();
      setIsValidated(true);

      if (question) {
        setCompletedQuestionIds((prev) => {
          const next = new Set(prev);
          next.add(question.id);
          return next;
        });

        let rawAnswer: unknown = null;
        if (question.tipo === 'formalizacao') rawAnswer = formalizacaoAnswer;
        else if (question.tipo === 'diagramacao') rawAnswer = diagramacaoAnswer;
        else if (question.tipo === 'tabela_verdade') rawAnswer = tabelaAnswer;

        saveUserSubmissionApi(question.id, true, rawAnswer).catch((err: unknown) => {
          console.warn('Erro ao salvar submissão no banco:', err instanceof Error ? err.message : err);
        });
      }
    } else {
      setFeedback({ type: 'error', message: 'Resposta incorreta. Tente novamente.' });
      triggerShake();
    }
  };

  const startPhase = (id: string) => {
    setActivePhase(id);
    setCurrentIndex(0);
    setDiagramacaoAnswer({});
    setTabelaAnswer({});
    setFormalizacaoAnswer('');
    setCurrentView('playing');
  };

  const handleNext = () => {
    if (!activePhaseData) return;
    if (currentIndex + 1 < activePhaseData.questoes.length) {
      setCurrentIndex((curr) => curr + 1);
    } else {
      setCurrentView('phase_finished');
    }
  };

  const returnToLobby = () => {
    setActivePhase(null);
    setCurrentView('lobby');
  };

  const quitPhase = () => {
    setShowExitModal(false);
    setActivePhase(null);
    setCurrentView('lobby');
  };

  const activePhaseVisualIndex = phases.findIndex((f) => f.id === activePhase) + 1;

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <nav className="w-full bg-surface/80 backdrop-blur-md border-b border-border-subtle py-4 px-4 md:px-6 flex justify-between items-center shrink-0 gap-4 sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
          {currentView === 'playing' ? (
            <button
              onClick={() => setShowExitModal(true)}
              className="text-text-muted hover:text-white transition-colors shrink-0"
              aria-label="Fechar"
            >
              <X size={24} />
            </button>
          ) : (
            <svg
              className="w-6 h-6 text-primary shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          )}
          <span className={currentView === 'playing' ? 'hidden md:inline' : 'inline'}>
            Lógica<span className="text-primary">Dinâmica</span>
          </span>
        </div>

        {currentView === 'playing' && activePhaseData && (
          <div className="text-xs sm:text-sm font-mono text-text-muted bg-base px-3 py-1.5 rounded-full border border-border-subtle whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] sm:max-w-none">
            Fase {activePhaseVisualIndex}: Questão {currentIndex + 1}/{activePhaseData.questoes.length}
          </div>
        )}

        {/* Ações da Navbar */}
        {currentView === 'lobby' && (
          <div className="flex items-center gap-3">
            <ProfileMenu />
          </div>
        )}
      </nav>

      <main
        className={`flex-1 flex justify-center items-start ${
          currentView === 'playing'
            ? 'overflow-hidden md:overflow-y-auto md:overflow-x-hidden p-0 md:p-6 md:pt-12'
            : 'overflow-y-auto overflow-x-hidden p-4 md:p-6 pt-6 md:pt-12'
        }`}
      >
        <div className={`w-full max-w-3xl ${currentView === 'playing' ? 'h-[100dvh] md:h-auto flex flex-col' : ''}`}>
          {currentView === 'lobby' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Treinamento Dinâmico</h2>
                <p className="text-text-muted">Escolha uma fase para treinar suas habilidades.</p>
              </div>

              {phases.length === 0 ? (
                <div className="bg-surface border border-border-subtle rounded-xl p-8 text-center">
                  <p className="text-text-muted">Nenhuma fase disponível. Acesse o Editor para criar conteúdo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {phases.map((fase, index) => {
                    const completedCount = fase.questoes.filter((q) =>
                      completedQuestionIds.has(q.id),
                    ).length;
                    const isCompleted =
                      fase.questoes.length > 0 && completedCount === fase.questoes.length;

                    return (
                      <PhaseCard
                        key={fase.id}
                        fase={fase}
                        index={index}
                        completedCount={completedCount}
                        isCompleted={isCompleted}
                        startPhase={startPhase}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentView === 'phase_finished' && (
            <div className="bg-surface border border-border-subtle rounded-xl p-8 shadow-2xl transition-all duration-300 text-center py-12 animate-in fade-in zoom-in-95">
              <div className="flex justify-center mb-6">
                <CheckCircle2 size={64} className="text-success drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 font-sans">Fase Concluída!</h2>
              <p className="text-text-muted max-w-md mx-auto mb-8 font-sans">
                Excelente trabalho! Você finalizou todos os exercícios desta fase.
              </p>
              <Button onClick={returnToLobby}>Voltar ao Lobby</Button>
            </div>
          )}

          {currentView === 'playing' && question && (
            <>
              <div
                className={`flex-1 md:flex-none flex flex-col overflow-hidden md:overflow-visible bg-base md:bg-surface md:border md:border-border-subtle md:rounded-xl md:p-8 md:shadow-2xl transition-all duration-300 ${
                  shake ? 'animate-shake border-error' : ''
                } ${glow ? 'success-glow border-success' : ''}`}
              >
                <div className="p-4 md:p-0 shrink-0 mb-2 md:mb-6">
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 uppercase">
                    {question.tipo.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-text-muted ml-2">{question.topico}</span>
                  <div className="text-xl md:text-2xl font-semibold text-white mt-3 font-sans leading-tight flex flex-col gap-4">
                    <ReactMarkdown>{question.enunciado}</ReactMarkdown>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto md:overflow-visible p-4 pt-0 md:p-0">
                  {question.tipo === 'diagramacao' && (
                    <Diagramacao
                      question={question as DiagramacaoQuestion}
                      userAnswer={diagramacaoAnswer}
                      onChange={(id, val) => setDiagramacaoAnswer((prev) => ({ ...prev, [id]: val }))}
                    />
                  )}
                  {question.tipo === 'tabela_verdade' && (
                    <TabelaVerdade
                      question={question as TabelaVerdadeQuestion}
                      userAnswer={tabelaAnswer}
                      onChange={(rowIdx, val, colKey = 'final') =>
                        setTabelaAnswer((prev) => ({
                          ...prev,
                          [`${rowIdx}_${colKey}`]: val,
                        }))
                      }
                    />
                  )}
                  {question.tipo === 'formalizacao' && (
                    <Formalizacao
                      question={question as FormalizacaoQuestion}
                      userAnswer={formalizacaoAnswer}
                      onChange={setFormalizacaoAnswer}
                    />
                  )}
                </div>
              </div>

              <div className="shrink-0 p-4 bg-surface border-t border-border-subtle md:bg-transparent md:border-none md:p-0 md:mt-6 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] md:shadow-none">
                <div className="w-full md:w-auto text-center md:text-left">
                  <Feedback type={feedback?.type || null} message={feedback?.message || ''} />
                </div>
                <div className="w-full md:w-auto flex gap-4 ml-auto justify-end">
                  {!isValidated ? (
                    <Button onClick={handleValidate} className="w-full md:w-auto">
                      Validar Resposta
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleNext} className="w-full md:w-auto">
                      Próxima Questão
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 12h14m-7-7l7 7-7 7"></path>
                      </svg>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal de Saída */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border-subtle p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-white mb-2">Tem certeza de que deseja sair?</h3>
            <p className="text-text-muted mb-6">O progresso desta fase será perdido.</p>
            <div className="flex flex-col gap-3 md:gap-4 justify-end">
              <Button onClick={() => setShowExitModal(false)} className="w-full md:flex-1">
                Continuar jogando
              </Button>
              <Button
                variant="outline"
                onClick={quitPhase}
                className="w-full md:flex-1 border-error text-error hover:bg-error/10 hover:text-error hover:border-error"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
