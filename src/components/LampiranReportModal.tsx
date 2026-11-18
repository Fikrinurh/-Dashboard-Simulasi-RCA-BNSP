import React, { useMemo } from 'react';
import { Printer, X } from 'lucide-react';
import { IncidentCase } from '../types/k3';
import { autoMapPermenaker, calculateBnspRubric, formatIdr } from '../utils/k3Calculations';

interface LampiranReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: IncidentCase;
}

export const LampiranReportModal: React.FC<LampiranReportModalProps> = ({
  isOpen,
  onClose,
  incident,
}) => {
  const mapped = useMemo(() => autoMapPermenaker(incident), [incident]);
  const rubric = useMemo(() => calculateBnspRubric(incident), [incident]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lampiran-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs print:static print:bg-white print:p-0"
    >
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-[#284572] bg-white text-slate-900 shadow-2xl print:max-h-none print:overflow-visible print:border-0 print:shadow-none">
        {/* Non-print toolbar */}
        <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-100 px-6 py-3">
          <div>
            <h2 id="lampiran-modal-title" className="text-sm font-bold text-slate-900">
              Pratinjau Laporan Resmi — {incident.regulatory_compliance.inspection_form_issued} Permenaker No. 03/MEN/1998
            </h2>
            <p className="text-xs text-slate-600">
              Format siap cetak / simpan PDF untuk pelaporan ke Dinas Ketenagakerjaan &amp; Asesmen BNSP
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2D5A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#194280] cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau laporan"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Printable Statutory Document Sheet */}
        <div className="print-only-sheet p-8 space-y-5 text-xs leading-relaxed">
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Republik Indonesia &middot; Peraturan Menteri Tenaga Kerja No. 03/MEN/1998
              </p>
              <h1 className="mt-1 text-lg font-bold text-slate-900">
                LAPORAN PEMERIKSAAN &amp; INVESTIGASI KECELAKAAN KERJA ({incident.regulatory_compliance.inspection_form_issued.toUpperCase()})
              </h1>
              <p className="text-slate-700">
                Referensi Formulir Bentuk 3 KK2 A: <span className="font-mono font-bold">{incident.regulatory_compliance.form_3_kk2a_number}</span>
              </p>
            </div>
            <div className="text-right font-mono text-[11px]">
              <p className="font-bold">ID: {incident.incident_id}</p>
              <p>Kode Kasus: {incident.case_code}</p>
              <p>SLA 2x24 Jam: {incident.regulatory_compliance.sla_status} ({incident.regulatory_compliance.submission_hours_elapsed} jam)</p>
            </div>
          </div>

          {/* Section I: Data Perusahaan & Korban */}
          <div>
            <h3 className="bg-slate-900 text-white px-2.5 py-1 font-bold text-xs">
              I. DATA PERUSAHAAN, PROYEK &amp; IDENTITAS KORBAN
            </h3>
            <table className="w-full border-collapse border border-slate-300 mt-2">
              <tbody>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold w-1/4">Nama Perusahaan</td>
                  <td className="border border-slate-300 px-2.5 py-1.5 w-1/4">{incident.company_name}</td>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold w-1/4">Kode KLUI</td>
                  <td className="border border-slate-300 px-2.5 py-1.5 font-mono w-1/4">{incident.klui_code}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold">Proyek / Lokasi</td>
                  <td className="border border-slate-300 px-2.5 py-1.5" colSpan={3}>
                    {incident.project_name} &mdash; {incident.location}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold">Klasifikasi Peristiwa</td>
                  <td className="border border-slate-300 px-2.5 py-1.5">{incident.incident_category}</td>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold">Tanggal &amp; Jam</td>
                  <td className="border border-slate-300 px-2.5 py-1.5 font-mono">{incident.incident_date.replace('T', ' ')}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold">Nama Korban / Jabatan</td>
                  <td className="border border-slate-300 px-2.5 py-1.5">
                    {incident.victim_details.name} ({incident.victim_details.age} thn, {incident.victim_details.role})
                  </td>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold">No. Peserta BPJS KPA</td>
                  <td className="border border-slate-300 px-2.5 py-1.5 font-mono">{incident.victim_details.bpjs_kpa}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold">Jam Kerja Hilang &amp; Biaya</td>
                  <td className="border border-slate-300 px-2.5 py-1.5 font-mono" colSpan={3}>
                    {incident.victim_details.lost_work_hours} jam ({(incident.victim_details.lost_work_hours / 8).toFixed(1)} hari) &middot; Medis: {formatIdr(incident.victim_details.medical_cost_idr)} &middot; Properti: {formatIdr(incident.victim_details.property_loss_idr)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section II: Kronologi & Kodifikasi Permenaker 03/1998 */}
          <div>
            <h3 className="bg-slate-900 text-white px-2.5 py-1 font-bold text-xs">
              II. KRONOLOGI &amp; KODIFIKASI PERMENAKER NO. 03/MEN/1998 (KODE A, C, D1, D2)
            </h3>
            <p className="mt-2 border border-slate-300 bg-slate-50 p-2.5">{incident.chronology}</p>
            <table className="w-full border-collapse border border-slate-300 mt-2">
              <tbody>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold w-1/4">Kode A (Akibat Cidera)</td>
                  <td className="border border-slate-300 px-2.5 py-1.5">{mapped.kodeA} ({incident.victim_details.injured_body_part})</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold">Kode C (Sumber Kecelakaan)</td>
                  <td className="border border-slate-300 px-2.5 py-1.5">{mapped.kodeC}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold">Kode D1 (Kondisi Berbahaya)</td>
                  <td className="border border-slate-300 px-2.5 py-1.5">{mapped.kodeD1.join('; ')}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold">Kode D2 (Tindakan Berbahaya)</td>
                  <td className="border border-slate-300 px-2.5 py-1.5">{mapped.kodeD2.join('; ')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section III: Rekomendasi Tindakan Korektif (Kode E) */}
          <div>
            <h3 className="bg-slate-900 text-white px-2.5 py-1 font-bold text-xs">
              III. RENCANA TINDAKAN KOREKTIF &amp; PENCEGAHAN (KODE E)
            </h3>
            <table className="w-full border-collapse border border-slate-300 mt-2">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-2 py-1 text-left">ID</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">Hierarki Pengendalian</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">Uraian Tindakan Korektif</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">PIC</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">Target</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {incident.corrective_actions_kode_e.map((act) => (
                  <tr key={act.id}>
                    <td className="border border-slate-300 px-2 py-1.5 font-mono">{act.id}</td>
                    <td className="border border-slate-300 px-2 py-1.5 font-semibold">{act.hierarchy}</td>
                    <td className="border border-slate-300 px-2 py-1.5">{act.description}</td>
                    <td className="border border-slate-300 px-2 py-1.5">{act.pic}</td>
                    <td className="border border-slate-300 px-2 py-1.5 font-mono">{act.target_date}</td>
                    <td className="border border-slate-300 px-2 py-1.5 font-semibold">{act.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signature & BNSP Competency Stamp */}
          <div className="pt-4 grid grid-cols-2 gap-8 border-t border-slate-300">
            <div>
              <p className="font-bold">Evaluasi Kualitas Investigasi (Rubrik BNSP)</p>
              <p className="mt-1">
                Skor Kompetensi: <span className="font-mono font-bold">{rubric.totalScore}/100</span> ({rubric.grade})
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                Dicetak melalui K3 Investigator Pro &middot; Tanggal Cetak: {new Date().toISOString().slice(0, 10)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">Ahli Investigasi Kecelakaan Kerja K3 (BNSP)</p>
              <div className="mt-12 border-t border-slate-400 inline-block pt-1 px-6">
                Tanda Tangan &amp; Nomor Registrasi K3
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
