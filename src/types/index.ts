export type QuestionType = 'diagramacao' | 'tabela_verdade' | 'formalizacao' | 'formalizacao_argumento' | 'multipla_escolha';

export interface BaseQuestion {
  id: string;
  tipo: QuestionType;
  topico: string;
  enunciado: string;
}

export interface DiagramacaoQuestion extends BaseQuestion {
  tipo: 'diagramacao';
  frases: { id: string; texto: string }[];
  resposta_esperada: Record<string, 'P' | 'C'>;
}

export interface TabelaVerdadeQuestion extends BaseQuestion {
  tipo: 'tabela_verdade';
  variaveis: string[];
  linhas: { valores: string[]; id: string }[];
  expressao: string;
  resposta_esperada: string[];
  celulas_reveladas?: Record<string, boolean>;
}

export interface FormalizacaoQuestion extends BaseQuestion {
  tipo: 'formalizacao';
  dicas: string[];
  teclado_virtual: string[];
  resposta_esperada: string;
  respostas_alternativas?: string[];
  modo_validacao?: 'semantico' | 'estrito';
}

export interface FormalizacaoArgumentoQuestion extends BaseQuestion {
  tipo: 'formalizacao_argumento';
  dicas: string[];
  teclado_virtual: string[];
  resposta_esperada: {
    premissas: string[];
    conclusao: string;
  };
  respostas_alternativas?: {
    premissas?: string[][];
    conclusao?: string[];
  };
  modo_validacao?: 'semantico' | 'estrito';
}

export interface MultiplaEscolhaQuestion extends BaseQuestion {
  tipo: 'multipla_escolha';
  opcoes: { id: string; texto: string }[];
  resposta_esperada: string;
}

export type Question =
  | DiagramacaoQuestion
  | TabelaVerdadeQuestion
  | FormalizacaoQuestion
  | FormalizacaoArgumentoQuestion
  | MultiplaEscolhaQuestion;

// --- Novos tipos para o Editor (SPEC-002) ---

export type LucideIconName =
  | 'Network'
  | 'Table2'
  | 'PenLine'
  | 'BookOpen'
  | 'Brain'
  | 'Target'
  | 'Lightbulb'
  | 'GraduationCap'
  | 'Puzzle'
  | 'FlaskConical';

export interface Phase {
  id: string;
  titulo: string;
  icone: LucideIconName;
  questoes: Question[];
}

export interface EditorState {
  version: number;
  phases: Phase[];
  updatedAt: string;
}

// --- Tipos de Exportação e Importação de Pacotes (SPEC-005) ---

export interface ExportedPhase {
  titulo: string;
  icone: LucideIconName;
  originalQuestionIds: string[];
}

export type ExportedQuestion = Question & {
  originalId: string;
};

export interface PhasePackageExport {
  metadata: {
    version: number;
    type: 'logica-dinamica:package_export';
    exportedAt: string;
  };
  phases: ExportedPhase[];
  questions: ExportedQuestion[];
}

export interface ImportPackageResult {
  state: EditorState;
  importedPhasesCount: number;
  importedQuestionsCount: number;
}

// --- Tipos de Analytics do Professor (SPEC-007) ---

export interface QuestionTypePerformance {
  type: 'DIAGRAMACAO' | 'TABELA_VERDADE' | 'FORMALIZACAO' | QuestionType;
  totalSubmissions: number;
  correctSubmissions: number;
  successRate: number; // 0 - 100%
}

export interface HardestQuestionSummary {
  questionId: string;
  enunciado: string;
  topic: string;
  type: QuestionType | 'DIAGRAMACAO' | 'TABELA_VERDADE' | 'FORMALIZACAO';
  failureCount: number;
  totalAttempts: number;
  failureRate: number; // 0 - 100%
}

export interface CommonErrorItem {
  answer: string | Record<string, unknown>;
  count: number;
  percentage: number;
}

export interface QuestionErrorAnalysis {
  questionId: string;
  enunciado: string;
  totalErrors: number;
  topErrors: CommonErrorItem[];
}

export interface PhaseAnalytics {
  phaseId: string;
  phaseTitle: string;
  totalQuestions: number;
  totalSubmissions: number;
  hardestQuestions: HardestQuestionSummary[];
  errorAnalysis: QuestionErrorAnalysis[];
}

export interface GlobalAnalyticsData {
  totalActiveStudents: number;
  totalStudents: number;
  globalCompletionRate: number; // 0 - 100%
  performanceByType: QuestionTypePerformance[];
  phases: PhaseAnalytics[];
}


