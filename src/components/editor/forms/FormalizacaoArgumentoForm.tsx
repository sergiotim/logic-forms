import React from 'react';
import { FormalizacaoArgumentoQuestion } from '@/types';
import {
  validateFormalizacaoSyntax,
  extractFormalizacaoDicas,
  suggestVirtualKeyboard,
} from '@/lib/formalizacao';
import { Plus, Trash2, Sparkles, Wand2 } from 'lucide-react';

interface FormalizacaoArgumentoFormProps {
  question: FormalizacaoArgumentoQuestion;
  onChange: (updated: FormalizacaoArgumentoQuestion) => void;
  error?: string;
}

const AVAILABLE_KEYS = ['~', '∧', '∨', '→', '↔', '∀', '∃'];
const SYMBOL_SHORTCUTS = ['∀', '∃', '~', '∧', '∨', '→', '↔', '(', ')'];

export const FormalizacaoArgumentoForm: React.FC<FormalizacaoArgumentoFormProps> = ({
  question,
  onChange,
  error,
}) => {
  const premissas =
    question.resposta_esperada?.premissas && question.resposta_esperada.premissas.length > 0
      ? question.resposta_esperada.premissas
      : [''];
  const conclusao = question.resposta_esperada?.conclusao || '';

  const fullArgumentText = [...premissas, conclusao].join(' ').trim();

  // Helper para verificar erros sintáticos em tempo real
  const getSyntaxError = (formula: string): string | null => {
    if (!formula.trim()) return null;
    const syntax = validateFormalizacaoSyntax(formula);
    return syntax.isValid ? null : syntax.error || null;
  };

  const handleUpdatePremissa = (index: number, val: string) => {
    const nextPremissas = [...premissas];
    nextPremissas[index] = val;

    // Garante automaticamente que operadores presentes na fórmula estejam no teclado do aluno
    // Garante automaticamente que operadores e variáveis presentes na fórmula estejam no teclado do aluno
    const allFormulas = [...nextPremissas, conclusao].join(' ');
    const formulaKeys = AVAILABLE_KEYS.filter((k) => allFormulas.includes(k));
    const mergedKeys = Array.from(new Set([...question.teclado_virtual, ...formulaKeys]));
    const formulaVars = allFormulas.match(/[a-zA-Z]/g) || [];
    const mergedKeys = Array.from(new Set([...question.teclado_virtual, ...formulaKeys, ...formulaVars]));

    onChange({
      ...question,
      teclado_virtual: mergedKeys,
      resposta_esperada: {
        ...question.resposta_esperada,
        premissas: nextPremissas,
      },
    });
  };

  const handleAddPremissa = () => {
    onChange({
      ...question,
      resposta_esperada: {
        ...question.resposta_esperada,
        premissas: [...premissas, ''],
      },
    });
  };

  const handleRemovePremissa = (index: number) => {
    if (premissas.length <= 1) return;
    const nextPremissas = premissas.filter((_, i) => i !== index);
    onChange({
      ...question,
      resposta_esperada: {
        ...question.resposta_esperada,
        premissas: nextPremissas,
      },
    });
  };

  const handleInsertSymbolInPremissa = (index: number, sym: string) => {
    handleUpdatePremissa(index, (premissas[index] || '') + sym);
  };

  const handleUpdateConclusao = (val: string) => {
    const allFormulas = [...premissas, val].join(' ');
    const formulaKeys = AVAILABLE_KEYS.filter((k) => allFormulas.includes(k));
    const mergedKeys = Array.from(new Set([...question.teclado_virtual, ...formulaKeys]));
    const formulaVars = allFormulas.match(/[a-zA-Z]/g) || [];
    const mergedKeys = Array.from(new Set([...question.teclado_virtual, ...formulaKeys, ...formulaVars]));

    onChange({
      ...question,
      teclado_virtual: mergedKeys,
      resposta_esperada: {
        ...question.resposta_esperada,
        conclusao: val,
      },
    });
  };

  const handleInsertSymbolInConclusao = (sym: string) => {
    handleUpdateConclusao((conclusao || '') + sym);
  };

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

  // Sincroniza o dicionário de dicas automaticamente a partir do argumento
  const handleSyncDicasFromArgument = () => {
    if (!fullArgumentText) return;
    const extracted = extractFormalizacaoDicas(fullArgumentText);
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

    onChange({
      ...question,
      teclado_virtual: novoTeclado,
    });
  };

  // Auto-configura teclado com operadores do argumento + distratores
  const handleAutoConfigureKeyboard = (withDistractors: boolean = true) => {
    if (!fullArgumentText) return;
    const suggested = suggestVirtualKeyboard(fullArgumentText, withDistractors);
    if (suggested.length > 0) {
      onChange({
        ...question,
        teclado_virtual: suggested,
      });
    }
  };

  const cError = getSyntaxError(conclusao);

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
          placeholder="Ex: Se Deus existe, então a vida tem significado. Deus existe. Portanto, a vida tem significado."
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
          placeholder="Ex: Modus Ponens ou Silogismo Hipotético"
          className="w-full bg-base border border-border-subtle rounded-lg p-3 text-text-main focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Resposta Esperada com Barra de Atalhos e Modo de Validação Integrado */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-text-main font-semibold">
            Resposta Esperada (Premissas e Conclusão)
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
              title="Semântico: aceita equivalências lógicas e alfa-conversão automaticamente. Estrito: exige fórmula exata."
            >
              <option value="semantico">Semântico (Automático)</option>
              <option value="estrito">Estrito (Exato)</option>
            </select>
          </div>
        </div>

        {/* Premissas */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-main">
              Premissas <span className="text-text-muted font-normal">(Ordem independente)</span>
            </span>
            <button
              type="button"
              onClick={handleAddPremissa}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <Plus size={13} /> Adicionar Premissa
            </button>
          </div>

          <div className="space-y-2.5">
            {premissas.map((premisa, idx) => {
              const pError = getSyntaxError(premisa);
              return (
                <div key={idx} className="space-y-1">
                  <div
                    className={`rounded-lg border bg-base overflow-hidden transition-colors ${
                      pError
                        ? 'border-error focus-within:border-error'
                        : 'border-border-subtle focus-within:border-primary'
                    }`}
                  >
                    {/* Barra de atalhos acoplada */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/70 border-b border-border-subtle font-mono text-xs overflow-x-auto">
                      <span className="text-text-muted font-sans text-[11px] mr-1 select-none">
                        Símbolos:
                      </span>
                      {SYMBOL_SHORTCUTS.map((sym) => (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleInsertSymbolInPremissa(idx, sym)}
                          className="px-2.5 py-0.5 bg-surface border border-border-subtle rounded text-text-main hover:bg-primary hover:border-primary hover:text-white transition-colors font-bold text-xs"
                        >
                          {sym}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center">
                      <span className="px-3 text-text-muted font-mono font-semibold select-none text-xs border-r border-border-subtle/40 py-2.5 bg-surface/30">
                        P{idx + 1}:
                      </span>
                      <input
                        type="text"
                        value={premisa}
                        onChange={(e) => handleUpdatePremissa(idx, e.target.value)}
                        placeholder="Ex: P → Q ou ∀x(Px → Qx)"
                        className="flex-1 bg-transparent px-3 py-2.5 text-text-main font-mono text-base focus:outline-none"
                      />
                      {premissas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePremissa(idx)}
                          className="p-2.5 text-text-muted hover:text-error transition-colors mr-1"
                          title="Remover premissa"
                          aria-label="Remover premissa"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {pError && (
                    <p className="text-error text-xs mt-1 font-medium flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 bg-error rounded-full" />
                      {pError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Conclusão */}
        <div className="space-y-1.5 pt-3">
          <span className="text-xs font-semibold text-text-main">Conclusão</span>

          <div
            className={`rounded-lg border bg-base overflow-hidden transition-colors ${
              cError
                ? 'border-error focus-within:border-error'
                : 'border-border-subtle focus-within:border-primary'
            }`}
          >
            {/* Barra de atalhos acoplada */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/70 border-b border-border-subtle font-mono text-xs overflow-x-auto">
              <span className="text-text-muted font-sans text-[11px] mr-1 select-none">
                Símbolos:
              </span>
              {SYMBOL_SHORTCUTS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleInsertSymbolInConclusao(sym)}
                  className="px-2.5 py-0.5 bg-surface border border-border-subtle rounded text-text-main hover:bg-primary hover:border-primary hover:text-white transition-colors font-bold text-xs"
                >
                  {sym}
                </button>
              ))}
            </div>

            <div className="flex items-center">
              <span className="px-3 text-text-muted font-mono font-semibold select-none text-xs border-r border-border-subtle/40 py-2.5 bg-surface/30">
                C:
              </span>
              <input
                type="text"
                value={conclusao}
                onChange={(e) => handleUpdateConclusao(e.target.value)}
                placeholder="Ex: Q ou ∃x(Qx)"
                className="flex-1 bg-transparent px-3 py-2.5 text-text-main font-mono text-base focus:outline-none"
              />
            </div>
          </div>

          {cError && (
            <p className="text-error text-xs mt-1 font-medium flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 bg-error rounded-full" />
              {cError}
            </p>
          )}
        </div>

        {error && !cError && (
          <p className="text-error text-xs mt-2 font-medium flex items-center gap-1.5">
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
            {fullArgumentText.length > 0 && (
              <button
                type="button"
                onClick={handleSyncDicasFromArgument}
                className="text-xs text-text-muted hover:text-primary flex items-center gap-1 transition-colors"
                title="Extrai os predicados e variáveis do argumento para as dicas"
              >
                <Sparkles size={13} /> Sincronizar Dicas
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
          {fullArgumentText.length > 0 && (
            <button
              type="button"
              onClick={() => handleAutoConfigureKeyboard(true)}
              className="text-xs text-text-muted hover:text-primary flex items-center gap-1 transition-colors"
              title="Configura automaticamente os operadores do argumento com distratores"
            >
              <Wand2 size={13} /> Auto-sugerir
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_KEYS.map((sym) => {
          {Array.from(new Set([
            ...AVAILABLE_KEYS,
            ...(fullArgumentText.match(/[a-zA-Z]/g) || []),
            ...question.teclado_virtual
          ])).filter(k => k !== '(' && k !== ')').map((sym) => {
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
