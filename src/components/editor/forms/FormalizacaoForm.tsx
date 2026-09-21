import React, { useState } from 'react';
import { FormalizacaoQuestion } from '@/types';
import {
  validateFormalizacaoSyntax,
  extractFormalizacaoDicas,
  suggestVirtualKeyboard,
} from '@/lib/formalizacao';
import { Plus, Trash2, Sparkles, Wand2 } from 'lucide-react';

interface FormalizacaoFormProps {
  question: FormalizacaoQuestion;
  onChange: (updated: FormalizacaoQuestion) => void;
  error?: string;
}

const AVAILABLE_KEYS = ['~', '∧', '∨', '→', '↔', '∀', '∃'];

export const FormalizacaoForm: React.FC<FormalizacaoFormProps> = ({ question, onChange, error }) => {
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  const handleAddDica = () => {
    onChange({
      ...question,
      dicas: [...question.dicas, ''],
    });
  };

  const handleUpdateDica = (index: number, text: string) => {
    const novasDicas = [...question.dicas];
    novasDicas[index] = text;
    onChange({
      ...question,
      dicas: novasDicas,
    });
  };

  const handleRemoveDica = (index: number) => {
    onChange({
      ...question,
      dicas: question.dicas.filter((_, i) => i !== index),
    });
  };

  // Sincroniza o dicionário de dicas automaticamente a partir da fórmula
  const handleSyncDicasFromFormula = () => {
    if (!question.resposta_esperada.trim()) return;
    const extracted = extractFormalizacaoDicas(question.resposta_esperada);
    if (extracted.length > 0) {
      onChange({
        ...question,
        dicas: extracted,
      });
    }
  };

  const handleToggleKey = (key: string) => {
    const exists = question.teclado_virtual.includes(key);
    const novoTeclado = exists
      ? question.teclado_virtual.filter((k) => k !== key)
      : [...question.teclado_virtual, key];

    const currentVars: string[] = question.resposta_esperada.match(/[a-zA-Z]/g) || [];
    const sanitizedTeclado = novoTeclado.filter(
      (k) => !/^[a-zA-Z]$/.test(k) || currentVars.includes(k)
    );

    onChange({
      ...question,
      teclado_virtual: sanitizedTeclado,
    });
  };

  // Auto-configura teclado com operadores da fórmula + distratores
  const handleAutoConfigureKeyboard = (withDistractors: boolean = true) => {
    if (!question.resposta_esperada.trim()) return;
    const suggested = suggestVirtualKeyboard(question.resposta_esperada, withDistractors);
    if (suggested.length > 0) {
      onChange({
        ...question,
        teclado_virtual: suggested,
      });
    }
  };

  const handleExpectedChange = (newExpected: string) => {
    if (newExpected.trim()) {
      const syntax = validateFormalizacaoSyntax(newExpected);
      setSyntaxError(syntax.isValid ? null : (syntax.error || null));
    } else {
      setSyntaxError(null);
    }

    // Garante que operadores e variáveis presentes na fórmula estejam no teclado,
    // colocando as variáveis sempre em primeiro lugar e removendo variáveis que deixaram de existir
    const formulaKeys = AVAILABLE_KEYS.filter((k) => newExpected.includes(k));
    const formulaVars = Array.from(new Set(newExpected.match(/[a-zA-Z]/g) || [])).sort((a, b) => {
      const aUpper = a === a.toUpperCase();
      const bUpper = b === b.toUpperCase();
      if (aUpper && !bUpper) return -1;
      if (!aUpper && bUpper) return 1;
      return a.localeCompare(b);
    });
    const nonVariableKeys = question.teclado_virtual.filter((k) => !/^[a-zA-Z]$/.test(k));
    const mergedKeys = Array.from(new Set([...formulaVars, ...nonVariableKeys, ...formulaKeys]));

    onChange({
      ...question,
      resposta_esperada: newExpected,
      teclado_virtual: mergedKeys,
    });
  };

  const handleInsertSymbolInExpected = (sym: string) => {
    handleExpectedChange(question.resposta_esperada + sym);
  };

  return (
    <div className="space-y-4 font-sans text-sm">
      {/* Enunciado */}
      <div>
        <label htmlFor="enunciado" className="block text-text-main font-semibold mb-1">
          Enunciado
        </label>
        <textarea
          id="enunciado"
          value={question.enunciado}
          onChange={(e) => onChange({ ...question, enunciado: e.target.value })}
          rows={3}
          placeholder="Ex: Traduza o raciocínio para linguagem simbólica..."
          className="w-full bg-base border border-border-subtle rounded-lg p-3 text-text-main focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Tópico */}
      <div>
        <label htmlFor="topico" className="block text-text-main font-semibold mb-1">
          Tópico
        </label>
        <input
          id="topico"
          type="text"
          value={question.topico}
          onChange={(e) => onChange({ ...question, topico: e.target.value })}
          placeholder="Ex: Lógica de Predicados"
          className="w-full bg-base border border-border-subtle rounded-lg p-3 text-text-main focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Resposta Esperada com Barra de Atalhos e Modo de Validação Integrado */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="resposta_esperada" className="block text-text-main font-semibold">
            Resposta Esperada (Fórmula)
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">Modo de validação:</span>
            <select
              value={question.modo_validacao || 'semantico'}
              onChange={(e) =>
                onChange({
                  ...question,
                  modo_validacao: e.target.value as 'semantico' | 'estrito',
                })
              }
              className="bg-surface border border-border-subtle rounded px-2 py-0.5 text-text-main text-xs font-sans focus:outline-none focus:border-primary transition-colors cursor-pointer"
              title="Semântico: aceita equivalências lógicas automaticamente. Estrito: exige fórmula exata."
            >
              <option value="semantico">Semântico (Automático)</option>
              <option value="estrito">Estrito (Exato)</option>
            </select>
          </div>
        </div>

        <div
          className={`rounded-lg border bg-base overflow-hidden transition-colors ${
            syntaxError || error
              ? 'border-error focus-within:border-error'
              : 'border-border-subtle focus-within:border-primary'
          }`}
        >
          {/* Barra de atalhos acoplada */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/70 border-b border-border-subtle font-mono text-xs overflow-x-auto">
            <span className="text-text-muted font-sans text-[11px] mr-1 select-none">Símbolos:</span>
            {['∀', '∃', '~', '∧', '∨', '→', '↔', '(', ')'].map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => handleInsertSymbolInExpected(sym)}
                className="px-2.5 py-0.5 bg-surface border border-border-subtle rounded text-text-main hover:bg-primary hover:border-primary hover:text-white transition-colors font-bold text-xs"
              >
                {sym}
              </button>
            ))}
          </div>

          <input
            id="resposta_esperada"
            type="text"
            value={question.resposta_esperada}
            onChange={(e) => handleExpectedChange(e.target.value)}
            placeholder="Ex: P → Q ou ∀x(Px → Qx)"
            className="w-full bg-transparent p-3 text-text-main font-mono text-base focus:outline-none"
          />
        </div>

        {syntaxError && (
          <p className="text-error text-xs mt-1.5 font-medium flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-error rounded-full" />
            {syntaxError}
          </p>
        )}

        {error && !syntaxError && (
          <p className="text-error text-xs mt-1.5 font-medium flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-error rounded-full" />
            {error}
          </p>
        )}
      </div>

      {/* Dicas / Dicionário de Variáveis */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-main font-semibold">Dicionário de Variáveis (Dicas)</span>
          <div className="flex items-center gap-3">
            {question.resposta_esperada.trim() && (
              <button
                type="button"
                onClick={handleSyncDicasFromFormula}
                className="text-xs text-text-muted hover:text-primary flex items-center gap-1 transition-colors"
                title="Extrai os predicados e variáveis da fórmula para as dicas"
              >
                <Sparkles size={13} /> Sincronizar Fórmula
              </button>
            )}
            <button
              type="button"
              onClick={handleAddDica}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <Plus size={13} /> Adicionar Dica
            </button>
          </div>
        </div>

        {question.dicas.length === 0 ? (
          <div className="text-xs text-text-muted italic bg-surface/30 border border-dashed border-border-subtle rounded-lg p-2.5 text-center">
            Nenhuma dica cadastrada (opcional).
          </div>
        ) : (
          <div className="space-y-2">
            {question.dicas.map((dica, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={dica}
                  onChange={(e) => handleUpdateDica(idx, e.target.value)}
                  placeholder="Ex: P: é professor"
                  className="flex-1 bg-base border border-border-subtle rounded px-3 py-1.5 text-text-main font-mono text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDica(idx)}
                  className="p-1.5 text-text-muted hover:text-error transition-colors"
                  title="Remover dica"
                  aria-label="Remover dica"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teclado Virtual do Aluno */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-text-main font-semibold">Teclado Virtual do Aluno</span>
            <span className="text-xs text-text-muted">(Símbolos ativos)</span>
          </div>
          {question.resposta_esperada.trim() && (
            <button
              type="button"
              onClick={() => handleAutoConfigureKeyboard(true)}
              className="text-xs text-text-muted hover:text-primary flex items-center gap-1 transition-colors"
              title="Configura automaticamente os operadores da fórmula com distratores"
            >
              <Wand2 size={13} /> Auto-sugerir
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_KEYS.map((sym) => {
            const isSelected = question.teclado_virtual.includes(sym);
            return (
              <button
                key={sym}
                type="button"
                onClick={() => handleToggleKey(sym)}
                className={`px-3 py-1 rounded-md border font-mono font-bold text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface border-border-subtle text-text-muted hover:text-white'
                }`}
              >
                {sym}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
