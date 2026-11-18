import test from 'node:test';
import assert from 'node:assert/strict';
import { BASELINE_INCIDENT_CASES, DEFAULT_EXPOSURE_BASELINE } from '../data/baselineCases';
import {
  autoMapPermenaker,
  buildAnalyticsSeries,
  calculateBnspRubric,
  calculateDashboardKpis,
  computeSlaStatus,
  evaluateRcaLogic,
  exportCasesToCsv,
  filterIncidents,
  generateActionsFromRootCause,
  parseImportedIncidentJson,
} from './k3Calculations';

test('calculateDashboardKpis computes FR, SR, IR, SLA, and financial loss accurately', () => {
  const kpis = calculateDashboardKpis(BASELINE_INCIDENT_CASES, DEFAULT_EXPOSURE_BASELINE);
  assert.equal(kpis.totalIncidents, 6);
  // LTI cases: INC-2026-042 (480h), INC-2026-039 (160h), INC-2026-035 (240h), INC-2026-021 (120h) = 4 LTI
  assert.equal(kpis.ltiCount, 4);
  assert.equal(kpis.lostWorkHours, 1000);
  assert.equal(kpis.lostWorkDays, 125);
  // FR = (4 * 1,000,000) / 485,000 = 8.25
  assert.equal(kpis.frequencyRate, 8.25);
  // SR = (125 * 1,000,000) / 485,000 = 257.7
  assert.equal(kpis.severityRate, 257.7);
  // IR = (6 * 100) / 340 = 1.76
  assert.equal(kpis.incidentRate, 1.76);
  // 5 out of 6 submitted <= 48h => 83.3%
  assert.equal(kpis.slaCompliancePct, 83.3);
  assert.equal(kpis.compliantCount, 4);
  assert.equal(kpis.warningCount, 1);
  assert.equal(kpis.nonCompliantCount, 1);
});

test('filterIncidents filters by category, project, and SLA status', () => {
  const pakOnly = filterIncidents(BASELINE_INCIDENT_CASES, {
    year: '2026',
    project: 'ALL',
    slaStatus: 'ALL',
    category: 'Penyakit Akibat Kerja (PAK)',
  });
  assert.equal(pakOnly.length, 1);
  assert.equal(pakOnly[0].incident_id, 'INC-2026-039');

  const nonCompliantOnly = filterIncidents(BASELINE_INCIDENT_CASES, {
    year: 'ALL',
    project: 'ALL',
    slaStatus: 'NON_COMPLIANT',
    category: 'ALL',
  });
  assert.equal(nonCompliantOnly.length, 1);
  assert.equal(nonCompliantOnly[0].incident_id, 'INC-2026-028');
});

test('evaluateRcaLogic passes deep systemic baseline case and flags shallow human-error case', () => {
  const baselineCase = BASELINE_INCIDENT_CASES[0];
  const passAudit = evaluateRcaLogic(baselineCase);
  assert.equal(passAudit.overallValid, true);
  assert.equal(passAudit.scorePct, 100);

  const shallowBlameCase = {
    ...baselineCase,
    rca_tree_nodes: [
      {
        id: 'n0',
        parentId: null,
        level: 0,
        label: 'Insiden: Pekerja terpeleset di area basah',
        role: 'Incident/Symptom' as const,
        permenakerCode: 'KODE_C' as const,
      },
      {
        id: 'n1',
        parentId: 'n0',
        level: 1,
        label: 'Why 1: Pekerja lalai tidak berhati-hati',
        role: 'Direct Cause' as const,
        permenakerCode: 'KODE_D2' as const,
      },
    ],
  };

  const failAudit = evaluateRcaLogic(shallowBlameCase);
  assert.equal(failAudit.overallValid, false);
  assert.ok(failAudit.checks.some((c) => c.status === 'FAIL'));
});

test('calculateBnspRubric and autoMapPermenaker produce valid structured output', () => {
  const baselineCase = BASELINE_INCIDENT_CASES[0];
  const rubric = calculateBnspRubric(baselineCase);
  assert.equal(rubric.dimensions.length, 4);
  assert.ok(rubric.totalScore >= 90);
  assert.equal(rubric.grade, 'KOMPETEN (SANGAT BAIK)');

  const mapped = autoMapPermenaker(baselineCase);
  assert.ok(mapped.kodeA.includes('Femur'));
  assert.ok(mapped.kodeD1.length >= 2);
  assert.ok(mapped.kodeD2.length >= 2);
  assert.ok(mapped.kodeE.length >= 2);
});

test('buildAnalyticsSeries, computeSlaStatus, generateActionsFromRootCause, and CSV/JSON helpers work', () => {
  const series = buildAnalyticsSeries(BASELINE_INCIDENT_CASES);
  assert.equal(series.monthlyCounts.reduce((a, b) => a + b, 0), 6);
  assert.ok(series.d1Count >= 6);
  assert.ok(series.d2Count >= 5);

  assert.equal(computeSlaStatus(true, 28), 'COMPLIANT');
  assert.equal(computeSlaStatus(true, 44), 'WARNING');
  assert.equal(computeSlaStatus(true, 54), 'NON_COMPLIANT');
  assert.equal(computeSlaStatus(false, 12), 'NON_COMPLIANT');

  const generated = generateActionsFromRootCause(BASELINE_INCIDENT_CASES[0]);
  assert.equal(generated.length, 2);

  const csv = exportCasesToCsv(BASELINE_INCIDENT_CASES);
  assert.ok(csv.includes('INC-2026-042'));
  assert.ok(csv.includes('Agus Santoso'));

  const validImport = parseImportedIncidentJson(
    JSON.stringify({
      incident_id: 'INC-2026-099',
      project_name: 'Proyek Uji Coba',
      victim_details: { name: 'Budi', lost_work_hours: 16, medical_cost_idr: 5000000 },
    })
  );
  assert.equal(validImport.valid, true);
  assert.equal(validImport.data?.incident_id, 'INC-2026-099');

  const invalidImport = parseImportedIncidentJson('{bad json');
  assert.equal(invalidImport.valid, false);
});
