import {
  Client, StaffMember, Lane, ScheduledService, Authorization,
  BillingRate, SystemAlert, LaneId, ClientFlag,
} from './types';

// ── Billing Rates (approximate Ohio Medicaid) ─────────────────────────────────
export const BILLING_RATES: BillingRate[] = [
  { serviceCode: 'H0015', serviceDisplay: 'IOP Group (H0015)', ratePerUnit: 8.00, unitDurationMinutes: 15, unitLabel: 'per 15 min/client' },
  { serviceCode: '90837', serviceDisplay: 'Individual Therapy 60min (90837)', ratePerUnit: 148.00, unitDurationMinutes: 60, unitLabel: 'per session' },
  { serviceCode: 'T1016', serviceDisplay: 'Case Management (T1016)', ratePerUnit: 15.00, unitDurationMinutes: 15, unitLabel: 'per 15 min' },
  { serviceCode: 'H0038', serviceDisplay: 'Peer Support (H0038)', ratePerUnit: 5.50, unitDurationMinutes: 15, unitLabel: 'per 15 min' },
  { serviceCode: 'H0005', serviceDisplay: 'Group Alcohol/Drug Svcs (H0005)', ratePerUnit: 7.50, unitDurationMinutes: 15, unitLabel: 'per 15 min/client' },
];

// ── Staff ─────────────────────────────────────────────────────────────────────
export const MOCK_STAFF: StaffMember[] = [
  // Supervisor
  {
    id: 'S00', name: 'Dr. Patricia Morales', role: 'supervisor', credential: 'LPCC-S',
    allowedServiceTypes: ['supervision', 'assessment', 'treatment_team', 'admin'],
    laneId: 'all', supervisorId: null,
    billableHoursTarget: 20, scheduledBillableHours: 18, completedBillableHours: 16, documentedBillableHours: 16,
    hourlyRate: 40.87, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 0, lateNotesCount: 0, missingNotesCount: 0, status: 'active',
  },
  // QA Coordinator
  {
    id: 'S01', name: 'Angela Torres', role: 'qa_coordinator', credential: 'LSW',
    allowedServiceTypes: ['admin', 'treatment_team'],
    laneId: 'all', supervisorId: 'S00',
    billableHoursTarget: 10, scheduledBillableHours: 8, completedBillableHours: 8, documentedBillableHours: 8,
    hourlyRate: 24.04, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 0, lateNotesCount: 0, missingNotesCount: 0, status: 'active',
  },
  // PA/UR Coordinator
  {
    id: 'S02', name: 'Deja Washington', role: 'pa_ur', credential: 'BA',
    allowedServiceTypes: ['admin'],
    laneId: 'all', supervisorId: 'S00',
    billableHoursTarget: 0, scheduledBillableHours: 0, completedBillableHours: 0, documentedBillableHours: 0,
    hourlyRate: 22.12, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 0, lateNotesCount: 0, missingNotesCount: 0, status: 'active',
  },
  // Lane 1 Lead
  {
    id: 'C01', name: 'Marcus Webb', role: 'lead_counselor', credential: 'LPCC',
    allowedServiceTypes: ['iop_group', 'individual_counseling', 'treatment_team', 'assessment', 'supervision'],
    laneId: 'lane1', supervisorId: 'S00',
    billableHoursTarget: 34, scheduledBillableHours: 36, completedBillableHours: 33, documentedBillableHours: 30,
    hourlyRate: 31.25, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 12, lateNotesCount: 3, missingNotesCount: 0, status: 'active',
  },
  // Lane 1 Co-Lead
  {
    id: 'C02', name: 'Simone Grant', role: 'co_lead', credential: 'LPC',
    allowedServiceTypes: ['iop_group', 'individual_counseling', 'treatment_team', 'assessment'],
    laneId: 'lane1', supervisorId: 'C01',
    billableHoursTarget: 34, scheduledBillableHours: 34, completedBillableHours: 31, documentedBillableHours: 31,
    hourlyRate: 26.44, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 12, lateNotesCount: 1, missingNotesCount: 0, status: 'active',
  },
  // Lane 2 Lead
  {
    id: 'C03', name: 'Raymond Osei', role: 'lead_counselor', credential: 'LPCC',
    allowedServiceTypes: ['iop_group', 'individual_counseling', 'treatment_team', 'assessment', 'supervision'],
    laneId: 'lane2', supervisorId: 'S00',
    billableHoursTarget: 34, scheduledBillableHours: 34, completedBillableHours: 28, documentedBillableHours: 26,
    hourlyRate: 31.25, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 12, lateNotesCount: 5, missingNotesCount: 2, status: 'active',
  },
  // Lane 2 Co-Lead
  {
    id: 'C04', name: 'Brianna Holt', role: 'co_lead', credential: 'LPC',
    allowedServiceTypes: ['iop_group', 'individual_counseling', 'treatment_team', 'assessment'],
    laneId: 'lane2', supervisorId: 'C03',
    billableHoursTarget: 34, scheduledBillableHours: 30, completedBillableHours: 28, documentedBillableHours: 28,
    hourlyRate: 26.44, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 12, lateNotesCount: 0, missingNotesCount: 1, status: 'active',
  },
  // Virtual Lane Lead
  {
    id: 'C05', name: 'Lindsey Cho', role: 'lead_counselor', credential: 'LPCC',
    allowedServiceTypes: ['iop_group', 'individual_counseling', 'treatment_team', 'assessment', 'supervision'],
    laneId: 'virtual', supervisorId: 'S00',
    billableHoursTarget: 34, scheduledBillableHours: 34, completedBillableHours: 34, documentedBillableHours: 34,
    hourlyRate: 31.25, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 12, lateNotesCount: 0, missingNotesCount: 0, status: 'active',
  },
  // Virtual Lane Co-Lead
  {
    id: 'C06', name: 'Derek Fountain', role: 'virtual_contractor', credential: 'LPC',
    allowedServiceTypes: ['iop_group', 'individual_counseling'],
    laneId: 'virtual', supervisorId: 'C05',
    billableHoursTarget: 30, scheduledBillableHours: 30, completedBillableHours: 29, documentedBillableHours: 29,
    hourlyRate: 35.00, weeklyAvailability: { monday: 7, tuesday: 7, wednesday: 7, thursday: 7, friday: 7 },
    clientCount: 12, lateNotesCount: 0, missingNotesCount: 0, status: 'active',
  },
  // Individual Counselor (Lane 1)
  {
    id: 'C07', name: 'Tiffany Reeves', role: 'individual_counselor', credential: 'LSW',
    allowedServiceTypes: ['individual_counseling', 'assessment'],
    laneId: 'lane1', supervisorId: 'C01',
    billableHoursTarget: 34, scheduledBillableHours: 32, completedBillableHours: 29, documentedBillableHours: 27,
    hourlyRate: 24.04, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 0, lateNotesCount: 4, missingNotesCount: 2, status: 'active',
  },
  // Individual Counselor (Lane 2)
  {
    id: 'C08', name: 'Jerome Pittman', role: 'individual_counselor', credential: 'LCDC II',
    allowedServiceTypes: ['individual_counseling', 'assessment'],
    laneId: 'lane2', supervisorId: 'C03',
    billableHoursTarget: 34, scheduledBillableHours: 28, completedBillableHours: 22, documentedBillableHours: 20,
    hourlyRate: 24.04, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 0, thursday: 8, friday: 8 },
    clientCount: 0, lateNotesCount: 6, missingNotesCount: 4, status: 'active',
  },
  // Case Managers
  {
    id: 'CM01', name: 'Nadia Rivera', role: 'case_manager', credential: 'BA/LSW',
    allowedServiceTypes: ['case_management', 'treatment_team'],
    laneId: 'lane1', supervisorId: 'S00',
    billableHoursTarget: 34, scheduledBillableHours: 40, completedBillableHours: 38, documentedBillableHours: 36,
    hourlyRate: 19.23, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 24, lateNotesCount: 2, missingNotesCount: 0, status: 'active',
  },
  {
    id: 'CM02', name: 'Calvin Stokes', role: 'case_manager', credential: 'BA',
    allowedServiceTypes: ['case_management', 'treatment_team'],
    laneId: 'lane2', supervisorId: 'S00',
    billableHoursTarget: 34, scheduledBillableHours: 42, completedBillableHours: 38, documentedBillableHours: 34,
    hourlyRate: 19.23, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 24, lateNotesCount: 4, missingNotesCount: 1, status: 'active',
  },
  {
    id: 'CM03', name: 'Yolanda Burns', role: 'case_manager', credential: 'BA/LSW',
    allowedServiceTypes: ['case_management', 'treatment_team'],
    laneId: 'virtual', supervisorId: 'S00',
    billableHoursTarget: 34, scheduledBillableHours: 36, completedBillableHours: 34, documentedBillableHours: 33,
    hourlyRate: 19.23, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 24, lateNotesCount: 1, missingNotesCount: 0, status: 'active',
  },
  // Peer Specialists
  {
    id: 'PS01', name: 'Terry Nash', role: 'peer_specialist', credential: 'CPRS',
    allowedServiceTypes: ['peer_support', 'h0005_group'],
    laneId: 'lane1', supervisorId: 'CM01',
    billableHoursTarget: 34, scheduledBillableHours: 36, completedBillableHours: 34, documentedBillableHours: 32,
    hourlyRate: 18.50, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 8, lateNotesCount: 3, missingNotesCount: 1, status: 'active',
  },
  {
    id: 'PS02', name: 'Monica Fields', role: 'peer_specialist', credential: 'CPRS',
    allowedServiceTypes: ['peer_support', 'h0005_group'],
    laneId: 'lane1', supervisorId: 'CM01',
    billableHoursTarget: 34, scheduledBillableHours: 34, completedBillableHours: 31, documentedBillableHours: 30,
    hourlyRate: 18.50, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 8, lateNotesCount: 1, missingNotesCount: 0, status: 'active',
  },
  {
    id: 'PS03', name: 'Devon Carter', role: 'peer_specialist', credential: 'CPRS',
    allowedServiceTypes: ['peer_support', 'h0005_group'],
    laneId: 'lane1', supervisorId: 'CM01',
    billableHoursTarget: 34, scheduledBillableHours: 34, completedBillableHours: 32, documentedBillableHours: 31,
    hourlyRate: 18.50, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 8, lateNotesCount: 0, missingNotesCount: 0, status: 'active',
  },
  {
    id: 'PS04', name: 'Sandra Byrd', role: 'peer_specialist', credential: 'CPRS',
    allowedServiceTypes: ['peer_support', 'h0005_group'],
    laneId: 'lane2', supervisorId: 'CM02',
    billableHoursTarget: 34, scheduledBillableHours: 30, completedBillableHours: 27, documentedBillableHours: 24,
    hourlyRate: 18.50, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 8, lateNotesCount: 5, missingNotesCount: 3, status: 'active',
  },
  {
    id: 'PS05', name: 'Marcus Owens', role: 'peer_specialist', credential: 'CPRS',
    allowedServiceTypes: ['peer_support', 'h0005_group'],
    laneId: 'lane2', supervisorId: 'CM02',
    billableHoursTarget: 34, scheduledBillableHours: 34, completedBillableHours: 33, documentedBillableHours: 32,
    hourlyRate: 18.50, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 8, lateNotesCount: 1, missingNotesCount: 0, status: 'active',
  },
  {
    id: 'PS06', name: 'Lisa Monroe', role: 'peer_specialist', credential: 'CPRS',
    allowedServiceTypes: ['peer_support', 'h0005_group'],
    laneId: 'lane2', supervisorId: 'CM02',
    billableHoursTarget: 34, scheduledBillableHours: 34, completedBillableHours: 30, documentedBillableHours: 28,
    hourlyRate: 18.50, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 8, lateNotesCount: 2, missingNotesCount: 1, status: 'active',
  },
  {
    id: 'PS07', name: 'Clarence Wade', role: 'peer_specialist', credential: 'CPRS',
    allowedServiceTypes: ['peer_support', 'h0005_group'],
    laneId: 'virtual', supervisorId: 'CM03',
    billableHoursTarget: 34, scheduledBillableHours: 32, completedBillableHours: 30, documentedBillableHours: 30,
    hourlyRate: 18.50, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 12, lateNotesCount: 0, missingNotesCount: 0, status: 'active',
  },
  {
    id: 'PS08', name: 'Alicia Fernandez', role: 'peer_specialist', credential: 'CPRS',
    allowedServiceTypes: ['peer_support', 'h0005_group'],
    laneId: 'virtual', supervisorId: 'CM03',
    billableHoursTarget: 34, scheduledBillableHours: 34, completedBillableHours: 32, documentedBillableHours: 32,
    hourlyRate: 18.50, weeklyAvailability: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8 },
    clientCount: 12, lateNotesCount: 0, missingNotesCount: 0, status: 'active',
  },
];

// ── Lanes ─────────────────────────────────────────────────────────────────────
export const MOCK_LANES: Lane[] = [
  {
    id: 'lane1', name: 'Lane 1 — IOP (On-Site)',
    groupDays: ['Monday', 'Wednesday', 'Friday'],
    groupStartTime: '9:00 AM', groupEndTime: '12:00 PM', groupHoursPerDay: 3,
    capacity: 24, leadCounselorId: 'C01', coLeadId: 'C02',
    caseManagerIds: ['CM01'], peerWorkerIds: ['PS01', 'PS02', 'PS03'],
    requiresH0005: true, requiresTelehealth: false,
  },
  {
    id: 'lane2', name: 'Lane 2 — IOP (On-Site)',
    groupDays: ['Tuesday', 'Thursday', 'Friday'],
    groupStartTime: '1:00 PM', groupEndTime: '4:00 PM', groupHoursPerDay: 3,
    capacity: 24, leadCounselorId: 'C03', coLeadId: 'C04',
    caseManagerIds: ['CM02'], peerWorkerIds: ['PS04', 'PS05', 'PS06'],
    requiresH0005: true, requiresTelehealth: false,
  },
  {
    id: 'virtual', name: 'Virtual Lane — IOP (Telehealth)',
    groupDays: ['Monday', 'Wednesday', 'Thursday'],
    groupStartTime: '5:30 PM', groupEndTime: '8:30 PM', groupHoursPerDay: 3,
    capacity: 24, leadCounselorId: 'C05', coLeadId: 'C06',
    caseManagerIds: ['CM03'], peerWorkerIds: ['PS07', 'PS08'],
    requiresH0005: false, requiresTelehealth: true,
  },
];

// ── Client generation helpers ─────────────────────────────────────────────────
const DIAGNOSES = [
  { code: 'F11.20', display: 'Opioid Use Disorder, Moderate' },
  { code: 'F14.20', display: 'Cocaine Use Disorder, Moderate' },
  { code: 'F10.20', display: 'Alcohol Use Disorder, Severe' },
  { code: 'F11.20', display: 'Opioid Use Disorder, Moderate' },
  { code: 'F10.20', display: 'Alcohol Use Disorder, Severe' },
  { code: 'F19.20', display: 'Polysubstance Use Disorder' },
  { code: 'F33.1', display: 'Major Depressive Disorder, Mod (Co-occurring)' },
  { code: 'F41.1', display: 'Generalized Anxiety Disorder (Co-occurring)' },
];

const RISK_LEVELS: Array<'low' | 'moderate' | 'high' | 'crisis'> = [
  'low','low','low','moderate','moderate','moderate','moderate','high','high','crisis',
];
const TX_PLAN_STATUSES: Array<'current' | 'due_soon' | 'overdue' | 'missing'> = [
  'current','current','current','current','current','current','due_soon','due_soon','overdue','missing',
];

function generateClients(): Client[] {
  const clients: Client[] = [];
  const COUNSELORS: Record<LaneId, [string | null, string | null][]> = {
    lane1: [
      ['C01','CM01'], ['C01','CM01'], ['C01','CM01'], ['C01','CM01'],
      ['C01','CM01'], ['C01','CM01'], ['C01','CM01'], ['C01','CM01'],
      ['C01','CM01'], ['C01','CM01'], ['C01','CM01'], ['C01','CM01'],
      ['C02','CM01'], ['C02','CM01'], ['C02','CM01'], ['C02','CM01'],
      ['C02','CM01'], ['C02','CM01'], ['C02','CM01'], ['C02','CM01'],
      ['C02','CM01'], ['C02','CM01'], ['C02','CM01'], ['C02','CM01'],
    ],
    lane2: [
      ['C03','CM02'], ['C03','CM02'], ['C03','CM02'], ['C03','CM02'],
      ['C03','CM02'], ['C03','CM02'], ['C03','CM02'], ['C03','CM02'],
      ['C03','CM02'], ['C03','CM02'], ['C03','CM02'], ['C03','CM02'],
      ['C04','CM02'], ['C04','CM02'], ['C04','CM02'], ['C04','CM02'],
      ['C04','CM02'], ['C04','CM02'], ['C04','CM02'], ['C04','CM02'],
      ['C04','CM02'], ['C04','CM02'], ['C04','CM02'], ['C04','CM02'],
    ],
    virtual: [
      ['C05','CM03'], ['C05','CM03'], ['C05','CM03'], ['C05','CM03'],
      ['C05','CM03'], ['C05','CM03'], ['C05','CM03'], ['C05','CM03'],
      ['C05','CM03'], ['C05','CM03'], ['C05','CM03'], ['C05','CM03'],
      ['C06','CM03'], ['C06','CM03'], ['C06','CM03'], ['C06','CM03'],
      ['C06','CM03'], ['C06','CM03'], ['C06','CM03'], ['C06','CM03'],
      ['C06','CM03'], ['C06','CM03'], ['C06','CM03'], ['C06','CM03'],
    ],
  };

  const PEERS: Record<LaneId, (string | null)[]> = {
    lane1: Array(24).fill(null).map((_, i) => i < 8 ? 'PS01' : i < 16 ? 'PS02' : 'PS03'),
    lane2: Array(24).fill(null).map((_, i) => i < 8 ? 'PS04' : i < 16 ? 'PS05' : 'PS06'),
    virtual: Array(24).fill(null).map((_, i) => i < 12 ? 'PS07' : 'PS08'),
  };

  const PREFIXES: Record<LaneId, string> = { lane1: 'L1', lane2: 'L2', virtual: 'VL' };
  const LANES: LaneId[] = ['lane1', 'lane2', 'virtual'];

  LANES.forEach((laneId) => {
    for (let i = 0; i < 24; i++) {
      const idx = i % DIAGNOSES.length;
      const riskIdx = (i * 3 + laneId.length) % RISK_LEVELS.length;
      const txIdx = (i * 7 + laneId.length) % TX_PLAN_STATUSES.length;
      const dx = DIAGNOSES[idx];
      const risk = RISK_LEVELS[riskIdx];
      const txStatus = TX_PLAN_STATUSES[txIdx];
      const attendanceBase = risk === 'crisis' ? 45 : risk === 'high' ? 60 : risk === 'moderate' ? 75 : 88;
      const attendanceRate = Math.min(100, attendanceBase + ((i * 11) % 15));
      const peerWorker = PEERS[laneId][i];
      const [counselor, cm] = COUNSELORS[laneId][i];

      // Some clients missing assignments (simulates gaps)
      const missingCounselor = (laneId === 'lane2' && i === 22) || (laneId === 'virtual' && i === 23);
      const missingCM = laneId === 'lane1' && i === 23;
      const missingPeer = (laneId === 'lane2' && i === 23) || (laneId === 'lane1' && i === 21);

      const flags: ClientFlag[] = [];
      if (risk === 'high' || risk === 'crisis') {
        flags.push({ type: 'high_risk', message: `${risk === 'crisis' ? 'Crisis' : 'High'} risk — requires daily check-in`, severity: risk === 'crisis' ? 'critical' : 'warning' });
      }
      if (missingCounselor) flags.push({ type: 'no_counselor', message: 'No counselor assigned', severity: 'critical' });
      if (missingCM) flags.push({ type: 'no_cm', message: 'No case manager assigned', severity: 'critical' });
      if (missingPeer) flags.push({ type: 'no_peer', message: 'No peer support assigned', severity: 'warning' });
      if (txStatus === 'overdue') flags.push({ type: 'tx_plan_due', message: 'Treatment plan overdue', severity: 'critical' });
      if (txStatus === 'due_soon') flags.push({ type: 'tx_plan_due', message: 'Treatment plan due within 7 days', severity: 'warning' });
      if (attendanceRate < 60) flags.push({ type: 'attendance_risk', message: `Low attendance (${attendanceRate}%)`, severity: 'warning' });

      const paThreshold = (i % 5 === 0);
      const paUnitsAuth = 90;
      const paUnitsUsed = paThreshold ? 81 : 40 + (i % 30);
      if (paThreshold) {
        flags.push({ type: 'pa_threshold', message: `PA at ${Math.round((paUnitsUsed / paUnitsAuth) * 100)}% of authorized units`, severity: 'warning' });
      }

      const paExpiring = (laneId === 'lane2' && i < 3);
      if (paExpiring) {
        flags.push({ type: 'pa_expiring', message: 'PA expires within 14 days', severity: 'warning' });
      }

      const num = String(i + 1).padStart(3, '0');
      clients.push({
        id: `${PREFIXES[laneId]}-${num}`,
        displayName: `Client ${PREFIXES[laneId]}-${num}`,
        laneId,
        status: 'active',
        diagnosisCode: dx.code,
        diagnosisDisplay: dx.display,
        asamLevel: '2.1',
        levelOfCare: 'IOP',
        riskLevel: risk,
        enrollmentDate: '2026-04-01',
        assignedCounselorId: missingCounselor ? null : counselor,
        assignedCaseManagerId: missingCM ? null : cm,
        assignedPeerWorkerId: missingPeer ? null : peerWorker,
        h0005Eligible: idx % 3 !== 0,
        transportationNeeds: (i % 4 === 0),
        telehealthReady: laneId === 'virtual',
        treatmentPlanStatus: txStatus,
        treatmentPlanDueDate: txStatus === 'overdue' ? '2026-05-30' : txStatus === 'due_soon' ? '2026-06-18' : '2026-07-15',
        attendanceRate,
        lastServiceDate: '2026-06-13',
        flags,
        paExpiresDate: paExpiring ? '2026-06-28' : '2026-08-01',
        paUnitsUsed,
        paUnitsAuthorized: paUnitsAuth,
      });
    }
  });

  return clients;
}

export const MOCK_CLIENTS: Client[] = generateClients();

// ── Scheduled Services (current week Jun 9–13 2026) ─────────────────────────
function generateServices(): ScheduledService[] {
  const services: ScheduledService[] = [];
  let sid = 1;

  const noteStatuses = (completed: boolean): import('./types').NoteStatus => {
    if (!completed) return 'pending';
    const r = sid % 10;
    if (r === 0) return 'missing';
    if (r === 1) return 'late_note';
    if (r === 2) return 'needs_correction';
    return 'documented';
  };

  // IOP Groups — per client per group day
  const laneGroupDays: Record<LaneId, { date: string; start: string; end: string }[]> = {
    lane1: [
      { date: '2026-06-09', start: '09:00', end: '12:00' },
      { date: '2026-06-11', start: '09:00', end: '12:00' },
      { date: '2026-06-13', start: '09:00', end: '12:00' },
    ],
    lane2: [
      { date: '2026-06-10', start: '13:00', end: '16:00' },
      { date: '2026-06-12', start: '13:00', end: '16:00' },
      { date: '2026-06-13', start: '13:00', end: '16:00' },
    ],
    virtual: [
      { date: '2026-06-09', start: '17:30', end: '20:30' },
      { date: '2026-06-11', start: '17:30', end: '20:30' },
      { date: '2026-06-12', start: '17:30', end: '20:30' },
    ],
  };

  const laneLeads: Record<LaneId, string> = { lane1: 'C01', lane2: 'C03', virtual: 'C05' };

  MOCK_CLIENTS.forEach((client) => {
    const groupDays = laneGroupDays[client.laneId];
    groupDays.forEach((gd) => {
      const isCompleted = gd.date < '2026-06-14';
      const noShow = client.attendanceRate < 75 && sid % 7 === 0;
      services.push({
        id: `SVC-${sid++}`,
        clientId: client.id,
        staffId: laneLeads[client.laneId],
        laneId: client.laneId,
        serviceType: 'iop_group',
        serviceCode: 'H0015',
        date: gd.date,
        startTime: gd.start,
        endTime: gd.end,
        durationMinutes: 180,
        billable: !noShow,
        telehealth: client.laneId === 'virtual',
        status: noShow ? 'no_show' : isCompleted ? 'completed' : 'scheduled',
        noteStatus: noteStatuses(isCompleted && !noShow),
        paRequired: true,
      });
    });

    // Individual Counseling — 1 per client per week
    const indivCounselor = client.assignedCounselorId ?? laneLeads[client.laneId];
    const indivDate = client.laneId === 'lane1' ? '2026-06-10' : client.laneId === 'lane2' ? '2026-06-11' : '2026-06-10';
    const indivNoShow = client.attendanceRate < 65 && sid % 5 === 0;
    services.push({
      id: `SVC-${sid++}`,
      clientId: client.id,
      staffId: indivCounselor,
      laneId: client.laneId,
      serviceType: 'individual_counseling',
      serviceCode: '90837',
      date: indivDate,
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      billable: !indivNoShow,
      telehealth: client.laneId === 'virtual',
      status: indivNoShow ? 'no_show' : 'completed',
      noteStatus: noteStatuses(true),
      paRequired: false,
    });

    // Case Management — 2 per client per week
    const cmId = client.assignedCaseManagerId ?? 'CM01';
    [{ date: '2026-06-09', start: '13:00', end: '14:00' }, { date: '2026-06-12', start: '13:00', end: '14:00' }].forEach((slot) => {
      services.push({
        id: `SVC-${sid++}`,
        clientId: client.id,
        staffId: cmId,
        laneId: client.laneId,
        serviceType: 'case_management',
        serviceCode: 'T1016',
        date: slot.date,
        startTime: slot.start,
        endTime: slot.end,
        durationMinutes: 60,
        billable: true,
        telehealth: client.laneId === 'virtual',
        status: slot.date <= '2026-06-13' ? 'completed' : 'scheduled',
        noteStatus: noteStatuses(slot.date <= '2026-06-13'),
        paRequired: false,
      });
    });

    // Peer Support — generate a few sessions per client
    if (client.assignedPeerWorkerId) {
      const peerDates = ['2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13'];
      peerDates.slice(0, 3).forEach((date) => {
        services.push({
          id: `SVC-${sid++}`,
          clientId: client.id,
          staffId: client.assignedPeerWorkerId!,
          laneId: client.laneId,
          serviceType: 'peer_support',
          serviceCode: 'H0038',
          date,
          startTime: '14:00',
          endTime: '15:00',
          durationMinutes: 60,
          billable: true,
          telehealth: client.laneId === 'virtual',
          status: date <= '2026-06-13' ? 'completed' : 'scheduled',
          noteStatus: noteStatuses(date <= '2026-06-13'),
          paRequired: false,
        });
      });
    }
  });

  return services;
}

export const MOCK_SERVICES: ScheduledService[] = generateServices();

// ── Authorizations ────────────────────────────────────────────────────────────
const MCO_LIST = ['CareSource', 'Molina Healthcare', 'United Healthcare', 'Buckeye Health', 'Paramount Advantage'];

function generateAuthorizations(): Authorization[] {
  const auths: Authorization[] = [];
  let aid = 1;

  MOCK_CLIENTS.forEach((client, i) => {
    const mco = MCO_LIST[i % MCO_LIST.length];
    const unitsAuth = 90;
    const unitsUsed = client.paUnitsUsed ?? 40;
    const nearThreshold = unitsUsed >= 81;
    const paExpiring = !!(client.paExpiresDate && client.paExpiresDate < '2026-06-28');

    let authStatus: import('./types').AuthStatus = 'active';
    if (nearThreshold) authStatus = 'concurrent_review_due';
    if (paExpiring) authStatus = 'concurrent_review_due';
    if (i % 15 === 0) authStatus = 'pending_determination';
    if (i % 20 === 0) authStatus = 'pended';

    auths.push({
      id: `AUTH-${String(aid++).padStart(4, '0')}`,
      clientId: client.id,
      clientName: client.displayName,
      payer: 'Ohio Medicaid',
      mco,
      serviceCode: 'H0015',
      serviceDisplay: 'IOP Group (H0015)',
      authStatus,
      unitsAuthorized: unitsAuth,
      unitsUsed,
      thresholdWarningPct: 90,
      startDate: '2026-04-01',
      endDate: client.paExpiresDate ?? '2026-08-01',
      paSubmittedDate: '2026-03-28',
      determinationDueDate: authStatus === 'pending_determination' ? '2026-06-18' : undefined,
      concurrentReviewDate: nearThreshold ? '2026-06-16' : undefined,
      ownerId: 'S02',
      ownerName: 'Deja Washington',
      laneId: client.laneId,
      notes: '',
      denialCount: i % 12 === 0 ? 1 : 0,
      appealCount: i % 20 === 0 ? 1 : 0,
    });
  });

  return auths;
}

export const MOCK_AUTHORIZATIONS: Authorization[] = generateAuthorizations();

// ── System Alerts ─────────────────────────────────────────────────────────────
export const MOCK_ALERTS: SystemAlert[] = [
  {
    id: 'ALT-001', type: 'service_gap', severity: 'critical',
    message: 'Client L2-023 has no counselor assigned',
    entityType: 'client', entityId: 'L2-023', entityName: 'Client L2-023',
    createdAt: '2026-06-14T06:00:00', resolved: false,
  },
  {
    id: 'ALT-002', type: 'service_gap', severity: 'critical',
    message: 'Client VL-024 has no counselor assigned',
    entityType: 'client', entityId: 'VL-024', entityName: 'Client VL-024',
    createdAt: '2026-06-14T06:00:00', resolved: false,
  },
  {
    id: 'ALT-003', type: 'service_gap', severity: 'critical',
    message: 'Client L1-024 has no case manager assigned',
    entityType: 'client', entityId: 'L1-024', entityName: 'Client L1-024',
    createdAt: '2026-06-14T06:00:00', resolved: false,
  },
  {
    id: 'ALT-004', type: 'documentation', severity: 'warning',
    message: 'Jerome Pittman has 6 late notes and 4 missing notes — review required',
    entityType: 'staff', entityId: 'C08', entityName: 'Jerome Pittman',
    createdAt: '2026-06-14T06:00:00', resolved: false,
  },
  {
    id: 'ALT-005', type: 'productivity', severity: 'warning',
    message: 'Jerome Pittman is scheduled for only 28 billable hours this week (target: 34)',
    entityType: 'staff', entityId: 'C08', entityName: 'Jerome Pittman',
    createdAt: '2026-06-14T06:00:00', resolved: false,
  },
  {
    id: 'ALT-006', type: 'authorization', severity: 'critical',
    message: '3 clients in Lane 2 have PA expiring within 14 days',
    entityType: 'lane', entityId: 'lane2', entityName: 'Lane 2',
    createdAt: '2026-06-14T06:00:00', resolved: false,
  },
  {
    id: 'ALT-007', type: 'authorization', severity: 'warning',
    message: '8 clients across all lanes have reached 90%+ of authorized PA units — concurrent review due',
    entityType: 'system', createdAt: '2026-06-14T06:00:00', resolved: false,
  },
  {
    id: 'ALT-008', type: 'documentation', severity: 'critical',
    message: 'Raymond Osei has 5 late notes and 2 missing notes — supervisor review required',
    entityType: 'staff', entityId: 'C03', entityName: 'Raymond Osei',
    createdAt: '2026-06-14T06:00:00', resolved: false,
  },
  {
    id: 'ALT-009', type: 'compliance', severity: 'warning',
    message: '5 clients have treatment plans due within 7 days',
    entityType: 'system', createdAt: '2026-06-14T06:00:00', resolved: false,
  },
  {
    id: 'ALT-010', type: 'service_gap', severity: 'warning',
    message: 'Client L2-024 has no peer support assigned',
    entityType: 'client', entityId: 'L2-024', entityName: 'Client L2-024',
    createdAt: '2026-06-14T06:00:00', resolved: false,
  },
];
