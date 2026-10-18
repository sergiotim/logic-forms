'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Eye,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type {
  StudentAnalyticsOverviewData,
  StudentMetricItem,
} from '@/types';
import { StudentDetailModal } from './StudentDetailModal';

export interface StudentAnalyticsDashboardProps {
  initialData: StudentAnalyticsOverviewData;
}

type FilterStatus = 'todos' | 'em_andamento' | 'concluidos' | 'nao_iniciados';
type SortField = 'name' | 'porcentagemConcluida' | 'totalErros' | 'acertosDePrimeira' | 'ultimaAtividade';
type SortDirection = 'asc' | 'desc';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Sem atividade';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export const StudentAnalyticsDashboard: React.FC<StudentAnalyticsDashboardProps> = ({
  initialData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedStudent, setSelectedStudent] = useState<StudentMetricItem | null>(null);

  // Estados de Paginação (SPEC-009)
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const students = initialData.students || [];

  // Filtragem e Busca
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Filtro de status
      if (filterStatus === 'em_andamento') {
        if (!(s.porcentagemConcluida > 0 && s.porcentagemConcluida < 100)) return false;
      } else if (filterStatus === 'concluidos') {
        if (s.porcentagemConcluida !== 100) return false;
      } else if (filterStatus === 'nao_iniciados') {
        if (s.porcentagemConcluida !== 0) return false;
      }

      // Busca textual
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesEmail = s.email.toLowerCase().includes(query);
        return matchesName || matchesEmail;
      }

      return true;
    });
  }, [students, filterStatus, searchTerm]);

  // Ordenação
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'porcentagemConcluida') {
        comparison = a.porcentagemConcluida - b.porcentagemConcluida;
      } else if (sortField === 'totalErros') {
        comparison = a.totalErros - b.totalErros;
      } else if (sortField === 'acertosDePrimeira') {
        comparison = a.acertosDePrimeira - b.acertosDePrimeira;
      } else if (sortField === 'ultimaAtividade') {
        const dateA = a.ultimaAtividade ? new Date(a.ultimaAtividade).getTime() : 0;
        const dateB = b.ultimaAtividade ? new Date(b.ultimaAtividade).getTime() : 0;
        comparison = dateA - dateB;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredStudents, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Pipeline de Paginação (SPEC-009)
  const totalFilteredCount = sortedStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStudents = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedStudents.slice(startIndex, startIndex + pageSize);
  }, [sortedStudents, safeCurrentPage, pageSize]);

  const startRecord = totalFilteredCount === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalFilteredCount);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-text-muted/60" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} className="text-primary" />
    ) : (
      <ArrowDown size={12} className="text-primary" />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-base text-text-main font-sans">
      {/* Top Header */}
      <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border-subtle px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">
              Analytics dos Estudantes
            </h1>
            <span className="text-xs text-text-muted hidden sm:inline">
              Acompanhe o progresso individual e o histórico de tentativas para avaliação acadêmica
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

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* KPI Cards da Turma */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Total de Estudantes
              </span>
              <div className="text-3xl font-extrabold text-white">
                {initialData.totalStudents}
              </div>
              <p className="text-xs text-text-muted">matriculados na plataforma</p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Média de Conclusão da Turma
              </span>
              <div className="text-3xl font-extrabold text-primary">
                {initialData.mediaConclusaoTurma}%
              </div>
              <p className="text-xs text-text-muted">progresso médio geral</p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <GraduationCap size={22} />
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Concluíram Tudo (100%)
              </span>
              <div className="text-3xl font-extrabold text-success">
                {initialData.concluidosTotal}
              </div>
              <p className="text-xs text-text-muted">finalizaram todo o conteúdo</p>
            </div>
            <div className="p-3 bg-success/10 text-success rounded-xl">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="bg-surface border border-border-subtle rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                Não Iniciados (0%)
              </span>
              <div className="text-3xl font-extrabold text-text-muted">
                {initialData.naoIniciadosTotal}
              </div>
              <p className="text-xs text-text-muted">sem atividades no sistema</p>
            </div>
            <div className="p-3 bg-neutral-800 text-text-muted rounded-xl">
              <Clock size={22} />
            </div>
          </div>
        </section>

        {/* Toolbar: Busca + Filtros */}
        <section className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-surface border border-border-subtle p-4 rounded-xl shadow-sm">
          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-base border border-border-subtle rounded-lg text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Filtro por Status (Abas / Pills) */}
          <div className="flex items-center gap-1 bg-base p-1 rounded-lg border border-border-subtle overflow-x-auto">
            <button
              type="button"
              onClick={() => handleFilterChange('todos')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === 'todos'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Todos ({students.length})
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('em_andamento')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === 'em_andamento'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Em Andamento
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('concluidos')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === 'concluidos'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              100% Concluído
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('nao_iniciados')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === 'nao_iniciados'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Não Iniciados
            </button>
          </div>
        </section>

        {/* Tabela de Estudantes */}
        <section className="bg-surface border border-border-subtle rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table
              role="table"
              aria-label="Tabela de estudantes"
              className="w-full text-left text-sm"
            >
              <thead className="bg-base/60 text-xs text-text-muted uppercase font-mono border-b border-border-subtle">
                <tr>
                  <th
                    scope="col"
                    className="p-4 cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Estudante</span>
                      {renderSortIcon('name')}
                    </div>
                  </th>

                  <th
                    scope="col"
                    className="p-4 min-w-[210px] cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('porcentagemConcluida')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Progresso</span>
                      {renderSortIcon('porcentagemConcluida')}
                    </div>
                  </th>

                  <th scope="col" className="p-4">
                    Questões
                  </th>

                  <th
                    scope="col"
                    className="p-4 cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('totalErros')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Erros / Repetições</span>
                      {renderSortIcon('totalErros')}
                    </div>
                  </th>

                  <th
                    scope="col"
                    className="p-4 cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('acertosDePrimeira')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Acertos de 1ª</span>
                      {renderSortIcon('acertosDePrimeira')}
                    </div>
                  </th>

                  <th
                    scope="col"
                    className="p-4 cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('ultimaAtividade')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Última Atividade</span>
                      {renderSortIcon('ultimaAtividade')}
                    </div>
                  </th>

                  <th scope="col" className="p-4 text-right">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-subtle/50 text-text-main">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-muted text-sm">
                      Nenhum estudante encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => {
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-base/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedStudent(student)}
                      >
                        {/* Estudante */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-border-subtle flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {student.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={student.image}
                                  alt={student.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User size={16} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                                {student.name}
                              </div>
                              <div className="text-xs text-text-muted truncate max-w-[180px] sm:max-w-xs">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Progresso (% Concluído e % Restante) */}
                        <td className="p-4 min-w-[210px]">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-mono font-bold text-white shrink-0">
                                {student.porcentagemConcluida}% concluído
                              </span>
                              <span className="text-[11px] text-text-muted font-mono shrink-0">
                                {student.porcentagemRestante}% restante
                              </span>
                            </div>
                            <div className="w-full h-2 bg-base rounded-full overflow-hidden border border-border-subtle">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  student.porcentagemConcluida === 100
                                    ? 'bg-success'
                                    : student.porcentagemConcluida > 0
                                    ? 'bg-primary'
                                    : 'bg-transparent'
                                }`}
                                style={{ width: `${student.porcentagemConcluida}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Questões Concluídas */}
                        <td className="p-4 font-mono text-xs text-text-muted whitespace-nowrap">
                          <span className="text-white font-bold">{student.questoesConcluidas}</span>
                          {' / '}
                          {student.totalQuestoesAtivas}
                        </td>

                        {/* Total de Erros / Repetições */}
                        <td className="p-4 whitespace-nowrap">
                          {student.totalErros > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-error/10 text-error border border-error/20">
                              <AlertCircle size={12} />
                              {student.totalErros} {student.totalErros === 1 ? 'erro' : 'erros'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono text-text-muted bg-base border border-border-subtle">
                              0 erros
                            </span>
                          )}
                        </td>

                        {/* Acertos de Primeira */}
                        <td className="p-4 font-mono text-xs text-text-muted whitespace-nowrap">
                          <span className="text-primary font-bold">{student.acertosDePrimeira}</span>
                          {' de '}
                          {student.questoesConcluidas}
                        </td>

                        {/* Última Atividade */}
                        <td className="p-4 text-xs text-text-muted whitespace-nowrap">
                          {formatDate(student.ultimaAtividade)}
                        </td>

                        {/* Ações */}
                        <td className="p-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(student)}
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

          {/* Barra de Paginação (SPEC-009) */}
          <div className="p-4 border-t border-border-subtle bg-base/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 text-text-muted">
              <div className="flex items-center gap-1.5">
                <span>Exibir:</span>
                <select
                  aria-label="Itens por página"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="bg-base border border-border-subtle text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>por página</span>
              </div>
              <span className="text-border-subtle">|</span>
              <span>
                Mostrando {startRecord}–{endRecord} de {totalFilteredCount} estudantes
              </span>
            </div>

            {/* Controles de Navegação */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                aria-label="Anterior"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-subtle bg-base text-text-muted hover:text-white hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border-subtle disabled:hover:text-text-muted transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Anterior</span>
              </button>

              {/* Pílulas de Páginas */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    aria-current={pageNum === safeCurrentPage ? 'page' : undefined}
                    aria-label={`Página ${pageNum}`}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-medium transition-colors ${
                      pageNum === safeCurrentPage
                        ? 'bg-primary text-white shadow-sm font-bold'
                        : 'bg-base text-text-muted hover:text-white border border-border-subtle'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage >= totalPages}
                aria-label="Próximo"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-subtle bg-base text-text-muted hover:text-white hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border-subtle disabled:hover:text-text-muted transition-colors"
              >
                <span>Próximo</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Modal de Raio-X do Aluno */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
};

