import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Filter,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ActionTrackingStatus,
  DashboardFilters,
  DashboardKpis,
  ExposureBaseline,
  IncidentCase,
  IncidentCategory,
  SlaStatus,
} from '../types/k3';
import { buildAnalyticsSeries, formatIdr } from '../utils/k3Calculations';
import {
  AccidentTypeDoughnutChart,
  BodyPartHorizontalBarChart,
  CauseCorrelationBarChart,
  MonthlyTrendChart,
} from './ChartWidgets';

interface ExecutiveDashboardProps {
  allCases: IncidentCase[];
  filteredCases: IncidentCase[];
  filters: DashboardFilters;
  onChangeFilters: (next: DashboardFilters) => void;
  exposure: ExposureBaseline;
  onChangeExposure: (next: ExposureBaseline) => void;
  kpis: DashboardKpis;
  selectedCaseId: string;
  onSelectCaseId: (id: string) => void;
  onOpenInWorkspace: (id: string) => void;
  onUpdateActionStatus: (caseId: string, actionId: string, status: ActionTrackingStatus) => void;
}

const CATEGORIES: IncidentCategory[] = [
  'Kecelakaan Kerja',
  'Penyakit Akibat Kerja (PAK)',
  'Kebakaran, Peledakan & Limbah B3',
  'Kejadian Berbahaya Lainnya',
];

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  allCases,
  filteredCases,
  filters,
  onChangeFilters,
  exposure,
  onChangeExposure,
  kpis,
  selectedCaseId,
  onSelectCaseId,
  onOpenInWorkspace,
  onUpdateActionStatus,
}) => {
  const [showExposureEditor, setShowExposureEditor] = useState(false);

  const uniqueProjects = useMemo(
    () => Array.from(new Set(allCases.map((c) => c.project_name))),
    [allCases]
  );
  const uniqueYears = useMemo(
    () => Array.from(new Set(allCases.map((c) => c.incident_date.slice(0, 4)))).sort().reverse(),
    [allCases]
  );

  const analytics = useMemo(() => buildAnalyticsSeries(filteredCases), [filteredCases]);

  const activeCase = useMemo(() => {
    return (
      filteredCases.find((c) => c.incident_id === selectedCaseId) ||
      filteredCases[0] ||
      allCases[0]
    );
  }, [filteredCases, selectedCaseId, allCases]);

  const hasActiveFilters =
    filters.year !== 'ALL' ||
    filters.project !== 'ALL' ||
    filters.slaStatus !== 'ALL' ||
    filters.category !== 'ALL';

  const resetFilters = () => {
    onChangeFilters({
      year: 'ALL',
      project: 'ALL',
      slaStatus: 'ALL',
      category: 'ALL',
    });
  };

  const slaColorClass =
    kpis.slaCompliancePct >= 90
      ? 'text-emerald-400'
      : kpis.slaCompliancePct >= 75
      ? 'text-amber-400'
      : 'text-rose-400';

  const slaBarBg =
    kpis.slaCompliancePct >= 90
      ? 'bg-emerald-500'
      : kpis.slaCompliancePct >= 75
      ? 'bg-amber-500'
      : 'bg-rose-500';

  const renderSlaBadge = (status: SlaStatus, hours: number) => {
    if (status === 'COMPLIANT') {
      return (
        <span
          className="inline-flex items-center gap-1 font-semibold text-emerald-400"
          title="Terkirim < 48 jam (Memenuhi SLA 2x24 Jam)"
        >
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>COMPLIANT · {hours}j</span>
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span
          className="inline-flex items-center gap-1 font-semibold text-amber-400"
          title="Mendekati batas tenggat 48 jam"
        >
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>WARNING · {hours}j</span>
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 font-semibold text-rose-400"
        title="Terlambat > 48 jam (Berisiko sanksi Pasal 15 UU 1/1970)"
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>NON-COMPLIANT · {hours}j</span>
      </span>
    );
  };

  const nextActionStatus = (current: ActionTrackingStatus): ActionTrackingStatus => {
    if (current === 'Open') return 'In Progress';
    if (current === 'In Progress') return 'Verified Closed';
    return 'Open';
  };

  const actionStatusStyle = (status: ActionTrackingStatus) => {
    if (status === 'Verified Closed') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25';
    }
    if (status === 'In Progress') {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25';
    }
    return 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25';
  };

  return (
    <main className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
      {/* Sub-header & Global Filters Bar */}
      <section
        aria-label="Filter Global Dashboard K3"
        className="rounded-xl border border-[#1E3558] bg-[#10203B] p-4"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Dashboard Investigasi Kecelakaan &amp; Kepatuhan K3
            </h1>
            <p className="mt-0.5 text-xs text-slate-300">
              Standardisasi Permenaker No. 03/MEN/1998 (Pasal 2 &amp; 3) &middot; Pemantauan SLA Form 3 KK2 A (2x24 Jam)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mr-1">
              <Filter className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>Filter:</span>
            </div>

            <label className="sr-only" htmlFor="filter-year">
              Filter Tahun
            </label>
            <select
              id="filter-year"
              value={filters.year}
              onChange={(e) => onChangeFilters({ ...filters, year: e.target.value })}
              className="rounded-md border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-xs font-medium text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              <option value="ALL">Semua Tahun</option>
              {uniqueYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-project">
              Filter Proyek
            </label>
            <select
              id="filter-project"
              value={filters.project}
              onChange={(e) => onChangeFilters({ ...filters, project: e.target.value })}
              className="max-w-[220px] truncate rounded-md border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-xs font-medium text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              <option value="ALL">Semua Proyek / Lokasi</option>
              {uniqueProjects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-category">
              Filter Klasifikasi Peristiwa Permenaker 03/1998
            </label>
            <select
              id="filter-category"
              value={filters.category}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  category: e.target.value as DashboardFilters['category'],
                })
              }
              className="max-w-[240px] truncate rounded-md border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-xs font-medium text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              <option value="ALL">Semua 4 Klasifikasi Pasal 2 &amp; 3</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-sla">
              Filter Status Lapor 2x24 Jam
            </label>
            <select
              id="filter-sla"
              value={filters.slaStatus}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  slaStatus: e.target.value as DashboardFilters['slaStatus'],
                })
              }
              className="rounded-md border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-xs font-medium text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              <option value="ALL">Semua Status SLA 2x24 Jam</option>
              <option value="COMPLIANT">COMPLIANT (&lt; 48 Jam)</option>
              <option value="WARNING">WARNING (Mendekati 48 Jam)</option>
              <option value="NON_COMPLIANT">NON-COMPLIANT (&gt; 48 Jam)</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-md border border-[#2C4B7C] bg-[#162C50] px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-[#1D3966] cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowExposureEditor((v) => !v)}
              aria-expanded={showExposureEditor}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-emerald-400/50 cursor-pointer"
              title="Sesuaikan Total Jam Kerja Orang & Tenaga Kerja untuk kalkulasi FR/SR/IR"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
              <span>Basis Jam Kerja</span>
            </button>
          </div>
        </div>

        {showExposureEditor && (
          <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-[#1E3558] pt-3 text-xs">
            <div>
              <label htmlFor="exposure-manhours" className="block font-medium text-slate-300 mb-1">
                Total Jam Kerja Orang (Man-Hours)
              </label>
              <input
                id="exposure-manhours"
                type="number"
                min={1000}
                step={5000}
                value={exposure.totalManHours}
                onChange={(e) =>
                  onChangeExposure({
                    ...exposure,
                    totalManHours: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="w-44 rounded-md border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 font-mono-tabular text-slate-100 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="exposure-workers" className="block font-medium text-slate-300 mb-1">
                Rata-rata Jumlah Tenaga Kerja
              </label>
              <input
                id="exposure-workers"
                type="number"
                min={1}
                step={10}
                value={exposure.avgWorkers}
                onChange={(e) =>
                  onChangeExposure({
                    ...exposure,
                    avgWorkers: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="w-40 rounded-md border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 font-mono-tabular text-slate-100 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 pb-1">
              FR = (LTI &times; 1.000.000) &divide; Jam Kerja &middot; SR = (Hari Hilang &times; 1.000.000) &divide; Jam Kerja &middot; IR = (Total Kasus &times; 100) &divide; Tenaga Kerja
            </p>
          </div>
        )}
      </section>

      {/* Executive KPI Strip (9 Dynamic K3 Metrics) */}
      <section aria-label="Indikator Kinerja Utama K3" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
        <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-3.5">
          <p className="text-[11px] font-semibold text-slate-300">Total Insiden</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-white" data-testid="kpi-total-incidents">
            {kpis.totalIncidents}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Kasus berjalan</p>
        </div>

        <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-3.5">
          <p className="text-[11px] font-semibold text-slate-300">Lost Time Injury</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-white" data-testid="kpi-lti">
            {kpis.ltiCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Kasus LTI</p>
        </div>

        <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-3.5">
          <p className="text-[11px] font-semibold text-slate-300">Jam Kerja Hilang</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-white">
            {kpis.lostWorkHours.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-[11px] font-mono-tabular text-slate-400">
            {kpis.lostWorkDays} Hari kerja
          </p>
        </div>

        <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-3.5">
          <p className="text-[11px] font-semibold text-slate-300">Frequency Rate</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-sky-300" data-testid="kpi-fr">
            {kpis.frequencyRate.toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Per 10&#8310; jam kerja</p>
        </div>

        <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-3.5">
          <p className="text-[11px] font-semibold text-slate-300">Severity Rate</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-amber-300" data-testid="kpi-sr">
            {kpis.severityRate.toFixed(1)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Hari / 10&#8310; jam</p>
        </div>

        <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-3.5">
          <p className="text-[11px] font-semibold text-slate-300">Incident Rate</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-slate-100" data-testid="kpi-ir">
            {kpis.incidentRate.toFixed(2)}%
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Per 100 pekerja</p>
        </div>

        <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-3.5 col-span-2 sm:col-span-2 xl:col-span-2">
          <p className="text-[11px] font-semibold text-slate-300">Kerugian Properti &amp; Medis</p>
          <p className="mt-1.5 font-mono-tabular text-xl font-bold text-rose-300 leading-tight whitespace-nowrap">
            {formatIdr(kpis.totalFinancialLossIdr)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Estimasi biaya medis + kerusakan</p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-[#0F2A3F] p-3.5">
          <p className="text-[11px] font-semibold text-slate-200">SLA 2x24 Jam</p>
          <p className={`mt-1.5 font-mono-tabular text-2xl font-bold ${slaColorClass}`} data-testid="kpi-sla">
            {kpis.slaCompliancePct.toFixed(1)}%
          </p>
          <p className="mt-1 text-[11px] text-slate-300">
            {kpis.compliantCount + kpis.warningCount}/{kpis.totalIncidents} lapor &le; 48j
          </p>
        </div>

        <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-3.5">
          <p className="text-[11px] font-semibold text-slate-300">Closure Kode E</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-emerald-400" data-testid="kpi-closure">
            {kpis.actionClosureRatePct.toFixed(1)}%
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {kpis.closedActions}/{kpis.totalActions} aksi tuntas
          </p>
        </div>
      </section>

      {filteredCases.length === 0 ? (
        <section className="rounded-xl border border-[#1E3558] bg-[#10203B] p-10 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-white">
            Tidak Ada Kasus yang Cocok dengan Filter
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Ubah kombinasi tahun, proyek, klasifikasi peristiwa, atau status SLA 2x24 jam untuk menampilkan data analitik.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Semua Filter</span>
          </button>
        </section>
      ) : (
        <>
          {/* Middle Row: Charts & 4P Field Summary */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left 5 cols: Monthly Trend + Accident Type Doughnut */}
            <div className="space-y-4 lg:col-span-5">
              <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Tren Kejadian Insiden Bulanan</h2>
                  <span className="text-[11px] font-mono-tabular text-slate-400">
                    {filters.year === 'ALL' ? '2026' : filters.year}
                  </span>
                </div>
                <MonthlyTrendChart
                  labels={analytics.monthlyLabels}
                  counts={analytics.monthlyCounts}
                />
              </div>

              <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Distribusi Tipe Kecelakaan</h2>
                  <span className="text-[11px] text-slate-400">Kode C &amp; Klasifikasi</span>
                </div>
                <AccidentTypeDoughnutChart
                  labels={analytics.accidentTypeLabels}
                  counts={analytics.accidentTypeCounts}
                />
              </div>
            </div>

            {/* Right 7 cols: Analisis Fakta Lapangan (Metode 4P) for Selected Case */}
            <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-4 lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Analisis Fakta Lapangan (Metode 4P)
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Ringkasan bukti investigasi kasus terpilih &middot; Korban: {activeCase.victim_details.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="dashboard-case-focus" className="sr-only">
                      Pilih Kasus untuk Ringkasan 4P
                    </label>
                    <select
                      id="dashboard-case-focus"
                      value={activeCase.incident_id}
                      onChange={(e) => onSelectCaseId(e.target.value)}
                      className="max-w-[230px] truncate rounded-md border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-xs font-medium text-slate-100 focus:border-emerald-400 focus:outline-none"
                    >
                      {filteredCases.map((c) => (
                        <option key={c.incident_id} value={c.incident_id}>
                          {c.incident_id} &middot; {c.victim_details.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onOpenInWorkspace(activeCase.incident_id)}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 whitespace-nowrap cursor-pointer"
                    >
                      <span>Buka RCA</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Case Context Summary Line */}
                <div className="mb-4 rounded-lg border border-[#223B64] bg-[#0D1D37] px-3.5 py-2.5 text-xs text-slate-200 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-mono-tabular font-semibold text-emerald-300">
                    {activeCase.incident_id} ({activeCase.case_code})
                  </span>
                  <span aria-hidden="true" className="text-slate-500">&middot;</span>
                  <span>{activeCase.incident_category}</span>
                  <span aria-hidden="true" className="text-slate-500">&middot;</span>
                  <span>KLUI {activeCase.klui_code}</span>
                  <span aria-hidden="true" className="text-slate-500">&middot;</span>
                  <span className="text-amber-300">{activeCase.victim_details.severity_kode_a}</span>
                </div>

                {/* 4P Columns */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {(
                    [
                      { key: 'people', title: 'People (Personel)' },
                      { key: 'parts', title: 'Parts (Peralatan)' },
                      { key: 'position', title: 'Position (Lokasi/Lingkungan)' },
                      { key: 'paper', title: 'Paper (Dokumen/PTW)' },
                    ] as const
                  ).map((col) => (
                    <div
                      key={col.key}
                      className="rounded-lg border border-[#223B64] bg-[#0D1D37] p-3"
                    >
                      <h3 className="mb-2.5 border-b border-[#1E3558] pb-1.5 text-xs font-bold text-sky-300">
                        {col.title}
                      </h3>
                      <ul className="space-y-2">
                        {activeCase.facts_4p[col.key].length === 0 ? (
                          <li className="text-[11px] text-slate-500 italic">Belum ada catatan fakta.</li>
                        ) : (
                          activeCase.facts_4p[col.key].map((fact) => (
                            <li
                              key={fact.id}
                              className="rounded-md border border-[#243E68] bg-[#132544] p-2 text-xs text-slate-200"
                            >
                              <p className="leading-snug">{fact.text}</p>
                              <p className="mt-1 text-[10px] font-medium text-emerald-400">
                                {fact.status}
                              </p>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-[11px] text-slate-400">
                Lokasi: {activeCase.location} &middot; {activeCase.company_name}
              </p>
            </div>
          </section>

          {/* Bottom Row: Bar Charts + SLA Tracker + Action Tracking Kode E */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left 3 cols: D1 vs D2 + Body Parts */}
            <div className="space-y-4 lg:col-span-3">
              <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-4">
                <h2 className="mb-3 text-sm font-bold text-white">
                  Korelasi Penyebab (Kode D1 vs D2)
                </h2>
                <CauseCorrelationBarChart
                  d1Count={analytics.d1Count}
                  d2Count={analytics.d2Count}
                />
              </div>

              <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-4">
                <h2 className="mb-3 text-sm font-bold text-white">
                  Distribusi Bagian Tubuh yang Cidera
                </h2>
                <BodyPartHorizontalBarChart
                  labels={analytics.bodyPartLabels}
                  counts={analytics.bodyPartCounts}
                />
              </div>
            </div>

            {/* Center 5 cols: 2x24 Jam SLA Tracker (Form 3 KK2 A & Lampiran II-V) */}
            <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-4 lg:col-span-5 flex flex-col">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-white">
                  Kepatuhan Laporan Form 3 KK2 A (2x24 Jam)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Kewajiban lapor Pasal 4 Permenaker 03/1998 &middot; Sanksi keterlambatan Pasal 15 UU 1/1970
                </p>
              </div>

              {/* SLA Progress Bar */}
              <div className="mb-4 rounded-lg border border-[#223B64] bg-[#0D1D37] p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-300">Rasio Kepatuhan &le; 48 Jam</span>
                  <span className={`font-mono-tabular font-bold ${slaColorClass}`}>
                    {kpis.slaCompliancePct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#1C3258]">
                  <div
                    className={`h-full transition-all duration-300 ${slaBarBg}`}
                    style={{ width: `${Math.min(100, kpis.slaCompliancePct)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono-tabular">
                  <span className="text-emerald-400">Compliant: {kpis.compliantCount}</span>
                  <span className="text-amber-400">Warning: {kpis.warningCount}</span>
                  <span className="text-rose-400">Non-Compliant: {kpis.nonCompliantCount}</span>
                </div>
              </div>

              {/* SLA Table */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#223B64] text-[11px] font-semibold text-slate-400">
                      <th className="py-2 pr-2">Form KK2 A</th>
                      <th className="py-2 px-2">Tanggal</th>
                      <th className="py-2 px-2">Status SLA</th>
                      <th className="py-2 pl-2 text-right">Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3558]">
                    {filteredCases.map((c) => (
                      <tr
                        key={c.incident_id}
                        className={`transition-colors hover:bg-[#193056] ${
                          c.incident_id === activeCase.incident_id ? 'bg-[#172C50]' : ''
                        }`}
                      >
                        <td className="py-2.5 pr-2 font-mono-tabular font-semibold text-white whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onSelectCaseId(c.incident_id)}
                            className="hover:text-emerald-300 underline-offset-2 hover:underline cursor-pointer text-left"
                          >
                            {c.regulatory_compliance.form_3_kk2a_number}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 font-mono-tabular text-slate-300 whitespace-nowrap">
                          {c.incident_date.slice(0, 10)}
                        </td>
                        <td className="py-2.5 px-2 text-[11px] whitespace-nowrap">
                          {renderSlaBadge(
                            c.regulatory_compliance.sla_status,
                            c.regulatory_compliance.submission_hours_elapsed
                          )}
                        </td>
                        <td className="py-2.5 pl-2 text-right font-medium text-sky-300 whitespace-nowrap">
                          {c.regulatory_compliance.inspection_form_issued}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 4 cols: Rekomendasi Tindakan Korektif (Kode E) Tracking */}
            <div className="rounded-xl border border-[#1E3558] bg-[#132544] p-4 lg:col-span-4 flex flex-col">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Action Tracking Kode E (Hierarki Kontrol)
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Klik status untuk memperbarui progres verifikasi lapangan
                  </p>
                </div>
                <span className="font-mono-tabular text-xs font-bold text-emerald-400">
                  {kpis.closedActions}/{kpis.totalActions}
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
                {filteredCases.flatMap((c) =>
                  c.corrective_actions_kode_e.map((act) => (
                    <div
                      key={`${c.incident_id}-${act.id}`}
                      className="rounded-lg border border-[#223B64] bg-[#0D1D37] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold">
                            <span className="font-mono-tabular text-sky-300">{c.incident_id}</span>
                            <span aria-hidden="true" className="text-slate-500">&middot;</span>
                            <span className="text-amber-300">{act.hierarchy}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-200 leading-snug">
                            {act.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateActionStatus(
                              c.incident_id,
                              act.id,
                              nextActionStatus(act.status)
                            )
                          }
                          aria-label={`Ubah status ${act.id} pada ${c.incident_id}`}
                          className={`shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${actionStatusStyle(
                            act.status
                          )}`}
                        >
                          {act.status}
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>PIC: {act.pic}</span>
                        <span className="font-mono-tabular">Target: {act.target_date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
};
