import React, { useState } from 'react';
import { RcaTreeNode } from '../types/k3';

interface FaultTreeDiagramProps {
  topEvent: string;
  nodes: RcaTreeNode[];
}

export const FaultTreeDiagram: React.FC<FaultTreeDiagramProps> = ({ topEvent, nodes }) => {
  const [topGateType, setTopGateType] = useState<'AND' | 'OR'>('AND');

  const d1Nodes = nodes.filter((n) => n.permenakerCode === 'KODE_D1');
  const d2Nodes = nodes.filter((n) => n.permenakerCode === 'KODE_D2');
  const rootNodes = nodes.filter((n) => n.permenakerCode === 'KODE_E_MANAGEMENT');

  const d1Primary = d1Nodes[0]?.label.replace(/^Why \d+:\s*/i, '') || 'Kondisi fisik tidak aman (Kode D1)';
  const d1Secondary = d1Nodes[1]?.label.replace(/^Why \d+:\s*/i, '') || 'Lingkungan / peralatan tanpa proteksi';
  const d2Primary = d2Nodes[0]?.label.replace(/^Why \d+:\s*/i, '') || 'Tindakan pekerja tidak aman (Kode D2)';
  const d2Secondary = d2Nodes[1]?.label.replace(/^Why \d+:\s*/i, '') || 'Pelanggaran prosedur / line of fire';
  const rootMgmt =
    rootNodes[0]?.label.replace(/^Why \d+(\s*\(Root Cause\))?:\s*/i, '') ||
    'Kelemahan Sistem Manajemen K3 & PTW (Kode E)';

  const truncate = (text: string, max = 48) =>
    text.length > max ? `${text.slice(0, max - 1)}…` : text;

  return (
    <div className="space-y-3" data-testid="fault-tree-diagram">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#223B64] bg-[#0B1930] px-3 py-2 text-[11px] text-slate-300">
        <span>
          Fault Tree Analysis (FTA) Boolean: Membuktikan akumulasi Kode D1 &amp; Kode D2 menuju Top Event
        </span>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Simulasi Gerbang Puncak:</span>
          <button
            type="button"
            onClick={() => setTopGateType((g) => (g === 'AND' ? 'OR' : 'AND'))}
            className="rounded border border-amber-400/50 bg-amber-500/15 px-2.5 py-0.5 font-mono-tabular font-bold text-amber-300 hover:bg-amber-500/25 cursor-pointer"
          >
            Gerbang: {topGateType} GATE
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1E3558] bg-[#0A172D] p-3">
        <svg
          viewBox="0 0 860 470"
          className="w-full h-auto"
          role="img"
          aria-label="Diagram Fault Tree Analysis Logika Boolean AND dan OR Gate"
        >
          {/* Top Event Box */}
          <rect
            x="250"
            y="14"
            width="360"
            height="62"
            rx="8"
            fill="#991B1B"
            stroke="#F87171"
            strokeWidth="2"
          />
          <text x="430" y="34" textAnchor="middle" fill="#FECACA" fontSize="10" fontWeight="700">
            TOP EVENT (KODE C)
          </text>
          <foreignObject x="262" y="38" width="336" height="34">
            <div className="text-center text-xs font-semibold text-white leading-tight line-clamp-2">
              {topEvent}
            </div>
          </foreignObject>

          {/* Line Top Event to Top Gate */}
          <line x1="430" y1="76" x2="430" y2="105" stroke="#94A3B8" strokeWidth="2" />

          {/* Top Logic Gate (AND or OR) */}
          {topGateType === 'AND' ? (
            <g>
              <path
                d="M402,135 L402,122 A28,28 0 0,1 458,122 L458,135 Z"
                fill="#1D4ED8"
                stroke="#93C5FD"
                strokeWidth="2"
              />
              <text x="430" y="128" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700">
                AND
              </text>
            </g>
          ) : (
            <g>
              <path
                d="M402,138 Q430,126 458,138 L458,124 Q430,96 402,124 Z"
                fill="#B45309"
                stroke="#FCD34D"
                strokeWidth="2"
              />
              <text x="430" y="126" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700">
                OR
              </text>
            </g>
          )}

          {/* Branch Lines from Top Gate to Left (D1) & Right (D2) */}
          <line x1="430" y1="136" x2="430" y2="155" stroke="#94A3B8" strokeWidth="2" />
          <line x1="210" y1="155" x2="650" y2="155" stroke="#94A3B8" strokeWidth="2" />
          <line x1="210" y1="155" x2="210" y2="175" stroke="#94A3B8" strokeWidth="2" />
          <line x1="650" y1="155" x2="650" y2="175" stroke="#94A3B8" strokeWidth="2" />

          {/* Intermediate Event Left: KODE D1 */}
          <rect
            x="65"
            y="175"
            width="290"
            height="56"
            rx="7"
            fill="#14325B"
            stroke="#34D399"
            strokeWidth="1.8"
          />
          <text x="210" y="194" textAnchor="middle" fill="#6EE7B7" fontSize="10" fontWeight="700">
            KONDISI BERBAHAYA (KODE D1)
          </text>
          <text x="210" y="214" textAnchor="middle" fill="#F1F5F9" fontSize="11">
            {truncate(d1Primary, 42)}
          </text>

          {/* Intermediate Event Right: KODE D2 */}
          <rect
            x="505"
            y="175"
            width="290"
            height="56"
            rx="7"
            fill="#14325B"
            stroke="#FBBF24"
            strokeWidth="1.8"
          />
          <text x="650" y="194" textAnchor="middle" fill="#FDE68A" fontSize="10" fontWeight="700">
            TINDAKAN BERBAHAYA (KODE D2)
          </text>
          <text x="650" y="214" textAnchor="middle" fill="#F1F5F9" fontSize="11">
            {truncate(d2Primary, 42)}
          </text>

          {/* Left OR Gate */}
          <line x1="210" y1="231" x2="210" y2="255" stroke="#94A3B8" strokeWidth="2" />
          <path
            d="M185,286 Q210,275 235,286 L235,272 Q210,247 185,272 Z"
            fill="#0F766E"
            stroke="#5EEAD4"
            strokeWidth="1.8"
          />
          <text x="210" y="274" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="700">
            OR
          </text>
          <line x1="210" y1="282" x2="210" y2="302" stroke="#94A3B8" strokeWidth="2" />
          <line x1="115" y1="302" x2="305" y2="302" stroke="#94A3B8" strokeWidth="2" />
          <line x1="115" y1="302" x2="115" y2="325" stroke="#94A3B8" strokeWidth="2" />
          <line x1="305" y1="302" x2="305" y2="325" stroke="#94A3B8" strokeWidth="2" />

          {/* Basic Event D1-A */}
          <circle cx="115" cy="348" r="24" fill="#132544" stroke="#34D399" strokeWidth="1.8" />
          <text x="115" y="352" textAnchor="middle" fill="#6EE7B7" fontSize="10" fontWeight="700">
            D1-A
          </text>
          <foreignObject x="25" y="378" width="180" height="44">
            <div className="text-center text-[11px] text-slate-300 leading-tight">
              {truncate(d1Secondary, 48)}
            </div>
          </foreignObject>

          {/* Basic Event D1-B (Shared Root Cause Link) */}
          <circle cx="305" cy="348" r="24" fill="#132544" stroke="#FB923C" strokeWidth="1.8" />
          <text x="305" y="352" textAnchor="middle" fill="#FDBA74" fontSize="10" fontWeight="700">
            E-SYS
          </text>

          {/* Right OR Gate */}
          <line x1="650" y1="231" x2="650" y2="255" stroke="#94A3B8" strokeWidth="2" />
          <path
            d="M625,286 Q650,275 675,286 L675,272 Q650,247 625,272 Z"
            fill="#B45309"
            stroke="#FCD34D"
            strokeWidth="1.8"
          />
          <text x="650" y="274" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="700">
            OR
          </text>
          <line x1="650" y1="282" x2="650" y2="302" stroke="#94A3B8" strokeWidth="2" />
          <line x1="555" y1="302" x2="745" y2="302" stroke="#94A3B8" strokeWidth="2" />
          <line x1="555" y1="302" x2="555" y2="325" stroke="#94A3B8" strokeWidth="2" />
          <line x1="745" y1="302" x2="745" y2="325" stroke="#94A3B8" strokeWidth="2" />

          {/* Basic Event D2-A */}
          <circle cx="555" cy="348" r="24" fill="#132544" stroke="#FB923C" strokeWidth="1.8" />
          <text x="555" y="352" textAnchor="middle" fill="#FDBA74" fontSize="10" fontWeight="700">
            E-SYS
          </text>

          {/* Basic Event D2-B */}
          <circle cx="745" cy="348" r="24" fill="#132544" stroke="#FBBF24" strokeWidth="1.8" />
          <text x="745" y="352" textAnchor="middle" fill="#FDE68A" fontSize="10" fontWeight="700">
            D2-B
          </text>
          <foreignObject x="655" y="378" width="180" height="44">
            <div className="text-center text-[11px] text-slate-300 leading-tight">
              {truncate(d2Secondary, 48)}
            </div>
          </foreignObject>

          {/* Converging Common Root Cause Box */}
          <line x1="305" y1="372" x2="305" y2="405" stroke="#FB923C" strokeWidth="1.8" />
          <line x1="555" y1="372" x2="555" y2="405" stroke="#FB923C" strokeWidth="1.8" />
          <line x1="305" y1="405" x2="555" y2="405" stroke="#FB923C" strokeWidth="1.8" />
          <line x1="430" y1="405" x2="430" y2="416" stroke="#FB923C" strokeWidth="1.8" />
          <rect
            x="235"
            y="416"
            width="390"
            height="46"
            rx="7"
            fill="#7C2D12"
            stroke="#34D399"
            strokeWidth="1.8"
          />
          <text x="430" y="434" textAnchor="middle" fill="#6EE7B7" fontSize="10" fontWeight="700">
            AKAR PENYEBAB SISTEMIK (KODE E · ROOT CAUSE)
          </text>
          <text x="430" y="451" textAnchor="middle" fill="#FFFFFF" fontSize="11">
            {truncate(rootMgmt, 60)}
          </text>
        </svg>
      </div>
    </div>
  );
};
