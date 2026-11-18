import { useEffect, useMemo, useState } from 'react';
import { BrandHeader, ActivePillar } from './components/BrandHeader';
import { CaseInputModal } from './components/CaseInputModal';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { LampiranReportModal } from './components/LampiranReportModal';
import { RcaWorkspace } from './components/RcaWorkspace';
import {
  BASELINE_INCIDENT_CASES,
  DEFAULT_EXPOSURE_BASELINE,
} from './data/baselineCases';
import {
  ActionTrackingStatus,
  DashboardFilters,
  ExposureBaseline,
  IncidentCase,
} from './types/k3';
import {
  calculateDashboardKpis,
  exportCasesToCsv,
  filterIncidents,
} from './utils/k3Calculations';

const STORAGE_KEY_CASES = 'k3_investigator_cases_v1';
const STORAGE_KEY_EXPOSURE = 'k3_investigator_exposure_v1';

export default function App() {
  const [cases, setCases] = useState<IncidentCase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CASES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as IncidentCase[];
        }
      }
    } catch {
      // Fallback to baseline seed data
    }
    return BASELINE_INCIDENT_CASES;
  });

  const [exposure, setExposure] = useState<ExposureBaseline>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPOSURE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.totalManHours === 'number') {
          return parsed as ExposureBaseline;
        }
      }
    } catch {
      // Fallback to baseline exposure
    }
    return DEFAULT_EXPOSURE_BASELINE;
  });

  const [activePillar, setActivePillar] = useState<ActivePillar>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    BASELINE_INCIDENT_CASES[0].incident_id
  );
  const [filters, setFilters] = useState<DashboardFilters>({
    year: '2026',
    project: 'ALL',
    slaStatus: 'ALL',
    category: 'ALL',
  });

  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
    } catch {
      // Ignore storage quota errors
    }
  }, [cases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EXPOSURE, JSON.stringify(exposure));
    } catch {
      // Ignore storage quota errors
    }
  }, [exposure]);

  const filteredCases = useMemo(() => filterIncidents(cases, filters), [cases, filters]);
  const kpis = useMemo(
    () => calculateDashboardKpis(filteredCases, exposure),
    [filteredCases, exposure]
  );

  const activeCase = useMemo(
    () => cases.find((c) => c.incident_id === selectedCaseId) || cases[0],
    [cases, selectedCaseId]
  );

  const handleUpdateCase = (updated: IncidentCase) => {
    setCases((prev) =>
      prev.map((item) => (item.incident_id === updated.incident_id ? updated : item))
    );
  };

  const handleAddCase = (newCase: IncidentCase) => {
    setCases((prev) => {
      const exists = prev.some((c) => c.incident_id === newCase.incident_id);
      if (exists) {
        return prev.map((c) => (c.incident_id === newCase.incident_id ? newCase : c));
      }
      return [newCase, ...prev];
    });
    setSelectedCaseId(newCase.incident_id);
  };

  const handleUpdateActionStatus = (
    caseId: string,
    actionId: string,
    status: ActionTrackingStatus
  ) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.incident_id !== caseId) return c;
        return {
          ...c,
          corrective_actions_kode_e: c.corrective_actions_kode_e.map((act) =>
            act.id === actionId ? { ...act, status } : act
          ),
        };
      })
    );
  };

  const handleOpenInWorkspace = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActivePillar('workspace');
  };

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = (incident: IncidentCase) => {
    triggerDownload(
      `${incident.incident_id}_permenaker_rca.json`,
      JSON.stringify(incident, null, 2),
      'application/json;charset=utf-8'
    );
  };

  const handleExportCsv = () => {
    const csv = exportCasesToCsv(filteredCases.length > 0 ? filteredCases : cases);
    triggerDownload(
      `register_insiden_k3_${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      'text/csv;charset=utf-8'
    );
  };

  return (
    <div className="min-h-screen bg-[#091529] text-slate-100">
      <BrandHeader
        activePillar={activePillar}
        onChangePillar={setActivePillar}
        slaCompliancePct={kpis.slaCompliancePct}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      <div className="no-print">
        {activePillar === 'dashboard' ? (
          <ExecutiveDashboard
            allCases={cases}
            filteredCases={filteredCases}
            filters={filters}
            onChangeFilters={setFilters}
            exposure={exposure}
            onChangeExposure={setExposure}
            kpis={kpis}
            selectedCaseId={activeCase.incident_id}
            onSelectCaseId={setSelectedCaseId}
            onOpenInWorkspace={handleOpenInWorkspace}
            onUpdateActionStatus={handleUpdateActionStatus}
          />
        ) : (
          <RcaWorkspace
            allCases={cases}
            activeCase={activeCase}
            onSelectCaseId={setSelectedCaseId}
            onUpdateCase={handleUpdateCase}
            onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onExportJson={handleExportJson}
            onExportCsv={handleExportCsv}
          />
        )}
      </div>

      <CaseInputModal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
        onAddCase={handleAddCase}
      />

      <LampiranReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        incident={activeCase}
      />
    </div>
  );
}
