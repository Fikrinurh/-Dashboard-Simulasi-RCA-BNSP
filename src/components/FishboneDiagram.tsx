import React, { useState } from 'react';
import { EvidenceCard4P, Facts4P } from '../types/k3';

interface FishboneDiagramProps {
  incidentTitle: string;
  kodeC: string;
  facts4P: Facts4P;
}

export const FishboneDiagram: React.FC<FishboneDiagramProps> = ({
  incidentTitle,
  kodeC,
  facts4P,
}) => {
  const [selectedFact, setSelectedFact] = useState<{
    category: string;
    item: EvidenceCard4P;
  } | null>(null);

  const truncate = (str: string, max = 32) =>
    str.length > max ? `${str.slice(0, max - 1)}…` : str;

  const statusColor = (status: EvidenceCard4P['status']) => {
    if (status === 'Fakta Terverifikasi') return '#10B981';
    if (status === 'Informasi Anomali') return '#EF4444';
    return '#F59E0B';
  };

  const renderBoneItems = (
    items: EvidenceCard4P[],
    categoryLabel: string,
    startX: number,
    startY: number,
    isTop: boolean
  ) => {
    const visible = items.slice(0, 4);
    return visible.map((item, idx) => {
      const step = idx + 1;
      const yOffset = isTop ? startY + step * 34 : startY - step * 34;
      const xJoin = startX + step * 28;
      return (
        <g
          key={item.id}
          className="cursor-pointer"
          onClick={() => setSelectedFact({ category: categoryLabel, item })}
        >
          <line
            x1={xJoin - 135}
            y1={yOffset}
            x2={xJoin}
            y2={yOffset}
            stroke={statusColor(item.status)}
            strokeWidth="1.5"
            strokeDasharray={item.status === 'Asumsi/Opini' ? '3 3' : undefined}
          />
          <circle cx={xJoin} cy={yOffset} r="3.5" fill={statusColor(item.status)} />
          <text
            x={xJoin - 138}
            y={yOffset - 5}
            fill="#E2E8F0"
            fontSize="10.5"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            {truncate(item.text, 28)}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="space-y-3" data-testid="fishbone-diagram">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#223B64] bg-[#0B1930] px-3 py-2 text-[11px] text-slate-300">
        <span>Diagram Tulang Ikan (Ishikawa 4P) &rarr; Memetakan Fakta 4P ke Sumber Insiden (Kode C)</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Fakta Terverifikasi
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Asumsi/Opini
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Anomali
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1E3558] bg-[#0A172D] p-3">
        <svg
          viewBox="0 0 880 430"
          className="w-full h-auto"
          role="img"
          aria-label="Diagram Fishbone Ishikawa 4P Investigasi K3"
        >
          {/* Central Spine */}
          <line x1="40" y1="215" x2="660" y2="215" stroke="#60A5FA" strokeWidth="3.5" />
          <polygon points="660,208 674,215 660,222" fill="#60A5FA" />

          {/* Fish Head: Incident / Kode C */}
          <rect
            x="676"
            y="148"
            width="188"
            height="134"
            rx="10"
            fill="#991B1B"
            stroke="#F87171"
            strokeWidth="2"
          />
          <text
            x="770"
            y="174"
            textAnchor="middle"
            fill="#FECACA"
            fontSize="10.5"
            fontWeight="700"
          >
            AKIBAT / KODE C
          </text>
          <foreignObject x="688" y="182" width="164" height="88">
            <div className="text-center text-xs font-semibold text-white leading-snug">
              {kodeC || incidentTitle}
            </div>
          </foreignObject>

          {/* Top Left Bone: PEOPLE */}
          <line x1="170" y1="44" x2="310" y2="215" stroke="#38BDF8" strokeWidth="2.5" />
          <rect x="115" y="16" width="120" height="28" rx="6" fill="#16325C" stroke="#38BDF8" />
          <text x="175" y="34" textAnchor="middle" fill="#F8FAFC" fontSize="11.5" fontWeight="700">
            PEOPLE ({facts4P.people.length})
          </text>
          {renderBoneItems(facts4P.people, 'People', 175, 40, true)}

          {/* Top Right Bone: PARTS */}
          <line x1="430" y1="44" x2="570" y2="215" stroke="#38BDF8" strokeWidth="2.5" />
          <rect x="375" y="16" width="120" height="28" rx="6" fill="#16325C" stroke="#38BDF8" />
          <text x="435" y="34" textAnchor="middle" fill="#F8FAFC" fontSize="11.5" fontWeight="700">
            PARTS ({facts4P.parts.length})
          </text>
          {renderBoneItems(facts4P.parts, 'Parts', 435, 40, true)}

          {/* Bottom Left Bone: POSITION */}
          <line x1="170" y1="386" x2="310" y2="215" stroke="#F59E0B" strokeWidth="2.5" />
          <rect x="115" y="386" width="120" height="28" rx="6" fill="#16325C" stroke="#F59E0B" />
          <text x="175" y="404" textAnchor="middle" fill="#F8FAFC" fontSize="11.5" fontWeight="700">
            POSITION ({facts4P.position.length})
          </text>
          {renderBoneItems(facts4P.position, 'Position', 175, 390, false)}

          {/* Bottom Right Bone: PAPER */}
          <line x1="430" y1="386" x2="570" y2="215" stroke="#F59E0B" strokeWidth="2.5" />
          <rect x="375" y="386" width="120" height="28" rx="6" fill="#16325C" stroke="#F59E0B" />
          <text x="435" y="404" textAnchor="middle" fill="#F8FAFC" fontSize="11.5" fontWeight="700">
            PAPER ({facts4P.paper.length})
          </text>
          {renderBoneItems(facts4P.paper, 'Paper', 435, 390, false)}
        </svg>
      </div>

      {selectedFact && (
        <div className="rounded-lg border border-sky-500/40 bg-[#132544] px-3.5 py-2.5 text-xs text-slate-200 flex items-center justify-between gap-3">
          <div>
            <span className="font-bold text-sky-300">{selectedFact.category}: </span>
            <span>{selectedFact.item.text}</span>
            <span className="ml-2 font-semibold text-emerald-400">
              [{selectedFact.item.status}]
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFact(null)}
            className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
};
