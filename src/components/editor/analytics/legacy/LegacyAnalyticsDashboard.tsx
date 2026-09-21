'use client';

/**
 * @file LegacyAnalyticsDashboard.tsx
 * @description Painel analítico de visão geral e KPIs globais da turma (arquivado da SPEC-007 v1).
 * Preservado para consulta técnica interna, sem rota ativa no site.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  BarChart2,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { GlobalAnalyticsData } from '@/types';

interface LegacyAnalyticsDashboardProps {
  initialData?: GlobalAnalyticsData;
}

const TYPE_NAMES: Record<string, string> = {
  DIAGRAMACAO: 'Diagramação',
  TABELA_VERDADE: 'Tabela-Verdade',
  FORMALIZACAO: 'Formalização',
  diagramacao: 'Diagramação',
  tabela_verdade: 'Tabela-Verdade',
  formalizacao: 'Formalização',
};

const TYPE_COLORS: Record<string, string> = {
  DIAGRAMACAO: '#3B82F6',
  TABELA_VERDADE: '#10B981',
  FORMALIZACAO: '#8B5CF6',
  diagramacao: '#3B82F6',
  tabela_verdade: '#10B981',
  formalizacao: '#8B5CF6',
};

export const LegacyAnalyticsDashboard: React.FC<LegacyAnalyticsDashboardProps> = ({ initialData }) => {
  const data = initialData || {
    totalActiveStudents: 0,
    totalStudents: 0,
    globalCompletionRate: 0,
    performanceByType: [
      { type: 'DIAGRAMACAO', totalSubmissions: 0, correctSubmissions: 0, successRate: 0 },
      { type: 'TABELA_VERDADE', totalSubmissions: 0, correctSubmissions: 0, successRate: 0 },
      { type: 'FORMALIZACAO', totalSubmissions: 0, correctSubmissions: 0, successRate: 0 },
    ],
    phases: [],
  };

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(
    data.phases.length > 0 ? data.phases[0].phaseId : ''
  );

  const selectedPhase = data.phases.find((p) => p.phaseId === selectedPhaseId) || data.phases[0];

  const chartData = data.performanceByType.map((p) => {
    const label = TYPE_NAMES[p.type] || p.type;
    return {
      name: label,
      type: p.type,
      taxa: p.successRate,
      submissoes: p.totalSubmissions,
      acertos: p.correctSubmissions,
      fill: TYPE_COLORS[p.type] || '#3B82F6',
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-base text-text-main font-sans">
      <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border-subtle px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <BarChart2 size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">
              Dashboard de Análise (Legado)
            </h1>
            <span className="text-xs text-text-muted hidden sm:inline">
              Visão geral de desempenho e diagnósticos da turma
            </span>
          </div>
        </div>

        <Link
          href="/editor"
          className="text-sm font-medium text-text-muted hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface transition-colors border border-border-subtle"
        >
          <ArrowLeft size={16} /> Voltar ao Editor
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm hover:border-primary/40 transition-colors flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Alunos Ativos
              </span>
              <div className="text-3xl font-extrabold text-white">
                {data.totalActiveStudents}
              </div>
              <p className="text-xs text-text-muted">
                de {data.totalStudents} estudante(s) cadastrado(s)
              </p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Users size={24} />
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm hover:border-success/40 transition-colors flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Taxa de Conclusão Global
              </span>
              <div className="text-3xl font-extrabold text-success">
                {data.globalCompletionRate}%
              </div>
              <p className="text-xs text-text-muted">
                Média de progresso em relação a todas as questões
              </p>
            </div>
            <div className="p-3 bg-success/10 text-success rounded-xl">
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm hover:border-primary/40 transition-colors flex items-center justify-between sm:col-span-2 lg:col-span-1">
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Fases Monitoradas
              </span>
              <div className="text-3xl font-extrabold text-white">
                {data.phases.length}
              </div>
              <p className="text-xs text-text-muted">
                Total de fases com dados e submissões
              </p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Layers size={24} />
            </div>
          </div>
        </section>

        <section className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle/50 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 size={18} className="text-primary" />
                Desempenho por Tipo de Questão
              </h2>
              <p className="text-xs text-text-muted">
                Taxa de acerto acumulada entre os diferentes modelos de exercícios
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    stroke="#374151"
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    stroke="#374151"
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-surface border border-border-subtle p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <p className="font-bold text-white">{item.name}</p>
                            <p className="text-primary">Taxa de Acerto: {item.taxa}%</p>
                            <p className="text-text-muted">
                              Acertos: {item.acertos} / {item.submissoes}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="taxa" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {data.performanceByType.map((item) => {
                const label = TYPE_NAMES[item.type] || item.type;
                const color = TYPE_COLORS[item.type] || '#3B82F6';
                return (
                  <div
                    key={item.type}
                    className="p-3.5 rounded-lg bg-base border border-border-subtle flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{label}</div>
                      <div className="text-xs text-text-muted">
                        {item.correctSubmissions} de {item.totalSubmissions} acertos
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-lg font-mono font-bold"
                        style={{ color }}
                      >
                        {item.successRate}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border-subtle p-4 rounded-xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-warning" />
                Diagnósticos Detalhados por Fase
              </h2>
              <p className="text-xs text-text-muted">
                {selectedPhase
                  ? `Exibindo diagnósticos de ${selectedPhase.phaseTitle}`
                  : 'Nenhuma fase selecionada'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="phase-select"
                className="text-xs font-medium text-text-muted whitespace-nowrap"
              >
                Selecionar Fase:
              </label>
              <select
                id="phase-select"
                aria-label="Selecionar Fase"
                value={selectedPhase?.phaseId || ''}
                onChange={(e) => setSelectedPhaseId(e.target.value)}
                className="bg-base border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              >
                {data.phases.map((p) => (
                  <option key={p.phaseId} value={p.phaseId}>
                    {p.phaseTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedPhase && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                data-testid="hardest-questions-ranking"
                className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingDown size={16} className="text-error" />
                    Questões com Maior Índice de Erros
                  </h3>
                  <span className="text-xs text-text-muted">
                    {selectedPhase.hardestQuestions.length} questão(ões)
                  </span>
                </div>

                {selectedPhase.hardestQuestions.length === 0 ? (
                  <div className="text-center py-8 text-text-muted text-xs">
                    Nenhuma questão com falhas registradas nesta fase.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPhase.hardestQuestions.map((q, idx) => (
                      <div
                        key={q.questionId}
                        className="p-3.5 bg-base border border-border-subtle rounded-lg flex items-start justify-between gap-3 hover:border-error/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-text-muted px-1.5 py-0.5 bg-surface rounded">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-medium text-text-muted uppercase">
                              {q.topic}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-white line-clamp-2">
                            {q.enunciado}
                          </p>
                          <div className="text-[11px] text-text-muted">
                            {q.failureCount} erro(s) em {q.totalAttempts} tentativa(s)
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold font-mono text-error">
                            {q.failureRate}%
                          </div>
                          <span className="text-[10px] text-text-muted uppercase">
                            Taxa de Erro
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                data-testid="common-errors-analysis"
                className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <HelpCircle size={16} className="text-warning" />
                    Análise Qualitativa de Respostas Incorretas
                  </h3>
                  <span className="text-xs text-text-muted">Erros Frequentes</span>
                </div>

                {selectedPhase.errorAnalysis.length === 0 ? (
                  <div className="text-center py-8 text-text-muted text-xs">
                    Nenhum erro registrado para análise qualitativa nesta fase.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedPhase.errorAnalysis.map((ea) => (
                      <div
                        key={ea.questionId}
                        className="bg-base border border-border-subtle rounded-lg p-3.5 space-y-3"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white line-clamp-1">
                            {ea.enunciado}
                          </div>
                          <span className="text-[11px] text-text-muted">
                            {ea.totalErrors} erro(s) mapeado(s)
                          </span>
                        </div>

                        {ea.topErrors.length === 0 ? (
                          <div className="text-[11px] text-text-muted italic">
                            Sem dados de erros para esta questão.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {ea.topErrors.map((err, i) => {
                              const answerText =
                                typeof err.answer === 'string'
                                  ? err.answer
                                  : JSON.stringify(err.answer);
                              return (
                                <div
                                  key={i}
                                  className="flex items-center justify-between p-2 rounded bg-surface border border-border-subtle text-xs"
                                >
                                  <span className="font-mono text-error font-medium truncate max-w-[200px] sm:max-w-xs">
                                    {answerText}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-text-muted text-[11px]">
                                      ({err.count}x)
                                    </span>
                                    <span className="font-mono font-bold text-warning text-xs">
                                      {err.percentage}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

