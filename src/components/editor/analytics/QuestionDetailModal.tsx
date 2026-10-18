'use client';

import React from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  Zap,
  Users,
  Target,
  Activity,
} from 'lucide-react';
import type {
  QuestionAnalyticsItem,
  QuestionStudentStatus,
  DifficultyLevel,
} from '@/types';

export interface QuestionDetailModalProps {
  question: QuestionAnalyticsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const DIFFICULTY_BADGE: Record<
  DifficultyLevel,
  { label: string; className: string }
> = {
  facil: {
    label: 'Dificuldade Fácil',
    className: 'bg-success/10 text-success border-success/20',
  },
  moderada: {
    label: 'Dificuldade Moderada',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  dificil: {
    label: 'Dificuldade Alta',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  critica: {
    label: 'Dificuldade Crítica',
    className: 'bg-error/10 text-error border-error/20',
  },
};

const STUDENT_STATUS_BADGE: Record<
  QuestionStudentStatus,
  { label: (errors: number) => string; colorClass: string; icon: React.ReactNode }
> = {
  de_primeira: {
    label: () => 'Acertou de primeira',
    colorClass: 'bg-success/10 text-success border-success/20',
    icon: <CheckCircle2 size={12} />,
  },
  com_dificuldade: {
    label: (errors: number) => `Concluída após ${errors} ${errors === 1 ? 'erro' : 'erros'}`,
    colorClass: 'bg-warning/10 text-warning border-warning/20',
    icon: <AlertCircle size={12} />,
  },
  pendente_com_erros: {
    label: (errors: number) => `Pendente (${errors} ${errors === 1 ? 'erro' : 'erros'})`,
    colorClass: 'bg-error/10 text-error border-error/20',
    icon: <AlertCircle size={12} />,
  },
  nao_iniciada: {
    label: () => 'Não iniciada',
    colorClass: 'bg-neutral-800 text-text-muted border-neutral-700',
    icon: <Clock size={12} />,
  },
};

export function formatSubmittedAnswer(answer: unknown): string {
  if (answer === null || answer === undefined) return '';
  if (typeof answer === 'string') return answer;
  if (Array.isArray(answer)) return answer.join(' | ');
  if (typeof answer === 'object') {
    try {
      const record = answer as Record<string, unknown>;
      const entries = Object.entries(record);
      if (entries.length > 0 && entries.length <= 6) {
        return entries
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
          .join(' • ');
      }
      return JSON.stringify(answer);
    } catch {
      return String(answer);
    }
  }
  return String(answer);
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  question,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !question) return null;

  const diffBadge = DIFFICULTY_BADGE[question.difficultyLevel] || DIFFICULTY_BADGE.facil;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Raio-X da Questão"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-surface border border-border-subtle rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-start justify-between gap-4 bg-base/50">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
                Raio-X da Questão
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-base text-text-muted border border-border-subtle">
                {question.phaseTitle}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-base text-text-muted border border-border-subtle uppercase font-mono">
                {question.topico}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${diffBadge.className}`}
              >
                {diffBadge.label}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
              {question.enunciado}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 text-text-muted hover:text-white rounded-lg hover:bg-surface border border-transparent hover:border-border-subtle transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* 4 KPIs da Questão */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b border-border-subtle/60 bg-base/20 text-xs">
          <div className="p-3.5 bg-surface rounded-xl border border-border-subtle flex items-start justify-between">
            <div>
              <span className="text-text-muted block uppercase font-mono text-[10px]">
                Acerto de 1ª Tentativa
              </span>
              <span className="text-lg font-extrabold text-success mt-1 block font-mono">
                {question.firstTryRate}%
              </span>
              <span className="text-[11px] text-text-muted block mt-0.5">
                {question.firstTryCount} de {question.attemptedCount} que tentaram
              </span>
            </div>
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <Target size={16} />
            </div>
          </div>

          <div className="p-3.5 bg-surface rounded-xl border border-border-subtle flex items-start justify-between">
            <div>
              <span className="text-text-muted block uppercase font-mono text-[10px]">
                Esforço Médio
              </span>
              <span className="text-lg font-extrabold text-primary mt-1 block font-mono">
                {question.avgAttemptsToSuccess} tent.
              </span>
              <span className="text-[11px] text-text-muted block mt-0.5">
                tentativas até acertar ({question.totalErrors} erros)
              </span>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Activity size={16} />
            </div>
          </div>

          <div className="p-3.5 bg-surface rounded-xl border border-border-subtle flex items-start justify-between">
            <div>
              <span className="text-text-muted block uppercase font-mono text-[10px]">
                Alunos Travados
              </span>
              <span className="text-lg font-extrabold text-error mt-1 block font-mono">
                {question.stuckCount}
              </span>
              <span className="text-[11px] text-text-muted block mt-0.5">
                pendentes com erro ({question.stuckRate}%)
              </span>
            </div>
            <div className="p-2 rounded-lg bg-error/10 text-error">
              <Users size={16} />
            </div>
          </div>

          <div className="p-3.5 bg-surface rounded-xl border border-border-subtle flex items-start justify-between">
            <div>
              <span className="text-text-muted block uppercase font-mono text-[10px]">
                Indício de Chute (&lt; 5s)
              </span>
              <span className="text-lg font-extrabold text-warning mt-1 block font-mono">
                {question.rapidGuessCount}
              </span>
              <span className="text-[11px] text-text-muted block mt-0.5">
                estudante(s) em tentativa e erro
              </span>
            </div>
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <Zap size={16} />
            </div>
          </div>
        </div>

        {/* Corpo em 2 Colunas: Top Erros + Desempenho dos Estudantes */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda (5 cols): Respostas Incorretas Mais Frequentes */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle size={16} className="text-warning" />
                Respostas Incorretas Mais Frequentes
              </h3>
              <span className="text-xs text-text-muted font-mono">
                {question.totalErrors} erro(s)
              </span>
            </div>

            {question.topErrors.length === 0 ? (
              <div className="p-6 bg-base border border-border-subtle rounded-xl text-center text-xs text-text-muted">
                Nenhuma resposta incorreta registrada para esta questão até o momento.
              </div>
            ) : (
              <div className="space-y-2.5">
                {question.topErrors.map((err, idx) => {
                  const formatted = formatSubmittedAnswer(err.answer);
                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-base border border-border-subtle rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-error bg-surface px-2.5 py-1 rounded border border-border-subtle truncate max-w-[240px]">
                          {formatted}
                        </span>
                        <span className="font-mono text-xs font-bold text-warning shrink-0">
                          {err.count}x ({err.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-error/70 rounded-full"
                          style={{ width: `${Math.min(100, err.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna Direita (7 cols): Situação dos Estudantes */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Situação dos Estudantes na Questão
              </h3>
              <span className="text-xs text-text-muted">
                Priorizados por necessidade de apoio
              </span>
            </div>

            {question.studentBreakdown.length === 0 ? (
              <div className="p-6 bg-base border border-border-subtle rounded-xl text-center text-xs text-text-muted">
                Nenhum estudante registrado para esta questão.
              </div>
            ) : (
              <div className="space-y-2.5">
                {question.studentBreakdown.map((st) => {
                  const statusCfg =
                    STUDENT_STATUS_BADGE[st.status] || STUDENT_STATUS_BADGE.nao_iniciada;
                  const lastAns = formatSubmittedAnswer(st.ultimaResposta);

                  return (
                    <div
                      key={st.studentId}
                      className="p-3.5 bg-base border border-border-subtle rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {st.name}
                          </span>
                          {st.hasRapidGuess && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-warning/15 text-warning border border-warning/30">
                              <Zap size={10} />
                              Chute rápido
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {st.errosCount} erro(s) em {st.tentativasTotal} tentativa(s)
                          {lastAns ? ` • Última: ${lastAns}` : ''}
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border shrink-0 self-start sm:self-center ${statusCfg.colorClass}`}
                      >
                        {statusCfg.icon}
                        <span>{statusCfg.label(st.errosCount)}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle flex justify-end bg-base/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface hover:bg-surface/80 text-white text-sm font-medium rounded-lg border border-border-subtle transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

