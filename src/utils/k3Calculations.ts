import {
  AuditCheckItem,
  BnspRubricDimension,
  BnspRubricResult,
  CorrectiveActionKodeE,
  DashboardFilters,
  DashboardKpis,
  ExposureBaseline,
  IncidentCase,
  PermenakerAutoMap,
  RcaAuditResult,
  RcaTreeNode,
  SlaStatus,
} from '../types/k3';

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function computeSlaStatus(submitted: boolean, hoursElapsed: number): SlaStatus {
  if (!submitted || hoursElapsed > 48) {
    return 'NON_COMPLIANT';
  }
  if (hoursElapsed >= 38) {
    return 'WARNING';
  }
  return 'COMPLIANT';
}

export function filterIncidents(
  cases: IncidentCase[],
  filters: DashboardFilters
): IncidentCase[] {
  return cases.filter((item) => {
    const itemYear = item.incident_date.slice(0, 4);
    if (filters.year !== 'ALL' && itemYear !== filters.year) {
      return false;
    }
    if (filters.project !== 'ALL' && item.project_name !== filters.project) {
      return false;
    }
    if (filters.slaStatus !== 'ALL' && item.regulatory_compliance.sla_status !== filters.slaStatus) {
      return false;
    }
    if (filters.category !== 'ALL' && item.incident_category !== filters.category) {
      return false;
    }
    return true;
  });
}

export function calculateDashboardKpis(
  cases: IncidentCase[],
  exposure: ExposureBaseline
): DashboardKpis {
  const totalIncidents = cases.length;
  const ltiCount = cases.filter((c) => c.is_lti || c.victim_details.lost_work_hours > 0).length;
  const lostWorkHours = cases.reduce((sum, c) => sum + c.victim_details.lost_work_hours, 0);
  const lostWorkDays = Math.round((lostWorkHours / 8) * 10) / 10;
  const totalFinancialLossIdr = cases.reduce(
    (sum, c) => sum + c.victim_details.medical_cost_idr + c.victim_details.property_loss_idr,
    0
  );

  const safeManHours = exposure.totalManHours > 0 ? exposure.totalManHours : 1;
  const safeWorkers = exposure.avgWorkers > 0 ? exposure.avgWorkers : 1;

  // Standard K3 formulas:
  // FR = (LTI * 1,000,000) / Total Man-Hours
  // SR = (Lost Work Days * 1,000,000) / Total Man-Hours
  // IR = (Total Cases * 100) / Average Number of Workers
  const frequencyRate = Math.round(((ltiCount * 1_000_000) / safeManHours) * 100) / 100;
  const severityRate = Math.round(((lostWorkDays * 1_000_000) / safeManHours) * 10) / 10;
  const incidentRate = Math.round(((totalIncidents * 100) / safeWorkers) * 100) / 100;

  let compliantCount = 0;
  let warningCount = 0;
  let nonCompliantCount = 0;
  let within48hCount = 0;

  for (const c of cases) {
    const status = c.regulatory_compliance.sla_status;
    if (status === 'COMPLIANT') {
      compliantCount++;
    } else if (status === 'WARNING') {
      warningCount++;
    } else {
      nonCompliantCount++;
    }
    if (
      c.regulatory_compliance.form_3_kk2a_submitted &&
      c.regulatory_compliance.submission_hours_elapsed <= 48
    ) {
      within48hCount++;
    }
  }

  const slaCompliancePct =
    totalIncidents > 0 ? Math.round((within48hCount / totalIncidents) * 1000) / 10 : 100;

  const allActions = cases.flatMap((c) => c.corrective_actions_kode_e);
  const totalActions = allActions.length;
  const closedActions = allActions.filter((a) => a.status === 'Verified Closed').length;
  const actionClosureRatePct =
    totalActions > 0 ? Math.round((closedActions / totalActions) * 1000) / 10 : 100;

  return {
    totalIncidents,
    ltiCount,
    lostWorkHours,
    lostWorkDays,
    totalFinancialLossIdr,
    frequencyRate,
    severityRate,
    incidentRate,
    slaCompliancePct,
    compliantCount,
    warningCount,
    nonCompliantCount,
    actionClosureRatePct,
    totalActions,
    closedActions,
  };
}

export interface AnalyticsSeries {
  monthlyLabels: string[];
  monthlyCounts: number[];
  accidentTypeLabels: string[];
  accidentTypeCounts: number[];
  d1Count: number;
  d2Count: number;
  bodyPartLabels: string[];
  bodyPartCounts: number[];
}

export function buildAnalyticsSeries(cases: IncidentCase[]): AnalyticsSeries {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyCounts = new Array<number>(12).fill(0);
  const typeMap = new Map<string, number>();
  const bodyPartMap = new Map<string, number>();
  let d1Count = 0;
  let d2Count = 0;

  for (const c of cases) {
    const monthIndex = Number(c.incident_date.slice(5, 7)) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      monthlyCounts[monthIndex] += 1;
    }

    typeMap.set(c.accident_type, (typeMap.get(c.accident_type) ?? 0) + 1);

    const bodyPart = c.victim_details.injured_body_part || 'Lainnya';
    bodyPartMap.set(bodyPart, (bodyPartMap.get(bodyPart) ?? 0) + 1);

    for (const node of c.rca_tree_nodes) {
      if (node.permenakerCode === 'KODE_D1') d1Count += 1;
      if (node.permenakerCode === 'KODE_D2') d2Count += 1;
    }
  }

  return {
    monthlyLabels: monthNames,
    monthlyCounts,
    accidentTypeLabels: Array.from(typeMap.keys()),
    accidentTypeCounts: Array.from(typeMap.values()),
    d1Count,
    d2Count,
    bodyPartLabels: Array.from(bodyPartMap.keys()),
    bodyPartCounts: Array.from(bodyPartMap.values()),
  };
}

export function getTreeMaxDepth(nodes: RcaTreeNode[]): number {
  if (nodes.length === 0) return 0;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let maxDepth = 0;
  for (const node of nodes) {
    let depth = 0;
    let curr: RcaTreeNode | undefined = node;
    const visited = new Set<string>();
    while (curr && curr.parentId && !visited.has(curr.id)) {
      visited.add(curr.id);
      depth += 1;
      curr = byId.get(curr.parentId);
    }
    if (depth > maxDepth) maxDepth = depth;
  }
  return maxDepth;
}

export function evaluateRcaLogic(incident: IncidentCase): RcaAuditResult {
  const nodes = incident.rca_tree_nodes;
  const checks: AuditCheckItem[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // 1. Check Logical Leap & Chain Continuity
  const rootNodes = nodes.filter((n) => n.parentId === null);
  const orphanNodes = nodes.filter((n) => n.parentId !== null && !byId.has(n.parentId));
  const maxDepth = getTreeMaxDepth(nodes);
  const hasBlankNodes = nodes.some((n) => n.label.trim().length < 6);

  if (rootNodes.length === 1 && orphanNodes.length === 0 && maxDepth >= 3 && !hasBlankNodes) {
    checks.push({
      id: 'chk-leap',
      pillar: '1. Kontinuitas Logika 5-Whys',
      status: 'PASS',
      title: 'Tidak ditemukan lompatan logika (logical leap)',
      detail: `Rantai kausalitas terhubung utuh dari Insiden (Node 0) hingga kedalaman ${maxDepth} tingkat tanpa cabang terputus.`,
    });
  } else if (orphanNodes.length > 0 || hasBlankNodes || rootNodes.length !== 1) {
    checks.push({
      id: 'chk-leap',
      pillar: '1. Kontinuitas Logika 5-Whys',
      status: 'FAIL',
      title: 'Terdapat node terputus atau teks analisis terlalu singkat',
      detail: 'Pastikan hanya ada 1 Node Insiden utama dan setiap node Why memiliki kalimat sebab-akibat yang utuh.',
    });
  } else {
    checks.push({
      id: 'chk-leap',
      pillar: '1. Kontinuitas Logika 5-Whys',
      status: 'WARN',
      title: `Kedalaman analisis masih dangkal (${maxDepth} level)`,
      detail: 'Tambahkan cabang Why lanjutan (minimal level 3–5) agar tidak terjadi lompatan logika ke akar masalah.',
    });
  }

  // 2. Check Human-Error-Only Stoppage vs Management Root Cause
  const rootCauseNodes = nodes.filter(
    (n) => n.role === 'Root Cause' || n.permenakerCode === 'KODE_E_MANAGEMENT'
  );
  const managementKeywords = [
    'sistem',
    'manajemen',
    'izin kerja',
    'ptw',
    'sop',
    'prosedur',
    'pengawasan',
    'pelatihan',
    'audit',
    'stop work',
    'maintenance',
    'inspeksi',
    'program',
  ];
  const hasSystemicRootCause = rootCauseNodes.some((n) =>
    managementKeywords.some((kw) => n.label.toLowerCase().includes(kw))
  );

  if (rootCauseNodes.length > 0 && hasSystemicRootCause) {
    checks.push({
      id: 'chk-system',
      pillar: '2. Penetrasi Sistem Manajemen (Anti-Blame)',
      status: 'PASS',
      title: 'Analisis berhasil menembus kegagalan sistem manajemen (Root Cause)',
      detail:
        'Investigasi tidak berhenti pada kesalahan manusia (Unsafe Action / Kode D2), melainkan mengidentifikasi kelemahan PTW, pengawasan K3, atau SOP.',
    });
  } else if (rootCauseNodes.length > 0) {
    checks.push({
      id: 'chk-system',
      pillar: '2. Penetrasi Sistem Manajemen (Anti-Blame)',
      status: 'WARN',
      title: 'Node Root Cause belum menegaskan kegagalan sistem manajemen',
      detail:
        'Sempurnakan teks Root Cause agar menyebutkan kelemahan sistem manajemen (mis. PTW, JSA, pengawasan, atau pemeliharaan).',
    });
  } else {
    checks.push({
      id: 'chk-system',
      pillar: '2. Penetrasi Sistem Manajemen (Anti-Blame)',
      status: 'FAIL',
      title: 'Investigasi berhenti pada Human Error / Direct Cause',
      detail:
        'Belum ada node yang diklasifikasikan sebagai Root Cause (Kegagalan Sistem Manajemen). Hindari menyalahkan korban semata.',
    });
  }

  // 3. Permenaker 03/1998 Consistency (Kode C, D1, D2, E)
  const hasKodeC = nodes.some((n) => n.permenakerCode === 'KODE_C');
  const hasD1 = nodes.some((n) => n.permenakerCode === 'KODE_D1');
  const hasD2 = nodes.some((n) => n.permenakerCode === 'KODE_D2');
  const hasE =
    nodes.some((n) => n.permenakerCode === 'KODE_E_MANAGEMENT') &&
    incident.corrective_actions_kode_e.length > 0;

  if (hasKodeC && hasD1 && hasD2 && hasE) {
    checks.push({
      id: 'chk-permenaker',
      pillar: '3. Konsistensi Kodifikasi Permenaker 03/1998',
      status: 'PASS',
      title: 'Seluruh Kode C, D1, D2, dan E terpetakan konsisten',
      detail:
        'Sumber kecelakaan (Kode C), kondisi berbahaya (D1), tindakan berbahaya (D2), serta tindakan korektif (Kode E) telah sinkron.',
    });
  } else {
    const missing: string[] = [];
    if (!hasKodeC) missing.push('Kode C');
    if (!hasD1) missing.push('Kode D1');
    if (!hasD2) missing.push('Kode D2');
    if (!hasE) missing.push('Kode E');
    checks.push({
      id: 'chk-permenaker',
      pillar: '3. Konsistensi Kodifikasi Permenaker 03/1998',
      status: missing.length >= 2 ? 'FAIL' : 'WARN',
      title: `Kodifikasi belum lengkap (${missing.join(', ')})`,
      detail: `Lengkapi pemetaan ${missing.join(', ')} pada node RCA dan rencana tindakan korektif agar sesuai Lampiran II Permenaker No. 03/MEN/1998.`,
    });
  }

  const passCount = checks.filter((c) => c.status === 'PASS').length;
  const warnCount = checks.filter((c) => c.status === 'WARN').length;
  const scorePct = Math.round(((passCount * 100 + warnCount * 60) / (checks.length * 100)) * 100);
  const overallValid = checks.every((c) => c.status === 'PASS');

  const summary = overallValid
    ? 'Analisis valid! Berhasil menembus hingga kegagalan sistem manajemen (Root Cause) dan selaras penuh dengan Permenaker No. 03/MEN/1998.'
    : 'Analisis masih memerlukan penyempurnaan pada kelengkapan rantai RCA atau pemetaan kode Permenaker No. 03/MEN/1998.';

  return {
    overallValid,
    scorePct,
    summary,
    checks,
  };
}

export function autoMapPermenaker(incident: IncidentCase): PermenakerAutoMap {
  const d1FromTree = incident.rca_tree_nodes
    .filter((n) => n.permenakerCode === 'KODE_D1')
    .map((n) => n.label.replace(/^Why \d+:\s*/i, ''));

  const d2FromTree = incident.rca_tree_nodes
    .filter((n) => n.permenakerCode === 'KODE_D2')
    .map((n) => n.label.replace(/^Why \d+:\s*/i, ''));

  const rootManagement = incident.rca_tree_nodes
    .filter((n) => n.permenakerCode === 'KODE_E_MANAGEMENT')
    .map((n) => n.label.replace(/^Why \d+(\s*\(Root Cause\))?:\s*/i, ''));

  const actionsKodeE = incident.corrective_actions_kode_e.map(
    (a) => `[${a.hierarchy}] ${a.description}`
  );

  const kodeCNode = incident.rca_tree_nodes.find((n) => n.permenakerCode === 'KODE_C');

  return {
    kodeA: incident.victim_details.severity_kode_a,
    kodeC: kodeCNode ? kodeCNode.label.replace(/^Insiden:\s*/i, '') : incident.title,
    kodeD1:
      d1FromTree.length > 0
        ? d1FromTree
        : incident.facts_4p.position.slice(0, 2).map((f) => f.text),
    kodeD2:
      d2FromTree.length > 0
        ? d2FromTree
        : incident.facts_4p.people.slice(0, 2).map((f) => f.text),
    kodeE: actionsKodeE.length > 0 ? actionsKodeE : rootManagement,
  };
}

export function calculateBnspRubric(incident: IncidentCase): BnspRubricResult {
  // Dimension 1: Penguasaan Fakta 4P (20%)
  const allFacts = [
    ...incident.facts_4p.people,
    ...incident.facts_4p.parts,
    ...incident.facts_4p.position,
    ...incident.facts_4p.paper,
  ];
  const categoriesCovered = (['people', 'parts', 'position', 'paper'] as const).filter(
    (k) => incident.facts_4p[k].length > 0
  ).length;
  const verifiedCount = allFacts.filter((f) => f.status === 'Fakta Terverifikasi').length;
  const verifiedRatio = allFacts.length > 0 ? verifiedCount / allFacts.length : 0;
  const score4P = Math.min(
    100,
    Math.round(categoriesCovered * 15 + verifiedRatio * 40)
  );

  // Dimension 2: Kedalaman Logika RCA (30%)
  const audit = evaluateRcaLogic(incident);
  const scoreRca = audit.scorePct;

  // Dimension 3: Penyelarasan Regulasi Permenaker 03/1998 (25%)
  let regPoints = 0;
  if (incident.victim_details.severity_kode_a.trim().length > 0) regPoints += 25;
  if (incident.rca_tree_nodes.some((n) => n.permenakerCode === 'KODE_C')) regPoints += 25;
  if (
    incident.rca_tree_nodes.some((n) => n.permenakerCode === 'KODE_D1') &&
    incident.rca_tree_nodes.some((n) => n.permenakerCode === 'KODE_D2')
  ) {
    regPoints += 25;
  }
  if (incident.regulatory_compliance.sla_status === 'COMPLIANT') {
    regPoints += 25;
  } else if (incident.regulatory_compliance.sla_status === 'WARNING') {
    regPoints += 15;
  } else {
    regPoints += 5;
  }

  // Dimension 4: Kualitas Tindakan Korektif Kode E (25%)
  const actions = incident.corrective_actions_kode_e;
  const hasHighHierarchy = actions.some(
    (a) =>
      a.hierarchy === 'Eliminasi' ||
      a.hierarchy === 'Substitusi' ||
      a.hierarchy === 'Rekayasa Teknik'
  );
  const hasAdminOrPpe = actions.some(
    (a) => a.hierarchy === 'Pengendalian Administratif' || a.hierarchy === 'APD'
  );
  const allHavePicAndDate =
    actions.length > 0 && actions.every((a) => a.pic.trim().length > 0 && a.target_date.trim().length > 0);
  let scoreKodeE = 0;
  if (actions.length > 0) scoreKodeE += 40;
  if (hasHighHierarchy) scoreKodeE += 30;
  if (hasAdminOrPpe) scoreKodeE += 15;
  if (allHavePicAndDate) scoreKodeE += 15;

  const dimensions: BnspRubricDimension[] = [
    {
      key: '4p',
      label: 'Penguasaan Fakta 4P',
      weightPct: 20,
      score: score4P,
      weightedScore: Math.round(score4P * 0.2 * 10) / 10,
      note: `${categoriesCovered}/4 pilar 4P terisi, ${verifiedCount}/${allFacts.length} fakta terverifikasi.`,
    },
    {
      key: 'rca',
      label: 'Kedalaman Logika RCA',
      weightPct: 30,
      score: scoreRca,
      weightedScore: Math.round(scoreRca * 0.3 * 10) / 10,
      note: audit.overallValid
        ? 'Rantai kausalitas utuh hingga kegagalan sistem manajemen.'
        : 'Perlu penguatan kedalaman Why atau Root Cause sistemik.',
    },
    {
      key: 'reg',
      label: 'Penyelarasan Permenaker 03/1998',
      weightPct: 25,
      score: regPoints,
      weightedScore: Math.round(regPoints * 0.25 * 10) / 10,
      note: `SLA 2x24 jam: ${incident.regulatory_compliance.sla_status} (${incident.regulatory_compliance.inspection_form_issued}).`,
    },
    {
      key: 'kode_e',
      label: 'Kualitas Tindakan Korektif Kode E',
      weightPct: 25,
      score: scoreKodeE,
      weightedScore: Math.round(scoreKodeE * 0.25 * 10) / 10,
      note: `${actions.length} rekomendasi aksi (${hasHighHierarchy ? 'mencakup Rekayasa/Eliminasi' : 'perlu kontrol teknik'}).`,
    },
  ];

  const totalScore = Math.round(dimensions.reduce((sum, d) => sum + d.weightedScore, 0));
  const grade =
    totalScore >= 85
      ? 'KOMPETEN (SANGAT BAIK)'
      : totalScore >= 70
      ? 'KOMPETEN'
      : 'PERLU PERBAIKAN';

  return {
    totalScore,
    grade,
    dimensions,
  };
}

export function generateActionsFromRootCause(incident: IncidentCase): CorrectiveActionKodeE[] {
  const rootNodes = incident.rca_tree_nodes.filter(
    (n) => n.role === 'Root Cause' || n.permenakerCode === 'KODE_E_MANAGEMENT'
  );
  const existingDescriptions = new Set(
    incident.corrective_actions_kode_e.map((a) => a.description.toLowerCase())
  );

  const generated: CorrectiveActionKodeE[] = [];
  const nextIndex = incident.corrective_actions_kode_e.length + 1;

  rootNodes.forEach((node, idx) => {
    const cleanText = node.label.replace(/^Why \d+(\s*\(Root Cause\))?:\s*/i, '').trim();
    const engDesc = `Implementasikan proteksi rekayasa teknik & pengaman fisik guna menutup akar masalah: "${cleanText}".`;
    const adminDesc = `Lakukan audit sistem manajemen K3, revisi SOP/PTW, dan verifikasi Stop Work Authority terkait: "${cleanText}".`;

    if (!existingDescriptions.has(engDesc.toLowerCase())) {
      generated.push({
        id: `ACT-GEN-${String(nextIndex + idx * 2).padStart(2, '0')}`,
        hierarchy: 'Rekayasa Teknik',
        hierarchyEn: 'Engineering Control',
        description: engDesc,
        pic: 'Site Engineering Manager',
        target_date: '2026-12-10',
        status: 'Open',
      });
    }
    if (!existingDescriptions.has(adminDesc.toLowerCase())) {
      generated.push({
        id: `ACT-GEN-${String(nextIndex + idx * 2 + 1).padStart(2, '0')}`,
        hierarchy: 'Pengendalian Administratif',
        hierarchyEn: 'Administrative Control',
        description: adminDesc,
        pic: 'HSE Manager',
        target_date: '2026-12-03',
        status: 'Open',
      });
    }
  });

  return generated;
}

export function exportCasesToCsv(cases: IncidentCase[]): string {
  const headers = [
    'ID Insiden',
    'Kode Kasus',
    'Tanggal',
    'Proyek',
    'Perusahaan',
    'KLUI',
    'Klasifikasi Permenaker 03/1998',
    'Tipe Kecelakaan',
    'Korban',
    'Bagian Tubuh Cidera',
    'Kode A (Akibat)',
    'Jam Hilang',
    'Biaya Medis (IDR)',
    'Kerugian Properti (IDR)',
    'No Form 3 KK2 A',
    'Jam Lapor',
    'Status SLA 2x24 Jam',
    'Dokumen Terbit',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = cases.map((c) => [
    c.incident_id,
    c.case_code,
    c.incident_date,
    c.project_name,
    c.company_name,
    c.klui_code,
    c.incident_category,
    c.accident_type,
    c.victim_details.name,
    c.victim_details.injured_body_part,
    c.victim_details.severity_kode_a,
    c.victim_details.lost_work_hours,
    c.victim_details.medical_cost_idr,
    c.victim_details.property_loss_idr,
    c.regulatory_compliance.form_3_kk2a_number,
    c.regulatory_compliance.submission_hours_elapsed,
    c.regulatory_compliance.sla_status,
    c.regulatory_compliance.inspection_form_issued,
  ]);

  return [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join(
    '\n'
  );
}

export function parseImportedIncidentJson(rawJson: string): {
  valid: boolean;
  data?: IncidentCase;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson) as Partial<IncidentCase>;
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Format JSON harus berupa objek kasus kecelakaan.' };
    }
    if (!parsed.incident_id || !parsed.project_name || !parsed.victim_details) {
      return {
        valid: false,
        error: 'Field wajib minimal (incident_id, project_name, victim_details) tidak lengkap.',
      };
    }

    const hours = Number(parsed.regulatory_compliance?.submission_hours_elapsed ?? 24);
    const submitted = Boolean(parsed.regulatory_compliance?.form_3_kk2a_submitted ?? true);

    const normalized: IncidentCase = {
      incident_id: String(parsed.incident_id),
      case_code: String(parsed.case_code || parsed.incident_id),
      title: String(parsed.title || `Investigasi Kasus ${parsed.incident_id}`),
      project_name: String(parsed.project_name),
      company_name: String(parsed.company_name || 'PT Kontraktor K3 Nasional'),
      klui_code: String(parsed.klui_code || '45203'),
      incident_date: String(parsed.incident_date || '2026-11-17T10:00:00'),
      location: String(parsed.location || 'Area Proyek Utama'),
      incident_category: parsed.incident_category || 'Kecelakaan Kerja',
      accident_type: parsed.accident_type || 'Terjepit / Terhimpit',
      chronology: String(parsed.chronology || 'Kronologi diimpor dari berkas JSON.'),
      is_lti: parsed.is_lti ?? (parsed.victim_details.lost_work_hours ?? 0) > 0,
      victim_details: {
        name: String(parsed.victim_details.name || 'Tenaga Kerja'),
        age: Number(parsed.victim_details.age || 30),
        role: String(parsed.victim_details.role || 'Teknisi Lapangan'),
        bpjs_kpa: String(parsed.victim_details.bpjs_kpa || '-'),
        severity_kode_a: String(parsed.victim_details.severity_kode_a || 'Luka Ringan'),
        injured_body_part: String(parsed.victim_details.injured_body_part || 'Tangan'),
        lost_work_hours: Number(parsed.victim_details.lost_work_hours ?? 0),
        medical_cost_idr: Number(parsed.victim_details.medical_cost_idr ?? 0),
        property_loss_idr: Number(parsed.victim_details.property_loss_idr ?? 0),
      },
      facts_4p: parsed.facts_4p || {
        people: [],
        parts: [],
        position: [],
        paper: [],
      },
      rca_tree_nodes:
        Array.isArray(parsed.rca_tree_nodes) && parsed.rca_tree_nodes.length > 0
          ? parsed.rca_tree_nodes
          : [
              {
                id: 'node_0',
                parentId: null,
                level: 0,
                label: `Insiden: ${parsed.title || parsed.incident_id}`,
                role: 'Incident/Symptom',
                permenakerCode: 'KODE_C',
              },
            ],
      regulatory_compliance: {
        form_3_kk2a_number: String(
          parsed.regulatory_compliance?.form_3_kk2a_number || `KK2A-${parsed.incident_id}`
        ),
        form_3_kk2a_submitted: submitted,
        submission_hours_elapsed: hours,
        sla_status:
          parsed.regulatory_compliance?.sla_status || computeSlaStatus(submitted, hours),
        inspection_form_issued:
          parsed.regulatory_compliance?.inspection_form_issued || 'Lampiran II',
      },
      corrective_actions_kode_e: Array.isArray(parsed.corrective_actions_kode_e)
        ? parsed.corrective_actions_kode_e
        : [],
    };

    return { valid: true, data: normalized };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'JSON tidak valid.',
    };
  }
}
