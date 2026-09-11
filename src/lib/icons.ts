/**
 * @file icons.ts
 * @description Mapeamento de LucideIconName (string serializável) → componente React do lucide-react.
 * SPEC: editor-spec.md — Seção 3.5
 */

import {
  Network,
  Table2,
  PenLine,
  BookOpen,
  Brain,
  Target,
  Lightbulb,
  GraduationCap,
  Puzzle,
  FlaskConical,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LucideIconName } from '@/types';

export const ICON_MAP: Record<LucideIconName, LucideIcon> = {
  Network,
  Table2,
  PenLine,
  BookOpen,
  Brain,
  Target,
  Lightbulb,
  GraduationCap,
  Puzzle,
  FlaskConical,
};

export const ICON_OPTIONS: { name: LucideIconName; label: string }[] = [
  { name: 'Network', label: 'Rede / Diagramação' },
  { name: 'Table2', label: 'Tabela' },
  { name: 'PenLine', label: 'Escrita / Formalização' },
  { name: 'BookOpen', label: 'Livro' },
  { name: 'Brain', label: 'Cérebro / Raciocínio' },
  { name: 'Target', label: 'Alvo / Objetivo' },
  { name: 'Lightbulb', label: 'Lâmpada / Ideia' },
  { name: 'GraduationCap', label: 'Formatura' },
  { name: 'Puzzle', label: 'Quebra-cabeça' },
  { name: 'FlaskConical', label: 'Laboratório' },
];
