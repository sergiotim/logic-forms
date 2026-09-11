export type QuestionType = 'diagramacao' | 'tabela_verdade' | 'formalizacao';

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

export type Question = DiagramacaoQuestion | TabelaVerdadeQuestion | FormalizacaoQuestion;

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

