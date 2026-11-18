import React from 'react';
import { BarChart3, FileCheck2, GitFork, Printer, ShieldAlert } from 'lucide-react';

export type ActivePillar = 'dashboard' | 'workspace';

interface BrandHeaderProps {
  activePillar: ActivePillar;
  onChangePillar: (pillar: ActivePillar) => void;
  slaCompliancePct: number;
  onOpenReportModal: () => void;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  activePillar,
  onChangePillar,
  slaCompliancePct,
  onOpenReportModal,
}) => {
  const slaTone =
    slaCompliancePct >= 90
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : slaCompliancePct >= 75
      ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
      : 'text-rose-400 border-rose-500/30 bg-rose-500/10';

  return (
    <header className="no-print sticky top-0 z-30 border-b border-[#1E3558] bg-[#0B1930]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Zone 1: Brand Emblem & Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 rounded-md border border-[#243E68] bg-white px-2 py-1 shadow-xs">
            {/* Crisp BNSP-inspired Shield + K3 Triangle SVG */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <path
                d="M12 2L4 5.5V11.5C4 16.8 7.4 21.6 12 23C16.6 21.6 20 16.8 20 11.5V5.5L12 2Z"
                fill="#0F2D5A"
              />
              <path
                d="M9 12.2L11.2 14.4L15.5 9.8"
                stroke="#F59E0B"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="10" stroke="#16A34A" strokeWidth="2.2" />
              <path d="M12 5V19M5 12H19" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-white sm:text-base whitespace-nowrap">
              K3 Investigator Pro
            </span>
            <span className="hidden text-[11px] font-medium text-slate-400 sm:block whitespace-nowrap">
              Permenaker No. 03/MEN/1998 &middot; Ahli Investigasi BNSP
            </span>
          </div>
        </div>

        {/* Zone 2: Primary Pillar Navigation */}
        <nav aria-label="Navigasi Modul Utama" className="flex items-center gap-1 rounded-lg border border-[#1E3558] bg-[#081325] p-1">
          <button
            type="button"
            onClick={() => onChangePillar('dashboard')}
            aria-current={activePillar === 'dashboard' ? 'page' : undefined}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activePillar === 'dashboard'
                ? 'bg-[#173564] text-white border border-[#2C528C]'
                : 'text-slate-300 hover:text-white hover:bg-[#112444]'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>Executive Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => onChangePillar('workspace')}
            aria-current={activePillar === 'workspace' ? 'page' : undefined}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activePillar === 'workspace'
                ? 'bg-[#173564] text-white border border-[#2C528C]'
                : 'text-slate-300 hover:text-white hover:bg-[#112444]'
            }`}
          >
            <GitFork className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            <span>Simulasi &amp; Investigasi RCA</span>
          </button>
        </nav>

        {/* Zone 3: SLA Readout & Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`hidden lg:inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold tabular-nums whitespace-nowrap ${slaTone}`}
            title="Persentase Kepatuhan Pelaporan Formulir Bentuk 3 KK2 A dalam 2x24 Jam"
          >
            {slaCompliancePct >= 90 ? (
              <FileCheck2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>SLA 2x24 Jam: {slaCompliancePct.toFixed(1)}%</span>
          </div>

          <button
            type="button"
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Laporan Lampiran II</span>
          </button>
        </div>
      </div>
    </header>
  );
};
