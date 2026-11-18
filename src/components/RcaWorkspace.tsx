import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Edit3,
  FileJson,
  FileSpreadsheet,
  GitBranch,
  Layers,
  Network,
  Plus,
  Printer,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import {
  EvidenceCard4P,
  EvidenceCategory4P,
  EvidenceValidationStatus,
  IncidentCase,
  PermenakerNodeCode,
  RcaNodeRole,
  RcaTreeNode,
} from '../types/k3';
import {
  autoMapPermenaker,
  calculateBnspRubric,
  evaluateRcaLogic,
  generateActionsFromRootCause,
} from '../utils/k3Calculations';
import { FaultTreeDiagram } from './FaultTreeDiagram';
import { FishboneDiagram } from './FishboneDiagram';
import { FiveWhysTree } from './FiveWhysTree';

interface RcaWorkspaceProps {
  allCases: IncidentCase[];
  activeCase: IncidentCase;
  onSelectCaseId: (id: string) => void;
  onUpdateCase: (updated: IncidentCase) => void;
  onOpenNewCaseModal: () => void;
  onOpenReportModal: () => void;
  onExportJson: (c: IncidentCase) => void;
  onExportCsv: () => void;
}

type RcaTab = 'five_whys' | 'fishbone' | 'fta';

const VALIDATION_STATUSES: EvidenceValidationStatus[] = [
  'Fakta Terverifikasi',
  'Asumsi/Opini',
  'Informasi Anomali',
];

export const RcaWorkspace: React.FC<RcaWorkspaceProps> = ({
  allCases,
  activeCase,
  onSelectCaseId,
  onUpdateCase,
  onOpenNewCaseModal,
  onOpenReportModal,
  onExportJson,
  onExportCsv,
}) => {
  const [activeRcaTab, setActiveRcaTab] = useState<RcaTab>('five_whys');
  const [newFactCategory, setNewFactCategory] = useState<EvidenceCategory4P>('people');
  const [newFactText, setNewFactText] = useState('');
  const [newFactStatus, setNewFactStatus] =
    useState<EvidenceValidationStatus>('Fakta Terverifikasi');
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editingFactText, setEditingFactText] = useState('');
  const [auditTriggered, setAuditTriggered] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const auditResult = useMemo(() => evaluateRcaLogic(activeCase), [activeCase]);
  const permenakerMap = useMemo(() => autoMapPermenaker(activeCase), [activeCase]);
  const bnspRubric = useMemo(() => calculateBnspRubric(activeCase), [activeCase]);

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFactText.trim();
    if (!trimmed) return;

    const newCard: EvidenceCard4P = {
      id: `${newFactCategory}-${Date.now()}`,
      text: trimmed,
      status: newFactStatus,
    };

    onUpdateCase({
      ...activeCase,
      facts_4p: {
        ...activeCase.facts_4p,
        [newFactCategory]: [...activeCase.facts_4p[newFactCategory], newCard],
      },
    });
    setNewFactText('');
  };

  const handleCycleFactStatus = (category: EvidenceCategory4P, factId: string) => {
    const updatedList = activeCase.facts_4p[category].map((item) => {
      if (item.id !== factId) return item;
      const nextIdx = (VALIDATION_STATUSES.indexOf(item.status) + 1) % VALIDATION_STATUSES.length;
      return { ...item, status: VALIDATION_STATUSES[nextIdx] };
    });

    onUpdateCase({
      ...activeCase,
      facts_4p: {
        ...activeCase.facts_4p,
        [category]: updatedList,
      },
    });
  };

  const handleDeleteFact = (category: EvidenceCategory4P, factId: string) => {
    onUpdateCase({
      ...activeCase,
      facts_4p: {
        ...activeCase.facts_4p,
        [category]: activeCase.facts_4p[category].filter((item) => item.id !== factId),
      },
    });
  };

  const handleSaveEditFact = (category: EvidenceCategory4P, factId: string) => {
    if (!editingFactText.trim()) return;
    const updatedList = activeCase.facts_4p[category].map((item) =>
      item.id === factId ? { ...item, text: editingFactText.trim() } : item
    );
    onUpdateCase({
      ...activeCase,
      facts_4p: {
        ...activeCase.facts_4p,
        [category]: updatedList,
      },
    });
    setEditingFactId(null);
  };

  const handleAddRcaChild = (parentId: string) => {
    const parent = activeCase.rca_tree_nodes.find((n) => n.id === parentId);
    if (!parent) return;

    const nextLevel = parent.level + 1;
    let defaultRole: RcaNodeRole = 'Contributing Factor';
    let defaultCode: PermenakerNodeCode = 'KODE_D1';
    if (nextLevel === 1) {
      defaultRole = 'Direct Cause';
      defaultCode = 'KODE_D1';
    } else if (nextLevel >= 4) {
      defaultRole = 'Root Cause';
      defaultCode = 'KODE_E_MANAGEMENT';
    }

    const whyNum = activeCase.rca_tree_nodes.length;
    const newNode: RcaTreeNode = {
      id: `node_${Date.now()}`,
      parentId,
      level: nextLevel,
      label:
        defaultRole === 'Root Cause'
          ? `Why ${whyNum} (Root Cause): Sistem manajemen pengawasan & prosedur kerja belum efektif`
          : `Why ${whyNum}: Faktor penyebab turunan baru (klik ikon pensil untuk ubah)`,
      role: defaultRole,
      permenakerCode: defaultCode,
    };

    onUpdateCase({
      ...activeCase,
      rca_tree_nodes: [...activeCase.rca_tree_nodes, newNode],
    });
  };

  const handleUpdateRcaNode = (
    nodeId: string,
    updates: Partial<Pick<RcaTreeNode, 'label' | 'role' | 'permenakerCode'>>
  ) => {
    onUpdateCase({
      ...activeCase,
      rca_tree_nodes: activeCase.rca_tree_nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    });
  };

  const handleDeleteRcaNode = (nodeId: string) => {
    // Collect nodeId and all descendants recursively
    const toRemove = new Set<string>([nodeId]);
    let added = true;
    while (added) {
      added = false;
      for (const n of activeCase.rca_tree_nodes) {
        if (n.parentId && toRemove.has(n.parentId) && !toRemove.has(n.id)) {
          toRemove.add(n.id);
          added = true;
        }
      }
    }

    onUpdateCase({
      ...activeCase,
      rca_tree_nodes: activeCase.rca_tree_nodes.filter((n) => !toRemove.has(n.id)),
    });
  };

  const handleGenerateActions = () => {
    const newActions = generateActionsFromRootCause(activeCase);
    if (newActions.length === 0) {
      setActionFeedback('Seluruh Root Cause saat ini sudah memiliki rekomendasi aksi Kode E.');
      return;
    }
    onUpdateCase({
      ...activeCase,
      corrective_actions_kode_e: [...activeCase.corrective_actions_kode_e, ...newActions],
    });
    setActionFeedback(`${newActions.length} rekomendasi Kode E berhasil diturunkan dari Root Cause.`);
  };

  const factBadgeColor = (status: EvidenceValidationStatus) => {
    if (status === 'Fakta Terverifikasi') return 'text-emerald-400';
    if (status === 'Informasi Anomali') return 'text-rose-400';
    return 'text-amber-400';
  };

  return (
    <main className="mx-auto max-w-[1440px] space-y-4 px-4 py-4 sm:px-6">
      {/* Top Scenario Selector & Action Bar */}
      <section className="rounded-xl border border-[#1E3558] bg-[#10203B] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label htmlFor="workspace-case-select" className="block text-[11px] font-semibold text-slate-400 mb-1">
                Pilih Skenario Kasus Investigasi
              </label>
              <select
                id="workspace-case-select"
                value={activeCase.incident_id}
                onChange={(e) => onSelectCaseId(e.target.value)}
                className="w-full sm:w-[400px] rounded-md border border-[#284572] bg-[#0B1930] px-3 py-2 text-xs font-semibold text-white focus:border-emerald-400 focus:outline-none"
              >
                {allCases.map((c) => (
                  <option key={c.incident_id} value={c.incident_id}>
                    {c.incident_id} — {c.title} ({c.victim_details.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onOpenNewCaseModal}
              className="mt-4 sm:mt-5 inline-flex items-center gap-1.5 rounded-md border border-sky-400/40 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/25 cursor-pointer whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Input Kasus Baru / Import JSON</span>
            </button>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onExportJson(activeCase)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#284572] bg-[#0B1930] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400/50 hover:text-white cursor-pointer whitespace-nowrap"
            >
              <FileJson className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              <span>Unduh JSON</span>
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#284572] bg-[#0B1930] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400/50 hover:text-white cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>Unduh CSV</span>
            </button>
            <button
              type="button"
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cetak Lampiran II (PDF)</span>
            </button>
          </div>
        </div>

        {/* Victim, KLUI & Chronology Banner */}
        <div className="mt-3.5 grid grid-cols-1 gap-3 border-t border-[#1E3558] pt-3 lg:grid-cols-12">
          <div className="lg:col-span-5 text-xs space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-semibold text-white">
              <span>{activeCase.victim_details.name}</span>
              <span className="text-slate-400">&middot;</span>
              <span className="text-sky-300">
                {activeCase.victim_details.age} thn ({activeCase.victim_details.role})
              </span>
              <span className="text-slate-400">&middot;</span>
              <span className="font-mono-tabular text-slate-300">
                BPJS KPA: {activeCase.victim_details.bpjs_kpa}
              </span>
            </div>
            <p className="text-amber-300 font-medium">
              Kode A: {activeCase.victim_details.severity_kode_a} ({activeCase.victim_details.injured_body_part})
            </p>
            <p className="text-[11px] text-slate-400">
              {activeCase.project_name} &middot; KLUI {activeCase.klui_code} &middot; {activeCase.location} &middot;{' '}
              <span className="font-mono-tabular">{activeCase.incident_date.replace('T', ' ')}</span>
            </p>
          </div>
          <div className="lg:col-span-7 rounded-lg border border-[#223B64] bg-[#0B1930] px-3 py-2 text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-100">Kronologi Kejadian: </span>
            {activeCase.chronology}
          </div>
        </div>
      </section>

      {/* Main 3-Column RCA Workbench */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* LEFT COLUMN (3 cols): Evidence Sorting Board 4P */}
        <section
          aria-label="Kanban Bukti Lapangan 4P"
          className="rounded-xl border border-[#1E3558] bg-[#132544] p-4 xl:col-span-3 flex flex-col"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Evidence Explorer 4P</h2>
              <p className="text-[11px] text-slate-400">
                Klik status bukti untuk verifikasi objektivitas
              </p>
            </div>
          </div>

          {/* Add Evidence Form */}
          <form onSubmit={handleAddFact} className="mb-4 space-y-2 rounded-lg border border-[#223B64] bg-[#0B1930] p-2.5">
            <div className="grid grid-cols-2 gap-1.5">
              <label className="sr-only" htmlFor="new-fact-category">
                Kategori 4P
              </label>
              <select
                id="new-fact-category"
                value={newFactCategory}
                onChange={(e) => setNewFactCategory(e.target.value as EvidenceCategory4P)}
                className="rounded border border-[#284572] bg-[#10203B] px-2 py-1.5 text-[11px] font-semibold text-slate-100"
              >
                <option value="people">People</option>
                <option value="parts">Parts</option>
                <option value="position">Position</option>
                <option value="paper">Paper</option>
              </select>

              <label className="sr-only" htmlFor="new-fact-status">
                Status Validasi Bukti
              </label>
              <select
                id="new-fact-status"
                value={newFactStatus}
                onChange={(e) => setNewFactStatus(e.target.value as EvidenceValidationStatus)}
                className="rounded border border-[#284572] bg-[#10203B] px-2 py-1.5 text-[11px] font-semibold text-slate-100"
              >
                {VALIDATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-1.5">
              <label className="sr-only" htmlFor="new-fact-input">
                Tambah Temuan Bukti 4P
              </label>
              <input
                id="new-fact-input"
                type="text"
                placeholder="Tambah temuan fakta lapangan..."
                value={newFactText}
                onChange={(e) => setNewFactText(e.target.value)}
                className="min-w-0 flex-1 rounded border border-[#284572] bg-[#10203B] px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Tambah bukti 4P"
                className="inline-flex items-center justify-center rounded bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </form>

          {/* 4P Columns List */}
          <div className="space-y-3 overflow-y-auto max-h-[680px] pr-1">
            {(
              [
                { key: 'people', label: 'PEOPLE (Manusia / Peran)' },
                { key: 'parts', label: 'PARTS (Alat / Material)' },
                { key: 'position', label: 'POSITION (Lokasi / Fisik)' },
                { key: 'paper', label: 'PAPER (Dokumen / PTW / JSA)' },
              ] as const
            ).map((pillar) => (
              <div
                key={pillar.key}
                className="rounded-lg border border-[#223B64] bg-[#0D1D37] p-2.5"
              >
                <div className="mb-2 flex items-center justify-between border-b border-[#1E3558] pb-1">
                  <h3 className="text-[11px] font-bold text-sky-300">{pillar.label}</h3>
                  <span className="font-mono-tabular text-[11px] text-slate-400">
                    {activeCase.facts_4p[pillar.key].length}
                  </span>
                </div>
                <div className="space-y-2">
                  {activeCase.facts_4p[pillar.key].map((card) => (
                    <div
                      key={card.id}
                      className="rounded-md border border-[#253F6A] bg-[#142748] p-2 text-xs"
                    >
                      {editingFactId === card.id ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            aria-label="Edit teks fakta 4P"
                            value={editingFactText}
                            onChange={(e) => setEditingFactText(e.target.value)}
                            className="w-full rounded border border-[#32548B] bg-[#0B1930] px-2 py-1 text-xs text-white"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingFactId(null)}
                              className="rounded bg-slate-700 px-2 py-0.5 text-[11px] text-white cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditFact(pillar.key, card.id)}
                              className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] text-white cursor-pointer"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-slate-100 leading-snug">{card.text}</p>
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleCycleFactStatus(pillar.key, card.id)}
                              className={`text-[10px] font-semibold hover:underline cursor-pointer ${factBadgeColor(
                                card.status
                              )}`}
                              title="Klik untuk ganti status validasi bukti"
                            >
                              {card.status}
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFactId(card.id);
                                  setEditingFactText(card.text);
                                }}
                                aria-label={`Edit fakta ${card.id}`}
                                className="rounded p-1 text-slate-400 hover:bg-[#1E3558] hover:text-white cursor-pointer"
                              >
                                <Edit3 className="h-3 w-3" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFact(pillar.key, card.id)}
                                aria-label={`Hapus fakta ${card.id}`}
                                className="rounded p-1 text-slate-400 hover:bg-rose-900/50 hover:text-rose-300 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CENTER COLUMN (6 cols): Multi-Method RCA Engine */}
        <section
          aria-label="Engine Simulasi RCA Multi-Metode"
          className="rounded-xl border border-[#1E3558] bg-[#132544] p-4 xl:col-span-6 flex flex-col"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white whitespace-nowrap">Simulasi RCA Multi-Metode</h2>
            <div
              role="tablist"
              aria-label="Metode Analisis Akar Masalah"
              className="flex items-center gap-1 rounded-lg border border-[#223B64] bg-[#0B1930] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeRcaTab === 'five_whys'}
                onClick={() => setActiveRcaTab('five_whys')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeRcaTab === 'five_whys'
                    ? 'bg-[#1D3E73] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <GitBranch className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span>5-Whys Tree</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeRcaTab === 'fishbone'}
                onClick={() => setActiveRcaTab('fishbone')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeRcaTab === 'fishbone'
                    ? 'bg-[#1D3E73] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                <span>Fishbone 4P</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeRcaTab === 'fta'}
                onClick={() => setActiveRcaTab('fta')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeRcaTab === 'fta'
                    ? 'bg-[#1D3E73] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Network className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                <span>Fault Tree (FTA)</span>
              </button>
            </div>
          </div>

          <div className="flex-1">
            {activeRcaTab === 'five_whys' && (
              <FiveWhysTree
                nodes={activeCase.rca_tree_nodes}
                onAddChild={handleAddRcaChild}
                onUpdateNode={handleUpdateRcaNode}
                onDeleteNode={handleDeleteRcaNode}
              />
            )}
            {activeRcaTab === 'fishbone' && (
              <FishboneDiagram
                incidentTitle={activeCase.title}
                kodeC={permenakerMap.kodeC}
                facts4P={activeCase.facts_4p}
              />
            )}
            {activeRcaTab === 'fta' && (
              <FaultTreeDiagram
                topEvent={permenakerMap.kodeC}
                nodes={activeCase.rca_tree_nodes}
              />
            )}
          </div>
        </section>

        {/* RIGHT COLUMN (3 cols): AI Auditor, Permenaker Mapper, BNSP Rubric & Action Generator */}
        <section
          aria-label="Auditor Logika RCA, Mapper Regulasi dan Rubrik BNSP"
          className="space-y-4 xl:col-span-3"
        >
          {/* 1. Co-Investigator & Validator Logika */}
          <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Co-Investigator &amp; Validator Logika RCA
                </h2>
                <p className="text-[11px] text-slate-400">
                  Audit kausalitas rule-based lokal selaras BNSP &amp; Permenaker 03/1998
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuditTriggered(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#1D3E73] border border-[#3661A8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#254D8F] cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                <span>Validate RCA Logic</span>
              </button>
            </div>

            {auditTriggered && (
              <div className="space-y-2.5" data-testid="rca-audit-panel">
                <div
                  className={`rounded-lg border p-3 text-xs ${
                    auditResult.overallValid
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {auditResult.overallValid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <div>
                      <p className="font-bold">
                        Skor Audit Logika: {auditResult.scorePct}% &mdash;{' '}
                        {auditResult.overallValid ? 'VALID' : 'PERLU REVISI'}
                      </p>
                      <p className="mt-0.5 leading-snug">{auditResult.summary}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {auditResult.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className="rounded-md border border-[#223B64] bg-[#0D1D37] px-3 py-2 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-2 font-semibold">
                        <span className="text-slate-200">{chk.pillar}</span>
                        <span
                          className={
                            chk.status === 'PASS'
                              ? 'text-emerald-400'
                              : chk.status === 'WARN'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }
                        >
                          {chk.status}
                        </span>
                      </div>
                      <p className="mt-0.5 font-medium text-white">{chk.title}</p>
                      <p className="mt-0.5 text-slate-400 leading-snug">{chk.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Permenaker 03/1998 Auto-Mapper */}
          <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ClipboardCheck className="h-4 w-4 text-sky-400" aria-hidden="true" />
                <span>Permenaker 03/1998 Auto-Mapper</span>
              </h2>
              <button
                type="button"
                onClick={handleGenerateActions}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
              >
                <Wand2 className="h-3 w-3" aria-hidden="true" />
                <span>Generate Kode E</span>
              </button>
            </div>

            {actionFeedback && (
              <p className="mb-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-300">
                {actionFeedback}
              </p>
            )}

            <dl className="space-y-2 text-xs">
              <div className="rounded-md border border-[#223B64] bg-[#0D1D37] p-2.5">
                <dt className="text-[11px] font-bold text-rose-300">Kode A (Akibat Cidera)</dt>
                <dd className="mt-0.5 text-slate-100">{permenakerMap.kodeA}</dd>
              </div>
              <div className="rounded-md border border-[#223B64] bg-[#0D1D37] p-2.5">
                <dt className="text-[11px] font-bold text-amber-300">Kode C (Sumber Kecelakaan)</dt>
                <dd className="mt-0.5 text-slate-100">{permenakerMap.kodeC}</dd>
              </div>
              <div className="rounded-md border border-[#223B64] bg-[#0D1D37] p-2.5">
                <dt className="text-[11px] font-bold text-emerald-300">
                  Kode D1 (Kondisi Berbahaya)
                </dt>
                <dd className="mt-0.5 text-slate-200 space-y-0.5">
                  {permenakerMap.kodeD1.map((item, idx) => (
                    <div key={idx}>&bull; {item}</div>
                  ))}
                </dd>
              </div>
              <div className="rounded-md border border-[#223B64] bg-[#0D1D37] p-2.5">
                <dt className="text-[11px] font-bold text-orange-300">
                  Kode D2 (Tindakan Berbahaya)
                </dt>
                <dd className="mt-0.5 text-slate-200 space-y-0.5">
                  {permenakerMap.kodeD2.map((item, idx) => (
                    <div key={idx}>&bull; {item}</div>
                  ))}
                </dd>
              </div>
              <div className="rounded-md border border-[#223B64] bg-[#0D1D37] p-2.5">
                <dt className="text-[11px] font-bold text-sky-300">
                  Kode E (Tindakan Korektif Terjadwal)
                </dt>
                <dd className="mt-0.5 text-slate-200 space-y-1">
                  {permenakerMap.kodeE.map((item, idx) => (
                    <div key={idx}>&bull; {item}</div>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {/* 3. Rubrik Evaluasi Kompetensi BNSP */}
          <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-4" data-testid="bnsp-rubric-panel">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <span>Rubrik Kompetensi BNSP</span>
              </h2>
              <div className="text-right">
                <span className="font-mono-tabular text-lg font-bold text-emerald-400">
                  {bnspRubric.totalScore}/100
                </span>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between rounded-md border border-emerald-500/30 bg-[#0D1D37] px-3 py-2 text-xs">
              <span className="text-slate-300">Predikat Asesor BNSP</span>
              <span className="font-bold text-emerald-400">{bnspRubric.grade}</span>
            </div>

            <div className="space-y-2.5">
              {bnspRubric.dimensions.map((dim) => (
                <div key={dim.key} className="text-xs">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-200">
                      {dim.label} ({dim.weightPct}%)
                    </span>
                    <span className="font-mono-tabular font-bold text-sky-300">
                      {dim.score}% ({dim.weightedScore} poin)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0B1930]">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">{dim.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
