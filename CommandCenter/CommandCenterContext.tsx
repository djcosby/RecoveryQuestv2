import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  CommandCenterState, CommandCenterMetrics, Screen, LaneId, Client,
} from './types';
import {
  MOCK_CLIENTS, MOCK_STAFF, MOCK_LANES, MOCK_SERVICES,
  MOCK_AUTHORIZATIONS, MOCK_ALERTS, BILLING_RATES,
} from './mockData';

interface CommandCenterContextValue {
  state: CommandCenterState;
  metrics: CommandCenterMetrics;
  setScreen: (s: Screen) => void;
  setSelectedLane: (l: LaneId | 'all') => void;
  setSelectedClient: (id: string | null) => void;
  setSelectedStaff: (id: string | null) => void;
  getClientsForLane: (laneId: LaneId) => Client[];
  resolveAlert: (alertId: string) => void;
}

const CommandCenterContext = createContext<CommandCenterContextValue | null>(null);

export function CommandCenterProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedLane, setSelectedLane] = useState<LaneId | 'all'>('all');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  const state: CommandCenterState = {
    currentScreen,
    selectedLane,
    selectedClientId,
    selectedStaffId,
    selectedWeek: '2026-06-09',
    clients: MOCK_CLIENTS,
    staff: MOCK_STAFF,
    lanes: MOCK_LANES,
    services: MOCK_SERVICES,
    authorizations: MOCK_AUTHORIZATIONS,
    billingRates: BILLING_RATES,
    alerts,
  };

  const metrics = useMemo<CommandCenterMetrics>(() => {
    const activeClients = MOCK_CLIENTS.filter((c) => c.status === 'active');

    const censusPerLane = { lane1: 0, lane2: 0, virtual: 0 };
    const openSlotsPerLane = { lane1: 24, lane2: 24, virtual: 24 };
    activeClients.forEach((c) => {
      censusPerLane[c.laneId]++;
      openSlotsPerLane[c.laneId]--;
    });

    const staffBelowTarget = MOCK_STAFF.filter(
      (s) => s.billableHoursTarget > 0 && s.scheduledBillableHours < s.billableHoursTarget,
    ).length;
    const staffAtOrAboveTarget = MOCK_STAFF.filter(
      (s) => s.billableHoursTarget > 0 && s.scheduledBillableHours >= s.billableHoursTarget,
    ).length;

    const billableServices = MOCK_SERVICES.filter((s) => s.billable);
    const completedServices = MOCK_SERVICES.filter((s) => s.status === 'completed');
    const noShowServices = MOCK_SERVICES.filter((s) => s.status === 'no_show');

    const lateNotes = MOCK_SERVICES.filter((s) => s.noteStatus === 'late_note' || s.noteStatus === 'missing').length;
    const missingNotes = MOCK_SERVICES.filter((s) => s.noteStatus === 'missing').length;

    const clientsMissingCounselor = activeClients.filter((c) => !c.assignedCounselorId).length;
    const clientsMissingCM = activeClients.filter((c) => !c.assignedCaseManagerId).length;
    const clientsMissingPeer = activeClients.filter((c) => !c.assignedPeerWorkerId).length;
    const clientsMissingTxPlan = activeClients.filter(
      (c) => c.treatmentPlanStatus === 'overdue' || c.treatmentPlanStatus === 'missing',
    ).length;

    const paAlerts = MOCK_AUTHORIZATIONS.filter(
      (a) => a.authStatus === 'concurrent_review_due' || a.authStatus === 'pending_determination' || a.authStatus === 'pended' || a.authStatus === 'expired',
    ).length;

    // Revenue calc — weekly
    // IOP Group H0015: per 15-min unit per client = $8/unit
    // 3 lanes × 24 clients × 3 days × 12 units (3hr × 4 units/hr) = 2592 units × $8 = $20,736 gross IOP
    const iopGroupSessions = completedServices.filter((s) => s.serviceType === 'iop_group');
    const iopRevenue = iopGroupSessions.length * (180 / 15) * 8.00;

    const indivSessions = completedServices.filter((s) => s.serviceType === 'individual_counseling');
    const indivRevenue = indivSessions.length * 148.00;

    const cmSessions = completedServices.filter((s) => s.serviceType === 'case_management');
    const cmRevenue = cmSessions.length * (60 / 15) * 15.00;

    const peerSessions = completedServices.filter((s) => s.serviceType === 'peer_support');
    const peerRevenue = peerSessions.length * (60 / 15) * 5.50;

    const weeklyGrossRevenue = iopRevenue + indivRevenue + cmRevenue + peerRevenue;
    const keptRatePct = 0.78;
    const weeklyKeptRevenue = weeklyGrossRevenue * keptRatePct;

    const weeklyPayrollCost = MOCK_STAFF.reduce((sum, s) => {
      const hoursWorked = Math.min(s.scheduledBillableHours, 40);
      return sum + hoursWorked * s.hourlyRate;
    }, 0);

    const weeklyContributionMargin = weeklyKeptRevenue - weeklyPayrollCost;
    const highRiskClients = activeClients.filter((c) => c.riskLevel === 'high' || c.riskLevel === 'crisis').length;

    return {
      totalActiveCensus: activeClients.length,
      censusPerLane,
      openSlotsPerLane,
      staffBelowTarget,
      staffAtOrAboveTarget,
      servicesScheduledThisWeek: billableServices.length,
      servicesCompletedThisWeek: completedServices.length,
      serviceCompletionRate: Math.round((completedServices.length / Math.max(billableServices.length, 1)) * 100),
      noShowRate: Math.round((noShowServices.length / Math.max(MOCK_SERVICES.length, 1)) * 100),
      lateNotes,
      missingNotes,
      clientsMissingCounselor,
      clientsMissingCM,
      clientsMissingPeer,
      clientsMissingTxPlan,
      paAlerts,
      weeklyGrossRevenue,
      weeklyKeptRevenue,
      weeklyPayrollCost,
      weeklyContributionMargin,
      highRiskClients,
    };
  }, []);

  const setScreen = useCallback((s: Screen) => setCurrentScreen(s), []);
  const setSelectedLaneCallback = useCallback((l: LaneId | 'all') => setSelectedLane(l), []);
  const setSelectedClient = useCallback((id: string | null) => setSelectedClientId(id), []);
  const setSelectedStaff = useCallback((id: string | null) => setSelectedStaffId(id), []);

  const getClientsForLane = useCallback(
    (laneId: LaneId) => MOCK_CLIENTS.filter((c) => c.laneId === laneId && c.status === 'active'),
    [],
  );

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)));
  }, []);

  return (
    <CommandCenterContext.Provider value={{
      state, metrics, setScreen,
      setSelectedLane: setSelectedLaneCallback,
      setSelectedClient, setSelectedStaff,
      getClientsForLane, resolveAlert,
    }}>
      {children}
    </CommandCenterContext.Provider>
  );
}

export function useCommandCenter() {
  const ctx = useContext(CommandCenterContext);
  if (!ctx) throw new Error('useCommandCenter must be used inside CommandCenterProvider');
  return ctx;
}
