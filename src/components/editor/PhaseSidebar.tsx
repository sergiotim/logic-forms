import React, { useState, useRef } from 'react';
import { Phase, LucideIconName } from '@/types';
import { ICON_MAP, ICON_OPTIONS } from '@/lib/icons';
import { Button } from '@/components/ui/Button';
import { Plus, X, GripVertical, UploadCloud } from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

interface PhaseSidebarProps {
  phases: Phase[];
  selectedPhaseId: string | null;
  onSelectPhase: (phaseId: string) => void;
  onCreatePhase: (titulo: string, icone: LucideIconName) => void;
  onReorderPhases: (oldIndex: number, newIndex: number) => void;
  onImportPackage?: (pkg: unknown) => void;
}

interface SortablePhaseItemProps {
  fase: Phase;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

function SortablePhaseItem({ fase, index, isSelected, onSelect }: SortablePhaseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fase.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const IconComp = ICON_MAP[fase.icone] || ICON_MAP.Network;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group w-full p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
        isDragging
          ? 'opacity-90 scale-[1.02] shadow-2xl border-primary bg-surface'
          : isSelected
          ? 'bg-primary/15 border-primary text-white shadow-sm'
          : 'bg-base border-border-subtle text-text-muted hover:text-white hover:border-border-subtle/80'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing p-1 text-text-muted/60 hover:text-white rounded transition-colors shrink-0"
        title="Arraste para reordenar a fase"
        aria-label={`Reordenar fase ${fase.titulo}`}
      >
        <GripVertical size={16} />
      </div>

      {/* Botão de seleção */}
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 min-w-0 flex items-center gap-3 text-left focus:outline-none"
      >
        <div
          className={`p-2 rounded-lg shrink-0 ${
            isSelected ? 'bg-primary text-white' : 'bg-surface text-primary'
          }`}
        >
          <IconComp size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-xs font-mono font-semibold text-text-muted">
              Fase {index + 1}
            </span>
            <span className="text-xs font-mono text-text-muted">
              {fase.questoes.length} Q
            </span>
          </div>
          <h4 className="font-bold text-sm text-white truncate">{fase.titulo}</h4>
        </div>
      </button>
    </div>
  );
}

export const PhaseSidebar: React.FC<PhaseSidebarProps> = ({
  phases,
  selectedPhaseId,
  onSelectPhase,
  onCreatePhase,
  onReorderPhases,
  onImportPackage,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPhaseTitle, setNewPhaseTitle] = useState('');
  const [newPhaseIcon, setNewPhaseIcon] = useState<LucideIconName>('Network');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = phases.findIndex((p) => p.id === active.id);
      const newIndex = phases.findIndex((p) => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderPhases(oldIndex, newIndex);
      }
    }
  };

  const handleConfirmCreate = () => {
    const trimmed = newPhaseTitle.trim();
    if (!trimmed) return;
    onCreatePhase(trimmed, newPhaseIcon);
    setNewPhaseTitle('');
    setNewPhaseIcon('Network');
    setShowCreateModal(false);
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      alert('Por favor, selecione um arquivo .json válido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (onImportPackage) {
          onImportPackage(parsed);
        }
      } catch {
        alert('Erro ao processar o arquivo: JSON corrompido ou inválido.');
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <aside
      data-testid="phase-sidebar"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full md:w-80 bg-surface border-r border-border-subtle flex flex-col shrink-0"
    >
      {/* Overlay de Drag-and-Drop */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs border-2 border-dashed border-primary z-50 flex flex-col items-center justify-center p-4 text-center pointer-events-none animate-in fade-in duration-150">
          <UploadCloud size={32} className="text-primary animate-bounce mb-2" />
          <p className="font-bold text-sm text-white">Solte o arquivo .json aqui</p>
          <p className="text-xs text-text-muted">Importação automática de fases</p>
        </div>
      )}

      {/* Input de arquivo invisível */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="Selecionar arquivo JSON para importar"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Header do Sidebar */}
      <div className="p-3.5 border-b border-border-subtle space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-bold text-white tracking-wide">Fases de Estudo</h2>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-base border border-border-subtle text-text-muted shrink-0">
              {phases.length}
            </span>
          </div>
          {onImportPackage && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-md border border-border-subtle bg-base text-text-muted hover:text-white hover:border-primary/50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Importar pacote de fases (.json)"
              aria-label="Importar pacote de fases"
            >
              <UploadCloud size={13} />
              <span>Importar</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="w-full py-2 px-3 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
        >
          <Plus size={15} />
          <span>Nova Fase</span>
        </button>
      </div>

      {/* Lista de Fases com Drag and Drop */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {phases.length === 0 ? (
          <div className="text-center py-8 px-4 text-text-muted text-sm">
            <p className="mb-3">Nenhuma fase cadastrada.</p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full py-2 px-3 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary-hover transition-colors cursor-pointer"
            >
              <Plus size={14} className="mr-1 inline" /> Nova Fase
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToParentElement, restrictToVerticalAxis]}
          >
            <SortableContext
              items={phases.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {phases.map((fase, idx) => (
                  <SortablePhaseItem
                    key={fase.id}
                    fase={fase}
                    index={idx}
                    isSelected={fase.id === selectedPhaseId}
                    onSelect={() => onSelectPhase(fase.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Modal de Criação de Fase */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border-subtle p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Criar Nova Fase</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-text-muted hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="modal-phase-title" className="block text-xs font-semibold text-text-muted uppercase mb-1">
                  Título da Fase
                </label>
                <input
                  id="modal-phase-title"
                  type="text"
                  value={newPhaseTitle}
                  onChange={(e) => setNewPhaseTitle(e.target.value)}
                  placeholder="Nome da fase (ex: Revisão Geral)"
                  className="w-full bg-base border border-border-subtle rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-2">
                  Ícone
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {ICON_OPTIONS.map((opt) => {
                    const IconComp = ICON_MAP[opt.name];
                    const isSelected = newPhaseIcon === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setNewPhaseIcon(opt.name)}
                        className={`p-2 rounded flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-base border-border-subtle text-text-muted hover:text-white'
                        }`}
                        title={opt.label}
                      >
                        <IconComp size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmCreate}
                disabled={!newPhaseTitle.trim()}
              >
                Criar
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
