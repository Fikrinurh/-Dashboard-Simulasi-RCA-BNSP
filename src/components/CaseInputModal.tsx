import React, { useState } from 'react';
import { FileUp, PlusCircle, X } from 'lucide-react';
import {
  AccidentType,
  IncidentCase,
  IncidentCategory,
  InspectionFormType,
} from '../types/k3';
import { computeSlaStatus, parseImportedIncidentJson } from '../utils/k3Calculations';

interface CaseInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCase: (newCase: IncidentCase) => void;
}

export const CaseInputModal: React.FC<CaseInputModalProps> = ({
  isOpen,
  onClose,
  onAddCase,
}) => {
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [incidentId, setIncidentId] = useState(`INC-2026-0${Math.floor(50 + Math.random() * 40)}`);
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('Konstruksi Pipa Transmisi Gas 24 Inci');
  const [companyName, setCompanyName] = useState('PT Nusantara Gas Pipeline Contractor');
  const [kluiCode, setKluiCode] = useState('45203');
  const [location, setLocation] = useState('');
  const [incidentDate, setIncidentDate] = useState('2026-11-17T13:30:00');
  const [category, setCategory] = useState<IncidentCategory>('Kecelakaan Kerja');
  const [accidentType, setAccidentType] = useState<AccidentType>('Terjepit / Terhimpit');
  const [victimName, setVictimName] = useState('');
  const [victimRole, setVictimRole] = useState('Pipe Fitter');
  const [severityKodeA, setSeverityKodeA] = useState('Luka Sedang');
  const [injuredBodyPart, setInjuredBodyPart] = useState('Tangan Kanan');
  const [lostHours, setLostHours] = useState(40);
  const [medicalCost, setMedicalCost] = useState(12000000);
  const [propertyLoss, setPropertyLoss] = useState(5000000);
  const [submissionHours, setSubmissionHours] = useState(20);
  const [submitted, setSubmitted] = useState(true);
  const [inspectionForm, setInspectionForm] = useState<InspectionFormType>('Lampiran II');
  const [chronology, setChronology] = useState('');

  // JSON import text
  const [jsonText, setJsonText] = useState('');

  if (!isOpen) return null;

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!incidentId.trim() || !title.trim() || !victimName.trim() || !location.trim()) {
      setErrorMsg('Harap isi ID Insiden, Judul Kasus, Nama Korban, dan Lokasi Kejadian.');
      return;
    }

    const slaStatus = computeSlaStatus(submitted, submissionHours);

    const created: IncidentCase = {
      incident_id: incidentId.trim(),
      case_code: `CAS-${incidentId.trim()}`,
      title: title.trim(),
      project_name: projectName.trim(),
      company_name: companyName.trim(),
      klui_code: kluiCode.trim() || '45203',
      incident_date: incidentDate,
      location: location.trim(),
      incident_category: category,
      accident_type: accidentType,
      chronology:
        chronology.trim() ||
        `Investigasi kasus ${title.trim()} pada proyek ${projectName.trim()} di ${location.trim()}.`,
      is_lti: lostHours > 0,
      victim_details: {
        name: victimName.trim(),
        age: 32,
        role: victimRole.trim() || 'Teknisi',
        bpjs_kpa: '09823419901',
        severity_kode_a: severityKodeA.trim(),
        injured_body_part: injuredBodyPart.trim(),
        lost_work_hours: Number(lostHours) || 0,
        medical_cost_idr: Number(medicalCost) || 0,
        property_loss_idr: Number(propertyLoss) || 0,
      },
      facts_4p: {
        people: [{ id: `p-${Date.now()}`, text: `${victimRole} berada di area kerja saat insiden`, status: 'Fakta Terverifikasi' }],
        parts: [{ id: `pt-${Date.now()}`, text: 'Peralatan kerja terkait insiden teridentifikasi', status: 'Fakta Terverifikasi' }],
        position: [{ id: `ps-${Date.now()}`, text: `Lokasi kejadian: ${location.trim()}`, status: 'Fakta Terverifikasi' }],
        paper: [{ id: `pp-${Date.now()}`, text: 'Verifikasi JSA dan Izin Kerja (PTW) sedang diaudit', status: 'Asumsi/Opini' }],
      },
      rca_tree_nodes: [
        {
          id: 'node_0',
          parentId: null,
          level: 0,
          label: `Insiden: ${title.trim()}`,
          role: 'Incident/Symptom',
          permenakerCode: 'KODE_C',
        },
        {
          id: 'node_1',
          parentId: 'node_0',
          level: 1,
          label: 'Why 1: Kondisi lingkungan/alat berisiko tinggi (Kode D1)',
          role: 'Direct Cause',
          permenakerCode: 'KODE_D1',
        },
        {
          id: 'node_2',
          parentId: 'node_0',
          level: 1,
          label: 'Why 2: Prosedur kerja aman belum dipatuhi di lapangan (Kode D2)',
          role: 'Direct Cause',
          permenakerCode: 'KODE_D2',
        },
      ],
      regulatory_compliance: {
        form_3_kk2a_number: `KK2A-${incidentId.trim()}`,
        form_3_kk2a_submitted: submitted,
        submission_hours_elapsed: Number(submissionHours) || 0,
        sla_status: slaStatus,
        inspection_form_issued: inspectionForm,
      },
      corrective_actions_kode_e: [
        {
          id: `ACT-${Date.now().toString().slice(-3)}`,
          hierarchy: 'Pengendalian Administratif',
          hierarchyEn: 'Administrative Control',
          description: `Lakukan investigasi lanjutan, pemutakhiran JSA, dan verifikasi PTW untuk ${title.trim()}.`,
          pic: 'HSE Coordinator',
          target_date: '2026-12-15',
          status: 'Open',
        },
      ],
    };

    onAddCase(created);
    onClose();
  };

  const handleImportJson = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const result = parseImportedIncidentJson(jsonText);
    if (!result.valid || !result.data) {
      setErrorMsg(result.error || 'Format JSON tidak valid.');
      return;
    }
    onAddCase(result.data);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJsonText(String(reader.result || ''));
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-case-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#284572] bg-[#10203B] p-5 text-slate-100 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-[#1E3558] pb-3">
          <div>
            <h2 id="modal-case-title" className="text-base font-bold text-white">
              Input Kasus Investigasi Baru / Import JSON
            </h2>
            <p className="text-xs text-slate-400">
              Data baru langsung tersinkronisasi ke Executive Dashboard dan Workspace RCA
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal input kasus"
            className="rounded-md p-1.5 text-slate-400 hover:bg-[#1B355F] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="mb-4 flex gap-2 rounded-lg border border-[#223B64] bg-[#0B1930] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('form');
              setErrorMsg(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold cursor-pointer ${
              mode === 'form' ? 'bg-[#1D3E73] text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Formulir Kasus Terstruktur
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('json');
              setErrorMsg(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold cursor-pointer ${
              mode === 'json' ? 'bg-[#1D3E73] text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Paste / Upload Berkas JSON
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 rounded-md border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {mode === 'form' ? (
          <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="case-id-input" className="block font-semibold text-slate-300 mb-1">
                  ID Insiden *
                </label>
                <input
                  id="case-id-input"
                  type="text"
                  required
                  value={incidentId}
                  onChange={(e) => setIncidentId(e.target.value)}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label htmlFor="case-date-input" className="block font-semibold text-slate-300 mb-1">
                  Waktu Kejadian
                </label>
                <input
                  id="case-date-input"
                  type="text"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 font-mono-tabular text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="case-title-input" className="block font-semibold text-slate-300 mb-1">
                Judul Singkat Insiden *
              </label>
              <input
                id="case-title-input"
                type="text"
                required
                placeholder="Misal: Kebocoran Gas Valve & Paparan Operator"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="case-project-input" className="block font-semibold text-slate-300 mb-1">
                  Nama Proyek
                </label>
                <input
                  id="case-project-input"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label htmlFor="case-location-input" className="block font-semibold text-slate-300 mb-1">
                  Lokasi Kejadian *
                </label>
                <input
                  id="case-location-input"
                  type="text"
                  required
                  placeholder="Misal: Compressor Area KM 12"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="case-category-input" className="block font-semibold text-slate-300 mb-1">
                  Klasifikasi Permenaker 03/1998
                </label>
                <select
                  id="case-category-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-white"
                >
                  <option value="Kecelakaan Kerja">Kecelakaan Kerja</option>
                  <option value="Penyakit Akibat Kerja (PAK)">Penyakit Akibat Kerja (PAK)</option>
                  <option value="Kebakaran, Peledakan & Limbah B3">
                    Kebakaran, Peledakan &amp; Limbah B3
                  </option>
                  <option value="Kejadian Berbahaya Lainnya">Kejadian Berbahaya Lainnya</option>
                </select>
              </div>
              <div>
                <label htmlFor="case-type-input" className="block font-semibold text-slate-300 mb-1">
                  Tipe Kecelakaan
                </label>
                <select
                  id="case-type-input"
                  value={accidentType}
                  onChange={(e) => setAccidentType(e.target.value as AccidentType)}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-white"
                >
                  <option value="Terjepit / Terhimpit">Terjepit / Terhimpit</option>
                  <option value="Tertimpa Material">Tertimpa Material</option>
                  <option value="Jatuh dari Ketinggian">Jatuh dari Ketinggian</option>
                  <option value="Flash Fire / Kebakaran">Flash Fire / Kebakaran</option>
                  <option value="Paparan Toksik / B3">Paparan Toksik / B3</option>
                  <option value="Kegagalan Alat Angkat">Kegagalan Alat Angkat</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="case-victim-input" className="block font-semibold text-slate-300 mb-1">
                  Nama Korban *
                </label>
                <input
                  id="case-victim-input"
                  type="text"
                  required
                  placeholder="Nama pekerja"
                  value={victimName}
                  onChange={(e) => setVictimName(e.target.value)}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label htmlFor="case-bodypart-input" className="block font-semibold text-slate-300 mb-1">
                  Bagian Tubuh Cidera
                </label>
                <input
                  id="case-bodypart-input"
                  type="text"
                  value={injuredBodyPart}
                  onChange={(e) => setInjuredBodyPart(e.target.value)}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label htmlFor="case-kodea-input" className="block font-semibold text-slate-300 mb-1">
                  Akibat (Kode A)
                </label>
                <input
                  id="case-kodea-input"
                  type="text"
                  value={severityKodeA}
                  onChange={(e) => setSeverityKodeA(e.target.value)}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label htmlFor="case-hours-input" className="block font-semibold text-slate-300 mb-1">
                  Jam Kerja Hilang
                </label>
                <input
                  id="case-hours-input"
                  type="number"
                  min={0}
                  value={lostHours}
                  onChange={(e) => setLostHours(Number(e.target.value))}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 font-mono-tabular text-white"
                />
              </div>
              <div>
                <label htmlFor="case-med-input" className="block font-semibold text-slate-300 mb-1">
                  Biaya Medis (IDR)
                </label>
                <input
                  id="case-med-input"
                  type="number"
                  min={0}
                  value={medicalCost}
                  onChange={(e) => setMedicalCost(Number(e.target.value))}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 font-mono-tabular text-white"
                />
              </div>
              <div>
                <label htmlFor="case-sla-hours" className="block font-semibold text-slate-300 mb-1">
                  Jam Lapor Form KK2 A
                </label>
                <input
                  id="case-sla-hours"
                  type="number"
                  min={1}
                  value={submissionHours}
                  onChange={(e) => setSubmissionHours(Number(e.target.value))}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 font-mono-tabular text-white"
                />
              </div>
              <div>
                <label htmlFor="case-lampiran" className="block font-semibold text-slate-300 mb-1">
                  Dokumen Lampiran
                </label>
                <select
                  id="case-lampiran"
                  value={inspectionForm}
                  onChange={(e) => setInspectionForm(e.target.value as InspectionFormType)}
                  className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-white"
                >
                  <option value="Lampiran II">Lampiran II</option>
                  <option value="Lampiran III">Lampiran III</option>
                  <option value="Lampiran IV">Lampiran IV</option>
                  <option value="Lampiran V">Lampiran V</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="case-chronology-input" className="block font-semibold text-slate-300 mb-1">
                Uraian Kronologi Singkat
              </label>
              <textarea
                id="case-chronology-input"
                rows={2}
                placeholder="Jelaskan urutan kejadian di lapangan..."
                value={chronology}
                onChange={(e) => setChronology(e.target.value)}
                className="w-full rounded border border-[#284572] bg-[#0B1930] px-2.5 py-1.5 text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1E3558]">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={submitted}
                  onChange={(e) => setSubmitted(e.target.checked)}
                  className="rounded border-[#284572]"
                />
                <span>Form 3 KK2 A sudah dikirim ke Disnaker</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-[#284572] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Simpan Kasus Baru</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleImportJson} className="space-y-3 text-xs">
            <div>
              <label htmlFor="json-file-upload" className="block font-semibold text-slate-300 mb-1">
                Upload Berkas JSON (.json)
              </label>
              <input
                id="json-file-upload"
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#1D3E73] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#254D8F]"
              />
            </div>

            <div>
              <label htmlFor="json-raw-textarea" className="block font-semibold text-slate-300 mb-1">
                Atau Tempel Skema JSON Kasus
              </label>
              <textarea
                id="json-raw-textarea"
                rows={9}
                placeholder='{"incident_id": "INC-2026-088", "project_name": "...", "victim_details": {"name": "..."}}'
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full rounded border border-[#284572] bg-[#0B1930] p-2.5 font-mono-tabular text-[11px] text-emerald-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E3558]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[#284572] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
              >
                <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Impor Kasus JSON</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
