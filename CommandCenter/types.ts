export type LaneId = 'lane1' | 'lane2' | 'virtual';
export type ClientStatus = 'active' | 'discharged' | 'on_hold';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'crisis';
export type StaffRole =
  | 'lead_counselor'
  | 'co_lead'
  | 'individual_counselor'
  | 'case_manager'
  | 'peer_specialist'
  | 'virtual_contractor'
  | 'supervisor'
  | 'qa_coordinator'
  | 'pa_ur';

export type ServiceType =
  | 'iop_group'
  | 'individual_counseling'
  | 'case_management'
  | 'peer_support'
  | 'h0005_group'
  | 'treatment_team'
  | 'assessment'
  | 'supervision'
  | 'admin';

export type ServiceStatus =
  | 'scheduled'
  | 'completed'
  | 'no_show'
  | 'cancelled_client'
  | 'cancelled_staff';

export type NoteStatus =
  | 'pending'
  | 'documented'
  | 'late_note'
  | 'missing'
  | 'needs_correction'
  | 'supervisor_review'
  | 'qa_approved';

export type AuthStatus =
  | 'active'
  | 'pending_submission'
  | 'pending_determination'
  | 'approved'
  | 'denied'
  | 'pended'
  | 'expired'
  | 'concurrent_review_due';

export type LevelOfCare = 'IOP' | 'PHP' | 'OP' | 'TBS' | 'Bridge';

export interface ClientFlag {
  type:
    | 'no_counselor'
    | 'no_cm'
    | 'no_peer'
    | 'pa_threshold'
    | 'attendance_risk'
    | 'tx_plan_due'
    | 'missing_doc'
    | 'service_gap'
    | 'high_risk'
    | 'pa_expiring';
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface Client {
  id: string;
  displayName: string;
  laneId: LaneId;
  status: ClientStatus;
  diagnosisCode: string;
  diagnosisDisplay: string;
  asamLevel: string;
  levelOfCare: LevelOfCare;
  riskLevel: RiskLevel;
  enrollmentDate: string;
  assignedCounselorId: string | null;
  assignedCaseManagerId: string | null;
  assignedPeerWorkerId: string | null;
  h0005Eligible: boolean;
  transportationNeeds: boolean;
  telehealthReady: boolean;
  treatmentPlanStatus: 'current' | 'due_soon' | 'overdue' | 'missing';
  treatmentPlanDueDate: string;
  attendanceRate: number;
  lastServiceDate: string;
  flags: ClientFlag[];
  paExpiresDate?: string;
  paUnitsUsed?: number;
  paUnitsAuthorized?: number;
}

export interface WeeklyHours {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  credential: string;
  allowedServiceTypes: ServiceType[];
  laneId: LaneId | 'all';
  supervisorId: string | null;
  billableHoursTarget: number;
  scheduledBillableHours: number;
  completedBillableHours: number;
  documentedBillableHours: number;
  hourlyRate: number;
  weeklyAvailability: WeeklyHours;
  clientCount: number;
  lateNotesCount: number;
  missingNotesCount: number;
  status: 'active' | 'inactive' | 'leave';
}

export interface Lane {
  id: LaneId;
  name: string;
  groupDays: string[];
  groupStartTime: string;
  groupEndTime: string;
  groupHoursPerDay: number;
  capacity: number;
  leadCounselorId: string;
  coLeadId: string;
  caseManagerIds: string[];
  peerWorkerIds: string[];
  requiresH0005: boolean;
  requiresTelehealth: boolean;
}

export interface ScheduledService {
  id: string;
  clientId: string;
  staffId: string;
  laneId: LaneId;
  serviceType: ServiceType;
  serviceCode: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  billable: boolean;
  telehealth: boolean;
  status: ServiceStatus;
  noteStatus: NoteStatus;
  paRequired: boolean;
  treatmentPlanObjective?: string;
}

export interface Authorization {
  id: string;
  clientId: string;
  clientName: string;
  payer: string;
  mco: string;
  serviceCode: string;
  serviceDisplay: string;
  authStatus: AuthStatus;
  unitsAuthorized: number;
  unitsUsed: number;
  thresholdWarningPct: number;
  startDate: string;
  endDate: string;
  paSubmittedDate?: string;
  determinationDueDate?: string;
  concurrentReviewDate?: string;
  ownerId: string;
  ownerName: string;
  laneId: LaneId;
  notes: string;
  denialCount: number;
  appealCount: number;
}

export interface BillingRate {
  serviceCode: string;
  serviceDisplay: string;
  ratePerUnit: number;
  unitDurationMinutes: number;
  unitLabel: string;
}

export interface ServiceRevenue {
  serviceType: ServiceType;
  serviceCode: string;
  serviceDisplay: string;
  units: number;
  grossRevenue: number;
}

export interface LaneRevenue {
  laneId: LaneId;
  laneName: string;
  grossRevenue: number;
  keptRevenue: number;
  payrollCost: number;
  contributionMargin: number;
  breakdown: ServiceRevenue[];
}

export interface SystemAlert {
  id: string;
  type:
    | 'service_gap'
    | 'staffing'
    | 'documentation'
    | 'authorization'
    | 'capacity'
    | 'productivity'
    | 'compliance';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  entityType: 'client' | 'staff' | 'lane' | 'system';
  entityId?: string;
  entityName?: string;
  createdAt: string;
  resolved: boolean;
}

export type Screen =
  | 'dashboard'
  | 'lanes'
  | 'clients'
  | 'staff'
  | 'schedule'
  | 'calendar'
  | 'gaps'
  | 'revenue'
  | 'pa_um'
  | 'qa';

export interface CommandCenterState {
  currentScreen: Screen;
  selectedLane: LaneId | 'all';
  selectedClientId: string | null;
  selectedStaffId: string | null;
  selectedWeek: string;
  clients: Client[];
  staff: StaffMember[];
  lanes: Lane[];
  services: ScheduledService[];
  authorizations: Authorization[];
  billingRates: BillingRate[];
  alerts: SystemAlert[];
}

export interface CommandCenterMetrics {
  totalActiveCensus: number;
  censusPerLane: Record<LaneId, number>;
  openSlotsPerLane: Record<LaneId, number>;
  staffBelowTarget: number;
  staffAtOrAboveTarget: number;
  servicesScheduledThisWeek: number;
  servicesCompletedThisWeek: number;
  serviceCompletionRate: number;
  noShowRate: number;
  lateNotes: number;
  missingNotes: number;
  clientsMissingCounselor: number;
  clientsMissingCM: number;
  clientsMissingPeer: number;
  clientsMissingTxPlan: number;
  paAlerts: number;
  weeklyGrossRevenue: number;
  weeklyKeptRevenue: number;
  weeklyPayrollCost: number;
  weeklyContributionMargin: number;
  highRiskClients: number;
}
