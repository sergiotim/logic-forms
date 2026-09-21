'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import type {
  StudentMetricItem,
  StudentQuestionDetail,
  QuestionStudentStatus,
} from '@/types';

export interface StudentDetailModalProps {
  student: StudentMetricItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<
  QuestionStudentStatus,
  { label: (errors: number) => string; colorClass: string; icon: React.ReactNode }
> = {
  de_primeira: {
    label: () => 'Acertou de primeira',
    colorClass: 'bg-success/10 text-success border-success/20',
    icon: <CheckCircle2 size={13} />,
  },
  com_dificuldade: {
    label: (errors: number) => `Concluída após ${errors} ${errors === 1 ? 'erro' : 'erros'}`,
    colorClass: 'bg-warning/10 text-warning border-warning/20',
    icon: <AlertCircle size={13} />,
  },
  pendente_com_erros: {
    label: (errors: number) => `Pendente (${errors} ${errors === 1 ? 'erro' : 'erros'})`,
    colorClass: 'bg-error/10 text-error border-error/20',
    icon: <AlertCircle size={13} />,
  },
  nao_iniciada: {
    label: () => 'Não iniciada',
    colorClass: 'bg-neutral-800 text-text-muted border-neutral-700',
    icon: <Clock size={13} />,
  },
};

function formatAnswer(answer: unknown): string {
  if (answer === null || answer === undefined) return '';
  if (typeof answer === 'string') return answer;
  if (Array.isArray(answer)) return answer.join(' | ');
  if (typeof answer === 'object') {
    try {
      return JSON.stringify(answer);
    } catch {
      return String(answer);
    }
  }
  return String(answer);
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  if (!isOpen || !student) return null;

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: prev[phaseId] === false ? true : false,
    }));
  };

  const isPhaseExpanded = (phaseId: string) => expandedPhases[phaseId] !== false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-student-name"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-surface border border-border-subtle rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-start justify-between bg-base/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {student.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.image}
                  alt={student.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={24} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="modal-student-name"
                  className="text-xl font-bold text-white tracking-tight"
                >
                  {student.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
                  Raio-X Acadêmico
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">{student.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 text-text-muted hover:text-white rounded-lg hover:bg-surface border border-transparent hover:border-border-subtle transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de KPIs Resumo do Aluno */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border-b border-border-subtle/60 bg-base/20 text-xs">
          <div className="p-3 bg-surface rounded-xl border border-border-subtle">
            <span className="text-text-muted block uppercase font-mono text-[10px]">Progresso Global</span>
            <span className="text-base font-bold text-white mt-1 block">
              {student.porcentagemConcluida}% concluído
            </span>
            <span className="text-[11px] text-text-muted block mt-0.5">
              {student.porcentagemRestante}% restante
            </span>
          </div>

          <div className="p-3 bg-surface rounded-xl border border-border-subtle">
            <span className="text-text-muted block uppercase font-mono text-[10px]">Questões Resolvidas</span>
            <span className="text-base font-bold text-success mt-1 block">
              {student.questoesConcluidas} / {student.totalQuestoesAtivas}
            </span>
            <span className="text-[11px] text-text-muted block mt-0.5">concluídas</span>
          </div>

          <div className="p-3 bg-surface rounded-xl border border-border-subtle">
            <span className="text-text-muted block uppercase font-mono text-[10px]">Total de Erros</span>
            <span className="text-base font-bold text-error mt-1 block">
              {student.totalErros}
            </span>
            <span className="text-[11px] text-text-muted block mt-0.5">repetições com falha</span>
          </div>

          <div className="p-3 bg-surface rounded-xl border border-border-subtle">
            <span className="text-text-muted block uppercase font-mono text-[10px]">Acertos de 1ª</span>
            <span className="text-base font-bold text-primary mt-1 block">
              {student.acertosDePrimeira}
            </span>
            <span className="text-[11px] text-text-muted block mt-0.5">sem errar antes</span>
          </div>
        </div>

        {/* Conteúdo com Acordeão por Fases */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {student.fases.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm bg-base border border-border-subtle rounded-xl p-6">
              Nenhuma fase disponível ou o estudante ainda não possui histórico de tentativas registradas.
            </div>
          ) : (
            student.fases.map((fase) => {
              const expanded = isPhaseExpanded(fase.phaseId);
              return (
                <div
                  key={fase.phaseId}
                  className="bg-base border border-border-subtle rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Header do Acordeão */}
                  <button
                    type="button"
                    onClick={() => togglePhase(fase.phaseId)}
                    className="w-full p-4 flex items-center justify-between hover:bg-surface/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-sm text-white">{fase.titulo}</h3>
                      <span className="text-xs font-mono text-text-muted bg-surface px-2.5 py-0.5 rounded-full border border-border-subtle">
                        {fase.questoesConcluidas}/{fase.totalQuestoes} concluídas
                      </span>
                    </div>

                    <div className="text-text-muted">
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {/* Lista de Questões da Fase */}
                  {expanded && (
                    <div className="p-4 pt-0 space-y-3 border-t border-border-subtle/50 mt-2">
                      {fase.questoes.map((q: StudentQuestionDetail, idx: number) => {
                        const config = STATUS_CONFIG[q.status] || STATUS_CONFIG.nao_iniciada;
                        const formattedAnswer = formatAnswer(q.ultimaResposta);

                        return (
                          <div
                            key={q.questionId}
                            className="p-3.5 bg-surface rounded-lg border border-border-subtle space-y-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-text-muted">#{idx + 1}</span>
                                <span className="text-xs font-medium text-white">{q.enunciado}</span>
                              </div>

                              {/* Status Badge */}
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border shrink-0 ${config.colorClass}`}
                              >
                                {config.icon}
                                <span>{config.label(q.errosCount)}</span>
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-text-muted pt-1 border-t border-border-subtle/40">
                              <div className="flex items-center gap-2">
                                <span className="uppercase text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  {q.topico}
                                </span>
                                <span>•</span>
                                <span>
                                  {q.errosCount} erro(s) em {q.tentativasTotal} tentativa(s)
                                </span>
                              </div>

                              {formattedAnswer && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-text-muted text-[11px]">Última resposta:</span>
                                  <span className="font-mono text-white bg-base px-2 py-0.5 rounded border border-border-subtle text-[11px] truncate max-w-xs">
                                    {formattedAnswer}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
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
