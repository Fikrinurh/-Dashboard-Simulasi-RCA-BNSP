export type IncidentCategory =
  | 'Kecelakaan Kerja'
  | 'Penyakit Akibat Kerja (PAK)'
  | 'Kebakaran, Peledakan & Limbah B3'
  | 'Kejadian Berbahaya Lainnya';

export type AccidentType =
  | 'Terjepit / Terhimpit'
  | 'Tertimpa Material'
  | 'Jatuh dari Ketinggian'
  | 'Flash Fire / Kebakaran'
  | 'Paparan Toksik / B3'
  | 'Kegagalan Alat Angkat';

export type SlaStatus = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';

export type InspectionFormType =
  | 'Lampiran II'
  | 'Lampiran III'
  | 'Lampiran IV'
  | 'Lampiran V'
  | 'Belum Terbit';

export type EvidenceCategory4P = 'people' | 'parts' | 'position' | 'paper';

export type EvidenceValidationStatus =
  | 'Fakta Terverifikasi'
  | 'Asumsi/Opini'
  | 'Informasi Anomali';

export interface EvidenceCard4P {
  id: string;
  text: string;
  status: EvidenceValidationStatus;
}

export interface Facts4P {
  people: EvidenceCard4P[];
  parts: EvidenceCard4P[];
  position: EvidenceCard4P[];
  paper: EvidenceCard4P[];
}

export type RcaNodeRole =
  | 'Incident/Symptom'
  | 'Direct Cause'
  | 'Contributing Factor'
  | 'Root Cause';

export type PermenakerNodeCode =
  | 'KODE_C'
  | 'KODE_D1'
  | 'KODE_D2'
  | 'KODE_E_MANAGEMENT'
  | 'NONE';

export interface RcaTreeNode {
  id: string;
  parentId: string | null;
  level: number;
  label: string;
  role: RcaNodeRole;
  permenakerCode: PermenakerNodeCode;
}

export type HierarchyControlType =
  | 'Eliminasi'
  | 'Substitusi'
  | 'Rekayasa Teknik'
  | 'Pengendalian Administratif'
  | 'APD';

export type ActionTrackingStatus = 'Open' | 'In Progress' | 'Verified Closed';

export interface CorrectiveActionKodeE {
  id: string;
  hierarchy: HierarchyControlType;
  hierarchyEn: string;
  description: string;
  pic: string;
  target_date: string;
  status: ActionTrackingStatus;
}

export interface VictimDetails {
  name: string;
  age: number;
  role: string;
  bpjs_kpa: string;
  severity_kode_a: string;
  injured_body_part: string;
  lost_work_hours: number;
  medical_cost_idr: number;
  property_loss_idr: number;
}

export interface RegulatoryCompliance {
  form_3_kk2a_number: string;
  form_3_kk2a_submitted: boolean;
  submission_hours_elapsed: number;
  sla_status: SlaStatus;
  inspection_form_issued: InspectionFormType;
}

export interface IncidentCase {
  incident_id: string;
  case_code: string;
  title: string;
  project_name: string;
  company_name: string;
  klui_code: string;
  incident_date: string;
  location: string;
  incident_category: IncidentCategory;
  accident_type: AccidentType;
  chronology: string;
  is_lti: boolean;
  victim_details: VictimDetails;
  facts_4p: Facts4P;
  rca_tree_nodes: RcaTreeNode[];
  regulatory_compliance: RegulatoryCompliance;
  corrective_actions_kode_e: CorrectiveActionKodeE[];
}

export interface DashboardFilters {
  year: string;
  project: string;
  slaStatus: 'ALL' | SlaStatus;
  category: 'ALL' | IncidentCategory;
}

export interface ExposureBaseline {
  totalManHours: number;
  avgWorkers: number;
}

export interface DashboardKpis {
  totalIncidents: number;
  ltiCount: number;
  lostWorkHours: number;
  lostWorkDays: number;
  totalFinancialLossIdr: number;
  frequencyRate: number;
  severityRate: number;
  incidentRate: number;
  slaCompliancePct: number;
  compliantCount: number;
  warningCount: number;
  nonCompliantCount: number;
  actionClosureRatePct: number;
  totalActions: number;
  closedActions: number;
}

export interface AuditCheckItem {
  id: string;
  pillar: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  title: string;
  detail: string;
}

export interface RcaAuditResult {
  overallValid: boolean;
  scorePct: number;
  summary: string;
  checks: AuditCheckItem[];
}

export interface BnspRubricDimension {
  key: string;
  label: string;
  weightPct: number;
  score: number; // 0-100
  weightedScore: number;
  note: string;
}

export interface BnspRubricResult {
  totalScore: number;
  grade: 'KOMPETEN (SANGAT BAIK)' | 'KOMPETEN' | 'PERLU PERBAIKAN';
  dimensions: BnspRubricDimension[];
}

export interface PermenakerAutoMap {
  kodeA: string;
  kodeC: string;
  kodeD1: string[];
  kodeD2: string[];
  kodeE: string[];
}
