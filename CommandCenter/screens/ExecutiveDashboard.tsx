import React from 'react';
import {
  Users, AlertTriangle, TrendingUp, FileText, Shield,
  Activity, Clock, DollarSign, CheckCircle, XCircle,
  ChevronRight, Zap, Bell,
} from 'lucide-react';
import { useCommandCenter } from '../CommandCenterContext';

function StatCard({
  label, value, sub, color, icon: Icon, onClick,
}: {
  label: string; value: string | number; sub?: string;
  color: string; icon: React.ElementType; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start gap-3 ${onClick ? 'cursor-pointer hover:border-slate-500 transition-colors' : ''}`}
    >
      <div className={`rounded-lg p-2 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-white text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function AlertItem({ severity, message }: { severity: string; message: string }) {
  const colors = {
    critical: 'bg-red-500/10 border-red-500/30 text-red-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  };
  const icons = {
    critical: <XCircle size={14} className="text-red-400 shrink-0" />,
    warning: <AlertTriangle size={14} className="text-amber-400 shrink-0" />,
    info: <Bell size={14} className="text-blue-400 shrink-0" />,
  };
  const c = colors[severity as keyof typeof colors] ?? colors.info;
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${c}`}>
      {icons[severity as keyof typeof icons]}
      <span>{message}</span>
    </div>
  );
}

function LaneMiniCard({ laneId, name, census, capacity, staffGaps }: {
  laneId: string; name: string; census: number; capacity: number; staffGaps: number;
}) {
  const pct = Math.round((census / capacity) * 100);
  const barColor = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
      <p className="text-white text-sm font-semibold truncate">{name}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-slate-300 text-xs font-mono">{census}/{capacity}</span>
      </div>
      {staffGaps > 0 && (
        <p className="text-amber-400 text-xs mt-1.5 flex items-center gap-1">
          <AlertTriangle size={11} /> {staffGaps} assignment gap{staffGaps > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

function StaffProductivityRow({ staff }: { staff: import('../../CommandCenter/types').StaffMember }) {
  if (staff.billableHoursTarget === 0) return null;
  const pct = Math.round((staff.scheduledBillableHours / staff.billableHoursTarget) * 100);
  const barColor = pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-red-500';
  const roleLabel: Record<string, string> = {
    lead_counselor: 'Lead', co_lead: 'Co-Lead', individual_counselor: 'Indiv',
    case_manager: 'CM', peer_specialist: 'Peer', virtual_contractor: 'VCon',
    supervisor: 'Supv', qa_coordinator: 'QA', pa_ur: 'PA/UR',
  };
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-slate-700/50">
      <span className="text-slate-400 text-xs w-12 shrink-0">{roleLabel[staff.role] ?? staff.role}</span>
      <span className="text-slate-200 text-xs flex-1 truncate">{staff.name}</span>
      <div className="w-20 bg-slate-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-mono w-16 text-right ${pct < 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
        {staff.scheduledBillableHours}/{staff.billableHoursTarget}h
      </span>
      {(staff.lateNotesCount + staff.missingNotesCount > 0) && (
        <span className="text-red-400 text-xs w-8 text-right">{staff.lateNotesCount + staff.missingNotesCount}⚑</span>
      )}
    </div>
  );
}

export function ExecutiveDashboard() {
  const { state, metrics, setScreen } = useCommandCenter();
  const unresolvedAlerts = state.alerts.filter((a) => !a.resolved);
  const criticalAlerts = unresolvedAlerts.filter((a) => a.severity === 'critical');
  const warningAlerts = unresolvedAlerts.filter((a) => a.severity === 'warning');

  const directServiceStaff = state.staff.filter(
    (s) => s.billableHoursTarget > 0 && ['lead_counselor','co_lead','individual_counselor','case_manager','peer_specialist','virtual_contractor'].includes(s.role)
  );

  const laneGaps: Record<string, number> = { lane1: 0, lane2: 0, virtual: 0 };
  state.clients.forEach((c) => {
    if (!c.assignedCounselorId) laneGaps[c.laneId]++;
    if (!c.assignedCaseManagerId) laneGaps[c.laneId]++;
    if (!c.assignedPeerWorkerId) laneGaps[c.laneId]++;
  });

  const laneNames: Record<string, string> = { lane1: 'Lane 1 — IOP', lane2: 'Lane 2 — IOP', virtual: 'Virtual IOP' };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Command Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Week of June 9–13, 2026 · {new Date().toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          {criticalAlerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle size={12} /> {criticalAlerts.length} Critical
            </span>
          )}
          {warningAlerts.length > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {warningAlerts.length} Warnings
            </span>
          )}
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 space-y-2">
          <p className="text-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Zap size={12} /> Action Required — {criticalAlerts.length} Critical Issue{criticalAlerts.length > 1 ? 's' : ''}
          </p>
          {criticalAlerts.map((a) => (
            <AlertItem key={a.id} severity="critical" message={a.message} />
          ))}
        </div>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Census" value={metrics.totalActiveCensus} sub="72 slots across 3 lanes" color="bg-blue-600" icon={Users} onClick={() => setScreen('lanes')} />
        <StatCard label="Service Completion" value={`${metrics.serviceCompletionRate}%`} sub={`${metrics.servicesCompletedThisWeek} of ${metrics.servicesScheduledThisWeek} services`} color="bg-emerald-600" icon={CheckCircle} />
        <StatCard label="No-Show Rate" value={`${metrics.noShowRate}%`} sub="This week" color={metrics.noShowRate > 20 ? 'bg-red-600' : 'bg-amber-600'} icon={XCircle} />
        <StatCard label="High Risk Clients" value={metrics.highRiskClients} sub="Require daily check-in" color="bg-purple-600" icon={Activity} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Late / Missing Notes" value={metrics.lateNotes} sub={`${metrics.missingNotes} missing`} color={metrics.lateNotes > 10 ? 'bg-red-600' : 'bg-amber-600'} icon={FileText} onClick={() => setScreen('qa')} />
        <StatCard label="PA / Auth Alerts" value={metrics.paAlerts} sub="Require action" color={metrics.paAlerts > 5 ? 'bg-red-600' : 'bg-amber-600'} icon={Shield} onClick={() => setScreen('pa_um')} />
        <StatCard label="Assignment Gaps" value={metrics.clientsMissingCounselor + metrics.clientsMissingCM + metrics.clientsMissingPeer} sub={`${metrics.clientsMissingCounselor} no counselor · ${metrics.clientsMissingCM} no CM`} color="bg-rose-600" icon={AlertTriangle} onClick={() => setScreen('gaps')} />
        <StatCard label="Tx Plans Due/Overdue" value={metrics.clientsMissingTxPlan} sub="Compliance risk" color={metrics.clientsMissingTxPlan > 3 ? 'bg-red-600' : 'bg-amber-600'} icon={Clock} />
      </div>

      {/* Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Weekly Gross Revenue" value={`$${metrics.weeklyGrossRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} sub="Before kept-rate adj." color="bg-teal-600" icon={DollarSign} onClick={() => setScreen('revenue')} />
        <StatCard label="Weekly Kept Revenue" value={`$${metrics.weeklyKeptRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} sub="Est. at 78% kept rate" color="bg-teal-600" icon={TrendingUp} />
        <StatCard label="Weekly Payroll Cost" value={`$${metrics.weeklyPayrollCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} sub="All direct + admin staff" color="bg-slate-600" icon={DollarSign} />
        <StatCard
          label="Contribution Margin"
          value={`$${metrics.weeklyContributionMargin.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          sub="Kept revenue − payroll"
          color={metrics.weeklyContributionMargin > 0 ? 'bg-emerald-700' : 'bg-red-700'}
          icon={TrendingUp}
        />
      </div>

      {/* Lane Census + Staff Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lane Mini-Cards */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-sm font-semibold">Lane Census</h2>
            <button onClick={() => setScreen('lanes')} className="text-blue-400 text-xs flex items-center gap-1 hover:text-blue-300">
              Full Lane Board <ChevronRight size={12} />
            </button>
          </div>
          {state.lanes.map((lane) => (
            <LaneMiniCard
              key={lane.id}
              laneId={lane.id}
              name={laneNames[lane.id] ?? lane.name}
              census={metrics.censusPerLane[lane.id]}
              capacity={lane.capacity}
              staffGaps={laneGaps[lane.id] ?? 0}
            />
          ))}
        </div>

        {/* Staff Productivity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-sm font-semibold">Staff Productivity — Billable Hours vs. 34h Target</h2>
            <button onClick={() => setScreen('staff')} className="text-blue-400 text-xs flex items-center gap-1 hover:text-blue-300">
              All Staff <ChevronRight size={12} />
            </button>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-400 text-xs w-12">Role</span>
              <span className="text-slate-400 text-xs flex-1">Name</span>
              <span className="text-slate-400 text-xs w-20 text-right">Progress</span>
              <span className="text-slate-400 text-xs w-16 text-right">Hrs</span>
              <span className="text-slate-400 text-xs w-8 text-right">Notes</span>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-0.5 scrollbar-hide">
              {directServiceStaff.map((s) => (
                <StaffProductivityRow key={s.id} staff={s} />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 pt-2 border-t border-slate-700">
              <span className="text-emerald-400 text-xs">{metrics.staffAtOrAboveTarget} at/above target</span>
              <span className="text-amber-400 text-xs">{metrics.staffBelowTarget} below target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warningAlerts.length > 0 && (
        <div>
          <h2 className="text-white text-sm font-semibold mb-2">Warnings</h2>
          <div className="space-y-1.5">
            {warningAlerts.map((a) => (
              <AlertItem key={a.id} severity="warning" message={a.message} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
