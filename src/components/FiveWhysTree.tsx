import React, { useState } from 'react';
import { Check, Edit3, Plus, Trash2, X } from 'lucide-react';
import { PermenakerNodeCode, RcaNodeRole, RcaTreeNode } from '../types/k3';

interface FiveWhysTreeProps {
  nodes: RcaTreeNode[];
  onAddChild: (parentId: string) => void;
  onUpdateNode: (
    nodeId: string,
    updates: Partial<Pick<RcaTreeNode, 'label' | 'role' | 'permenakerCode'>>
  ) => void;
  onDeleteNode: (nodeId: string) => void;
}

const ROLE_OPTIONS: RcaNodeRole[] = [
  'Incident/Symptom',
  'Direct Cause',
  'Contributing Factor',
  'Root Cause',
];

const CODE_OPTIONS: { value: PermenakerNodeCode; label: string }[] = [
  { value: 'KODE_C', label: 'Kode C (Sumber Kecelakaan)' },
  { value: 'KODE_D1', label: 'Kode D1 (Kondisi Berbahaya)' },
  { value: 'KODE_D2', label: 'Kode D2 (Tindakan Berbahaya)' },
  { value: 'KODE_E_MANAGEMENT', label: 'Kode E (Sistem Manajemen / Root Cause)' },
  { value: 'NONE', label: 'Belum Dipetakan' },
];

export const FiveWhysTree: React.FC<FiveWhysTreeProps> = ({
  nodes,
  onAddChild,
  onUpdateNode,
  onDeleteNode,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftRole, setDraftRole] = useState<RcaNodeRole>('Direct Cause');
  const [draftCode, setDraftCode] = useState<PermenakerNodeCode>('KODE_D1');

  const startEdit = (node: RcaTreeNode) => {
    setEditingId(node.id);
    setDraftLabel(node.label);
    setDraftRole(node.role);
    setDraftCode(node.permenakerCode);
  };

  const saveEdit = (nodeId: string) => {
    if (draftLabel.trim().length > 0) {
      onUpdateNode(nodeId, {
        label: draftLabel.trim(),
        role: draftRole,
        permenakerCode: draftCode,
      });
    }
    setEditingId(null);
  };

  const getNodeTheme = (node: RcaTreeNode) => {
    if (node.role === 'Incident/Symptom') {
      return 'border-rose-400/70 bg-gradient-to-b from-[#D9534F] to-[#B83B37] text-white';
    }
    if (node.role === 'Direct Cause') {
      return 'border-orange-300/60 bg-gradient-to-b from-[#EA8C2D] to-[#C86F18] text-slate-950';
    }
    if (node.role === 'Contributing Factor') {
      return 'border-amber-200/70 bg-gradient-to-b from-[#F4C443] to-[#D8A11F] text-slate-950';
    }
    return 'border-emerald-300/80 bg-gradient-to-b from-[#E77733] to-[#C75617] text-white ring-2 ring-emerald-400/40';
  };

  const formatCodeBadge = (code: PermenakerNodeCode) => {
    switch (code) {
      case 'KODE_C':
        return 'Kode C';
      case 'KODE_D1':
        return 'Kode D1';
      case 'KODE_D2':
        return 'Kode D2';
      case 'KODE_E_MANAGEMENT':
        return 'Kode E · Root Cause';
      default:
        return 'Unmapped';
    }
  };

  const rootNodes = nodes.filter((n) => n.parentId === null);

  const renderBranch = (node: RcaTreeNode): React.ReactNode => {
    const children = nodes.filter((n) => n.parentId === node.id);
    const isEditing = editingId === node.id;
    const isRoot = node.parentId === null;

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          data-testid={`rca-node-${node.id}`}
          className={`relative w-[225px] rounded-xl border p-3 shadow-md transition-all ${getNodeTheme(
            node
          )}`}
        >
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-bold">
            <span className="truncate opacity-90">
              {isRoot ? 'Node 0 · Insiden' : `Level ${node.level} · ${node.role}`}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onAddChild(node.id)}
                title="Tambah Cabang Why (Add Why Child)"
                aria-label={`Tambah cabang Why pada ${node.id}`}
                className="rounded p-1 bg-black/20 hover:bg-black/35 text-current transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => startEdit(node)}
                title="Edit Node RCA"
                aria-label={`Edit node ${node.id}`}
                className="rounded p-1 bg-black/20 hover:bg-black/35 text-current transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              {!isRoot && (
                <button
                  type="button"
                  onClick={() => onDeleteNode(node.id)}
                  title="Hapus Node & Sub-cabang"
                  aria-label={`Hapus node ${node.id}`}
                  className="rounded p-1 bg-black/20 hover:bg-rose-900/70 text-current transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-2 rounded-lg bg-[#0B1930]/95 p-2 text-slate-100">
              <label className="sr-only" htmlFor={`edit-text-${node.id}`}>
                Teks Node RCA
              </label>
              <textarea
                id={`edit-text-${node.id}`}
                rows={3}
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                className="w-full rounded border border-[#2B4B7C] bg-[#081325] p-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
              />
              <div className="grid grid-cols-1 gap-1.5">
                <select
                  aria-label="Klasifikasi Peran RCA"
                  value={draftRole}
                  onChange={(e) => setDraftRole(e.target.value as RcaNodeRole)}
                  className="rounded border border-[#2B4B7C] bg-[#081325] px-2 py-1 text-[11px] text-slate-100"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Kodifikasi Permenaker 03/1998"
                  value={draftCode}
                  onChange={(e) => setDraftCode(e.target.value as PermenakerNodeCode)}
                  className="rounded border border-[#2B4B7C] bg-[#081325] px-2 py-1 text-[11px] text-slate-100"
                >
                  {CODE_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="inline-flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-[11px] text-white hover:bg-slate-600 cursor-pointer"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => saveEdit(node.id)}
                  className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  <Check className="h-3 w-3" aria-hidden="true" />
                  Simpan
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold leading-snug">{node.label}</p>
              <div className="mt-2 flex items-center justify-between border-t border-black/15 pt-1.5 text-[11px] font-bold">
                <span>{formatCodeBadge(node.permenakerCode)}</span>
                <span className="opacity-80">L{node.level}</span>
              </div>
            </>
          )}
        </div>

        {/* Children Connectors & Sub-branches */}
        {children.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Vertical Stem Down */}
            <div className="h-5 w-0.5 bg-[#4B6B9E]" />

            {children.length > 1 && (
              <div className="relative flex w-full justify-center">
                <div className="h-0.5 w-[calc(100%-225px)] min-w-[40px] bg-[#4B6B9E]" />
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              {children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="relative flex flex-col items-center">
                    <div className="h-4 w-0.5 bg-[#4B6B9E]" />
                    <button
                      type="button"
                      onClick={() => onAddChild(node.id)}
                      title="Tambah cabang saudara pada level ini"
                      aria-label={`Tambah cabang baru dari ${node.id}`}
                      className="mb-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#4B6B9E] bg-[#132544] text-slate-200 hover:border-emerald-400 hover:text-emerald-300 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <div className="h-3 w-0.5 bg-[#4B6B9E]" />
                  </div>
                  {renderBranch(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Legend & Quick Instruction */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#223B64] bg-[#0B1930] px-3 py-2 text-[11px] text-slate-300">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#D9534F]" /> Incident (Kode C)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#EA8C2D]" /> Direct Cause (D1/D2)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#F4C443]" /> Contributing Factor
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#E77733] ring-1 ring-emerald-400" /> Root Cause (Kode E)
          </span>
        </div>
        <span className="text-slate-400">Klik + untuk menambah cabang Why, klik pensil untuk ubah/kodekan</span>
      </div>

      {/* Scrollable Causal Tree Canvas */}
      <div
        className="overflow-x-auto rounded-xl border border-[#1E3558] bg-[#0A172D] p-5 min-h-[440px]"
        data-testid="five-whys-canvas"
      >
        <div className="flex min-w-max flex-col items-center">
          {rootNodes.map((root) => renderBranch(root))}
        </div>
      </div>
    </div>
  );
};
