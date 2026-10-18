'use client';

import React, { useState, useMemo } from 'react';
import {
  Flame,
  Sparkles,
  AlertTriangle,
  Target,
  Layers,
  Search,
  Eye,
  Zap,
  X,
  Filter,
} from 'lucide-react';
import type {
  ContentAnalyticsOverviewData,
  QuestionAnalyticsItem,
  DifficultyLevel,
  StudentMetricItem,
} from '@/types';
import { QuestionDetailModal } from './QuestionDetailModal';

export interface ContentAnalyticsViewProps {
  data: ContentAnalyticsOverviewData;
}

type QuestionLens = 'mais_dificeis' | 'mais_faceis' | 'gargalos' | 'ordem_curso';

const DIFFICULTY_STYLES: Record<
  DifficultyLevel,
  { label: string; className: string }
> = {
  facil: {
    label: 'Fácil',
    className: 'bg-success/10 text-success border-success/20',
  },
  moderada: {
    label: 'Moderada',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  dificil: {
    label: 'Difícil',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  critica: {
    label: 'Crítica',
    className: 'bg-error/10 text-error border-error/20',
  },
};

const TYPE_LABELS: Record<string, string> = {
  diagramacao: 'Diagramação',
  tabela_verdade: 'Tabela-Verdade',
  formalizacao: 'Formalização',
  formalizacao_argumento: 'Argumento',
  multipla_escolha: 'Múltipla Escolha',
};

export function deriveFallbackContentAnalytics(
  students: StudentMetricItem[]
): ContentAnalyticsOverviewData {
  const totalStudents = students.length;
  const phaseMap = new Map<
    string,
    {
      phaseId: string;
      titulo: string;
      ordem: number;
      questionsMap: Map<string, QuestionAnalyticsItem>;
    }
  >();

  students.forEach((st) => {
    (st.fases || []).forEach((f, fIdx) => {
      if (!phaseMap.has(f.phaseId)) {
        phaseMap.set(f.phaseId, {
          phaseId: f.phaseId,
          titulo: f.titulo,
          ordem: fIdx,
          questionsMap: new Map(),
        });
      }
      const pEntry = phaseMap.get(f.phaseId)!;
      f.questoes.forEach((q, qIdx) => {
        if (!pEntry.questionsMap.has(q.questionId)) {
          pEntry.questionsMap.set(q.questionId, {
            questionId: q.questionId,
            phaseId: f.phaseId,
            phaseTitle: f.titulo,
            phaseOrder: fIdx,
            questionOrder: qIdx,
            enunciado: q.enunciado,
            topico: q.topico,
            tipo: q.tipo,
            totalStudents,
            attemptedCount: 0,
            resolvedCount: 0,
            firstTryCount: 0,
            completedWithErrorsCount: 0,
            stuckCount: 0,
            notStartedCount: 0,
            completionRate: 0,
            firstTryRate: 0,
            failureRate: 0,
            stuckRate: 0,
            avgAttemptsToSuccess: 0,
            totalAttempts: 0,
            totalErrors: 0,
            rapidGuessCount: 0,
            difficultyScore: 0,
            difficultyLevel: 'facil',
            topErrors: [],
            studentBreakdown: [],
          });
        }
        const qEntry = pEntry.questionsMap.get(q.questionId)!;
        qEntry.totalAttempts += q.tentativasTotal;
        qEntry.totalErrors += q.errosCount;
        if (q.status === 'de_primeira') {
          qEntry.attemptedCount++;
          qEntry.resolvedCount++;
          qEntry.firstTryCount++;
        } else if (q.status === 'com_dificuldade') {
          qEntry.attemptedCount++;
          qEntry.resolvedCount++;
          qEntry.completedWithErrorsCount++;
        } else if (q.status === 'pendente_com_erros') {
          qEntry.attemptedCount++;
          qEntry.stuckCount++;
        } else {
          qEntry.notStartedCount++;
        }
        qEntry.studentBreakdown.push({
          studentId: st.id,
          name: st.name,
          email: st.email,
          status: q.status,
          errosCount: q.errosCount,
          tentativasTotal: q.tentativasTotal,
          ultimaResposta: q.ultimaResposta,
          hasRapidGuess: false,
        });
      });
    });
  });

  const questions: QuestionAnalyticsItem[] = [];
  const phases = Array.from(phaseMap.values()).map((p) => {
    const pQuestions = Array.from(p.questionsMap.values()).map((q) => {
      const completionRate =
        totalStudents > 0 ? Number(((q.resolvedCount / totalStudents) * 100).toFixed(1)) : 0;
      const firstTryRate =
        q.attemptedCount > 0 ? Number(((q.firstTryCount / q.attemptedCount) * 100).toFixed(1)) : 0;
      const stuckRate =
        q.attemptedCount > 0 ? Number(((q.stuckCount / q.attemptedCount) * 100).toFixed(1)) : 0;
      const failureRate =
        q.totalAttempts > 0 ? Number(((q.totalErrors / q.totalAttempts) * 100).toFixed(1)) : 0;
      const difficultyScore =
        q.attemptedCount > 0
          ? Math.round(0.4 * (100 - firstTryRate) + 0.4 * failureRate + 0.2 * stuckRate)
          : 0;
      const difficultyLevel: DifficultyLevel =
        difficultyScore >= 75
          ? 'critica'
          : difficultyScore >= 50
          ? 'dificil'
          : difficultyScore >= 25
          ? 'moderada'
          : 'facil';

      const updated: QuestionAnalyticsItem = {
        ...q,
        completionRate,
        firstTryRate,
        stuckRate,
        failureRate,
        difficultyScore,
        difficultyLevel,
      };
      questions.push(updated);
      return updated;
    });

    const totalQuestions = pQuestions.length;
    const totalSlots = totalQuestions * totalStudents;
    const sumFirstTry = pQuestions.reduce((a, b) => a + b.firstTryCount, 0);
    const sumWithErr = pQuestions.reduce((a, b) => a + b.completedWithErrorsCount, 0);
    const sumStuck = pQuestions.reduce((a, b) => a + b.stuckCount, 0);
    const firstTryPct = totalSlots > 0 ? Number(((sumFirstTry / totalSlots) * 100).toFixed(1)) : 0;
    const completedWithErrorsPct =
      totalSlots > 0 ? Number(((sumWithErr / totalSlots) * 100).toFixed(1)) : 0;
    const stuckPct = totalSlots > 0 ? Number(((sumStuck / totalSlots) * 100).toFixed(1)) : 0;
    const notStartedPct = Number(
      Math.max(0, 100 - firstTryPct - completedWithErrorsPct - stuckPct).toFixed(1)
    );

    return {
      phaseId: p.phaseId,
      titulo: p.titulo,
      ordem: p.ordem,
      totalQuestions,
      attemptedQuestionsCount: pQuestions.filter((q) => q.attemptedCount > 0).length,
      completionRate:
        totalQuestions > 0
          ? Number(
              (pQuestions.reduce((a, b) => a + b.completionRate, 0) / totalQuestions).toFixed(1)
            )
          : 0,
      firstTryRate:
        totalQuestions > 0
          ? Number((pQuestions.reduce((a, b) => a + b.firstTryRate, 0) / totalQuestions).toFixed(1))
          : 0,
      failureRate: 0,
      totalErrors: pQuestions.reduce((a, b) => a + b.totalErrors, 0),
      totalAttempts: pQuestions.reduce((a, b) => a + b.totalAttempts, 0),
      stuckStudentsCount: sumStuck,
      avgAttemptsToSuccess: 1,
      difficultyScore:
        totalQuestions > 0
          ? Math.round(pQuestions.reduce((a, b) => a + b.difficultyScore, 0) / totalQuestions)
          : 0,
      difficultyLevel: 'facil' as DifficultyLevel,
      distribution: {
        firstTryPct,
        completedWithErrorsPct,
        stuckPct,
        notStartedPct,
      },
    };
  });

  return {
    globalFirstTryRate: 0,
    totalQuestionsActive: questions.length,
    hardestPhase: phases[0] || null,
    easiestPhase: phases[0] || null,
    criticalQuestion: questions[0] || null,
    phases,
    questions,
  };
}

export const ContentAnalyticsView: React.FC<ContentAnalyticsViewProps> = ({ data }) => {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [activeLens, setActiveLens] = useState<QuestionLens>('mais_dificeis');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionAnalyticsItem | null>(null);

  const selectedPhaseObj = useMemo(
    () => data.phases.find((p) => p.phaseId === selectedPhaseId) || null,
    [data.phases, selectedPhaseId]
  );

  // Filtragem de questões
  const filteredQuestions = useMemo(() => {
    return data.questions.filter((q) => {
      if (selectedPhaseId && q.phaseId !== selectedPhaseId) {
        return false;
      }
      if (selectedType !== 'todos' && q.tipo.toLowerCase() !== selectedType) {
        return false;
      }
      if (activeLens === 'gargalos' && q.stuckCount === 0 && q.totalErrors === 0) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchEnunciado = q.enunciado.toLowerCase().includes(query);
        const matchTopico = q.topico.toLowerCase().includes(query);
        const matchPhase = q.phaseTitle.toLowerCase().includes(query);
        return matchEnunciado || matchTopico || matchPhase;
      }
      return true;
    });
  }, [data.questions, selectedPhaseId, selectedType, activeLens, searchQuery]);

  // Ordenação conforme a lente ativa
  const sortedQuestions = useMemo(() => {
    return [...filteredQuestions].sort((a, b) => {
      if (activeLens === 'mais_dificeis') {
        return (
          b.difficultyScore - a.difficultyScore ||
          b.failureRate - a.failureRate ||
          b.stuckCount - a.stuckCount
        );
      }
      if (activeLens === 'mais_faceis') {
        return (
          a.difficultyScore - b.difficultyScore ||
          b.firstTryRate - a.firstTryRate ||
          a.failureRate - b.failureRate
        );
      }
      if (activeLens === 'gargalos') {
        return (
          b.stuckCount - a.stuckCount ||
          b.rapidGuessCount - a.rapidGuessCount ||
          b.difficultyScore - a.difficultyScore
        );
      }
      // ordem_curso
      return a.phaseOrder - b.phaseOrder || a.questionOrder - b.questionOrder;
    });
  }, [filteredQuestions, activeLens]);

  const handleTogglePhaseFilter = (phaseId: string) => {
    setSelectedPhaseId((prev) => (prev === phaseId ? null : phaseId));
  };

  return (
    <div className="space-y-6">
      {/* Seção 1: 4 Cards Spotlight (Destaques Executivos) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Fase Mais Desafiadora */}
        <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider block">
              Fase Mais Desafiadora
            </span>
            {data.hardestPhase ? (
              <>
                <div className="text-base font-bold text-white truncate">
                  {`#${data.hardestPhase.ordem + 1} — ${data.hardestPhase.titulo}`}
                </div>
                <p className="text-xs text-error font-mono">
                  {data.hardestPhase.failureRate}% de erro • {data.hardestPhase.avgAttemptsToSuccess}x tent.
                </p>
              </>
            ) : (
              <div className="text-sm text-text-muted">Sem dados suficientes</div>
            )}
          </div>
          <div className="p-3 bg-error/10 text-error rounded-xl shrink-0">
            <Flame size={20} />
          </div>
        </div>

        {/* Card 2: Fase Mais Fluida */}
        <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider block">
              Fase Mais Fluida
            </span>
            {data.easiestPhase ? (
              <>
                <div className="text-base font-bold text-white truncate">
                  {`#${data.easiestPhase.ordem + 1} — ${data.easiestPhase.titulo}`}
                </div>
                <p className="text-xs text-success font-mono">
                  {data.easiestPhase.firstTryRate}% acerto de 1ª • {data.easiestPhase.completionRate}% conclusão
                </p>
              </>
            ) : (
              <div className="text-sm text-text-muted">Sem dados suficientes</div>
            )}
          </div>
          <div className="p-3 bg-success/10 text-success rounded-xl shrink-0">
            <Sparkles size={20} />
          </div>
        </div>

        {/* Card 3: Maior Gargalo (Questão Crítica) */}
        <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider block">
              Maior Gargalo
            </span>
            {data.criticalQuestion ? (
              <>
                <div className="text-sm font-bold text-white truncate" title={data.criticalQuestion.enunciado}>
                  {`"${data.criticalQuestion.enunciado}"`}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-warning">
                  <span>{data.criticalQuestion.stuckCount} travado(s)</span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedQuestion(data.criticalQuestion)}
                    className="text-primary hover:underline font-sans font-medium"
                  >
                    Inspecionar
                  </button>
                </div>
              </>
            ) : (
              <div className="text-sm text-text-muted">Sem gargalos detectados</div>
            )}
          </div>
          <div className="p-3 bg-warning/10 text-warning rounded-xl shrink-0">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Card 4: Acerto de 1ª Global */}
        <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider block">
              Clareza Conceitual (1ª Tent.)
            </span>
            <div className="text-2xl font-extrabold text-primary font-mono">
              {data.globalFirstTryRate}%
            </div>
            <p className="text-xs text-text-muted">resoluções sem erro prévio</p>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <Target size={20} />
          </div>
        </div>
      </section>

      {/* Seção 2: Panorama de Fases (Cards Selecionáveis com Barra Empilhada) */}
      <section className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle/50 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-primary" />
              Panorama de Fases
            </h2>
            <p className="text-xs text-text-muted">
              Clique em uma fase para filtrar suas questões abaixo
            </p>
          </div>

          {/* Legenda da Barra Empilhada */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />
              Acertaram de 1ª
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" />
              Após erros
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-error inline-block" />
              Travados
            </span>
          </div>
        </div>

        {data.phases.length === 0 ? (
          <div className="text-center py-6 text-xs text-text-muted">
            Nenhuma fase ativa encontrada.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.phases.map((phase, idx) => {
              const isSelected = selectedPhaseId === phase.phaseId;
              const diffStyle =
                DIFFICULTY_STYLES[phase.difficultyLevel] || DIFFICULTY_STYLES.facil;

              return (
                <button
                  key={phase.phaseId}
                  type="button"
                  onClick={() => handleTogglePhaseFilter(phase.phaseId)}
                  aria-pressed={isSelected}
                  className={`text-left p-4 rounded-xl border transition-colors space-y-3 ${
                    isSelected
                      ? 'bg-primary/10 border-primary ring-1 ring-primary/40'
                      : 'bg-base border-border-subtle hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-text-muted block">
                        Fase {idx + 1} • {phase.totalQuestions} questão(ões)
                      </span>
                      <h3 className="font-bold text-sm text-white truncate">
                        {phase.titulo}
                      </h3>
                    </div>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${diffStyle.className}`}
                    >
                      {diffStyle.label}
                    </span>
                  </div>

                  {/* Barra Empilhada de 3 Cores */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-border-subtle flex">
                      {phase.distribution.firstTryPct > 0 && (
                        <div
                          className="h-full bg-success"
                          style={{ width: `${phase.distribution.firstTryPct}%` }}
                          title={`Acerto de 1ª: ${phase.distribution.firstTryPct}%`}
                        />
                      )}
                      {phase.distribution.completedWithErrorsPct > 0 && (
                        <div
                          className="h-full bg-warning"
                          style={{ width: `${phase.distribution.completedWithErrorsPct}%` }}
                          title={`Concluída após erros: ${phase.distribution.completedWithErrorsPct}%`}
                        />
                      )}
                      {phase.distribution.stuckPct > 0 && (
                        <div
                          className="h-full bg-error"
                          style={{ width: `${phase.distribution.stuckPct}%` }}
                          title={`Travados: ${phase.distribution.stuckPct}%`}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                      <span>Conclusão: {phase.completionRate}%</span>
                      <span>1ª Tent.: {phase.firstTryRate}%</span>
                      <span>Erros: {phase.totalErrors}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Seção 3: Explorador de Questões */}
      <section className="bg-surface border border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Explorador de Questões
              </h2>
              {selectedPhaseObj && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">
                  <Filter size={12} />
                  <span>{`Filtrando por: ${selectedPhaseObj.titulo}`}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPhaseId(null)}
                    aria-label="Limpar filtro de fase"
                    className="hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>

            {/* Lentes Rápidas */}
            <div className="flex items-center gap-1 bg-base p-1 rounded-lg border border-border-subtle overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveLens('mais_dificeis')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  activeLens === 'mais_dificeis'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Mais Difíceis
              </button>

              <button
                type="button"
                onClick={() => setActiveLens('mais_faceis')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  activeLens === 'mais_faceis'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Mais Fáceis
              </button>

              <button
                type="button"
                onClick={() => setActiveLens('gargalos')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  activeLens === 'gargalos'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Gargalos (Travados)
              </button>

              <button
                type="button"
                onClick={() => setActiveLens('ordem_curso')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  activeLens === 'ordem_curso'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Ordem do Curso
              </button>
            </div>
          </div>

          {/* Busca + Filtro por Tipo */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Buscar questão por enunciado ou tópico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-base border border-border-subtle rounded-lg text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="question-type-filter" className="text-xs text-text-muted">
                Tipo:
              </label>
              <select
                id="question-type-filter"
                aria-label="Filtrar por tipo de questão"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-base border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="diagramacao">Diagramação</option>
                <option value="tabela_verdade">Tabela-Verdade</option>
                <option value="formalizacao">Formalização</option>
                <option value="formalizacao_argumento">Formalização de Argumentos</option>
                <option value="multipla_escolha">Múltipla Escolha</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Questões */}
        <div className="overflow-x-auto">
          <table
            role="table"
            aria-label="Tabela de questões"
            className="w-full text-left text-sm"
          >
            <thead className="bg-base/60 text-xs text-text-muted uppercase font-mono border-b border-border-subtle">
              <tr>
                <th scope="col" className="p-4">
                  Questão & Fase
                </th>
                <th scope="col" className="p-4">
                  Dificuldade
                </th>
                <th scope="col" className="p-4 min-w-[200px]">
                  Distribuição da Turma
                </th>
                <th scope="col" className="p-4">
                  Esforço & Alertas
                </th>
                <th scope="col" className="p-4 text-right">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-subtle/50 text-text-main">
              {sortedQuestions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted text-sm">
                    Nenhuma questão encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                sortedQuestions.map((q) => {
                  const diffStyle =
                    DIFFICULTY_STYLES[q.difficultyLevel] || DIFFICULTY_STYLES.facil;
                  const typeLabel = TYPE_LABELS[q.tipo.toLowerCase()] || q.tipo;

                  const firstTryPct =
                    q.totalStudents > 0 ? (q.firstTryCount / q.totalStudents) * 100 : 0;
                  const withErrorsPct =
                    q.totalStudents > 0
                      ? (q.completedWithErrorsCount / q.totalStudents) * 100
                      : 0;
                  const stuckPct =
                    q.totalStudents > 0 ? (q.stuckCount / q.totalStudents) * 100 : 0;

                  return (
                    <tr
                      key={q.questionId}
                      onClick={() => setSelectedQuestion(q)}
                      className="hover:bg-base/40 transition-colors cursor-pointer"
                    >
                      {/* Questão & Fase */}
                      <td className="p-4 max-w-md">
                        <div className="space-y-1">
                          <div className="font-semibold text-white text-xs sm:text-sm line-clamp-2">
                            {q.enunciado}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
                            <span>{`${q.phaseTitle} • ${q.topico}`}</span>
                            <span>•</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-base border border-border-subtle">
                              {typeLabel}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Dificuldade */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${diffStyle.className}`}
                          >
                            {diffStyle.label}
                          </span>
                          <div className="text-[11px] font-mono text-text-muted">
                            {q.failureRate}% taxa de erro
                          </div>
                        </div>
                      </td>

                      {/* Distribuição da Turma */}
                      <td className="p-4 min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="w-full h-2 bg-base rounded-full overflow-hidden border border-border-subtle flex">
                            {firstTryPct > 0 && (
                              <div
                                className="h-full bg-success"
                                style={{ width: `${firstTryPct}%` }}
                              />
                            )}
                            {withErrorsPct > 0 && (
                              <div
                                className="h-full bg-warning"
                                style={{ width: `${withErrorsPct}%` }}
                              />
                            )}
                            {stuckPct > 0 && (
                              <div
                                className="h-full bg-error"
                                style={{ width: `${stuckPct}%` }}
                              />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                            <span className="text-success">1ª: {q.firstTryCount}</span>
                            <span className="text-warning">
                              Após erro: {q.completedWithErrorsCount}
                            </span>
                            <span className="text-error">Travados: {q.stuckCount}</span>
                          </div>
                        </div>
                      </td>

                      {/* Esforço & Alertas */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-mono text-xs text-white font-semibold">
                            {q.avgAttemptsToSuccess}x tent. ({q.totalErrors} erros)
                          </div>
                          {q.rapidGuessCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-warning/15 text-warning border border-warning/30">
                              <Zap size={10} />
                              {q.rapidGuessCount} em chute rápido
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ações */}
                      <td
                        className="p-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedQuestion(q)}
                          aria-label="Ver Raio-X"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-base hover:bg-primary hover:text-white text-text-muted border border-border-subtle hover:border-primary transition-colors"
                        >
                          <Eye size={13} />
                          <span>Ver Raio-X</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Raio-X da Questão */}
      <QuestionDetailModal
        question={selectedQuestion}
        isOpen={Boolean(selectedQuestion)}
        onClose={() => setSelectedQuestion(null)}
      />
    </div>
  );
};

