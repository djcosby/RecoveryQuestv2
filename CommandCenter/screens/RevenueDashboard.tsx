import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useCommandCenter } from '../CommandCenterContext';
import { LaneId, ServiceType } from '../types';

const LANE_LABELS: Record<LaneId, string> = {
  lane1: 'Lane 1 — IOP (On-Site)',
  lane2: 'Lane 2 — IOP (On-Site)',
  virtual: 'Virtual Lane — IOP',
};

const SERVICE_LABELS: Record<ServiceType, string> = {
  iop_group: 'IOP Group (H0015)',
  individual_counseling: 'Individual Therapy (90837)',
  case_management: 'Case Management (T1016)',
  peer_support: 'Peer Support (H0038)',
  h0005_group: 'Group Services (H0005)',
  treatment_team: 'Treatment Team',
  assessment: 'Assessment',
  supervision: 'Supervision',
  admin: 'Admin',
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function MetricBox({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <p className="text-slate-400 text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${positive === false ? 'text-red-400' : positive === true ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 bg-slate-700 rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
    </div>
  );
}

export function RevenueDashboard() {
  const { state, metrics } = useCommandCenter();
  const [keptRate, setKeptRate] = useState(78);

  const adjustedKept = metrics.weeklyGrossRevenue * (keptRate / 100);
  const adjustedMargin = adjustedKept - metrics.weeklyPayrollCost;
  const marginPct = Math.round((adjustedMargin / adjustedKept) * 100);

  // Calculate per-lane revenue
  const laneRevenues: Record<LaneId, { gross: number; payroll: number }> = {
    lane1: { gross: 0, payroll: 0 },
    lane2: { gross: 0, payroll: 0 },
    virtual: { gross: 0, payroll: 0 },
  };

  const completedServices = state.services.filter((s) => s.status === 'completed' && s.billable);

  completedServices.forEach((s) => {
    const rate = state.billingRates.find((r) => r.serviceCode === s.serviceCode);
    if (!rate) return;
    const units = s.durationMinutes / rate.unitDurationMinutes;
    const rev = units * rate.ratePerUnit;
    if (s.laneId in laneRevenues) {
      laneRevenues[s.laneId].gross += rev;
    }
  });

  state.staff.forEach((s) => {
    const laneKey = s.laneId === 'all' ? null : s.laneId as LaneId;
    const cost = s.scheduledBillableHours * s.hourlyRate;
    if (laneKey && laneKey in laneRevenues) {
      laneRevenues[laneKey].payroll += cost;
    } else if (s.laneId === 'all') {
      const share = cost / 3;
      laneRevenues.lane1.payroll += share;
      laneRevenues.lane2.payroll += share;
      laneRevenues.virtual.payroll += share;
    }
  });

  // Service-type breakdown
  const serviceRevMap: Record<string, { units: number; gross: number }> = {};
  completedServices.forEach((s) => {
    const rate = state.billingRates.find((r) => r.serviceCode === s.serviceCode);
    if (!rate) return;
    const units = s.durationMinutes / rate.unitDurationMinutes;
    const rev = units * rate.ratePerUnit;
    const key = s.serviceType;
    if (!serviceRevMap[key]) serviceRevMap[key] = { units: 0, gross: 0 };
    serviceRevMap[key].units += units;
    serviceRevMap[key].gross += rev;
  });

  // Staff revenue contribution
  const staffRevenue = state.staff
    .filter((s) => s.billableHoursTarget > 0)
    .map((s) => {
      const staffServices = completedServices.filter((svc) => svc.staffId === s.id);
      let gross = 0;
      staffServices.forEach((svc) => {
        const rate = state.billingRates.find((r) => r.serviceCode === svc.serviceCode);
        if (rate) gross += (svc.durationMinutes / rate.unitDurationMinutes) * rate.ratePerUnit;
      });
      return { ...s, gross, cost: s.scheduledBillableHours * s.hourlyRate, margin: gross * (keptRate / 100) - s.scheduledBillableHours * s.hourlyRate };
    })
    .sort((a, b) => b.gross - a.gross);

  return (
    <div className="p-6 h-full overflow-y-auto space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Revenue Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Week of June 9–13, 2026 · All figures are estimates based on scheduled services</p>
      </div>

      {/* Kept Rate Slider */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 text-sm font-medium">Kept Rate Assumption</span>
          <span className="text-white font-bold text-lg">{keptRate}%</span>
        </div>
        <input
          type="range" min={50} max={100} value={keptRate}
          onChange={(e) => setKeptRate(Number(e.target.value))}
          className="w-full accent-teal-500"
        />
        <div className="flex justify-between text-slate-500 text-xs mt-1">
          <span>50% (conservative)</span>
          <span>78% (baseline)</span>
          <span>100% (theoretical max)</span>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricBox label="Weekly Gross Revenue" value={fmt(metrics.weeklyGrossRevenue)} sub="Before adjustments" />
        <MetricBox label={`Kept Revenue (${keptRate}%)`} value={fmt(adjustedKept)} sub="After no-shows, denials, billing adj." positive />
        <MetricBox label="Weekly Payroll Cost" value={fmt(metrics.weeklyPayrollCost)} sub="All staff · direct + admin" />
        <MetricBox
          label="Contribution Margin"
          value={fmt(adjustedMargin)}
          sub={`${marginPct}% of kept revenue`}
          positive={adjustedMargin > 0}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricBox label="Monthly Gross (est.)" value={fmt(metrics.weeklyGrossRevenue * 4.33)} sub="4.33 weeks avg" />
        <MetricBox label="Monthly Kept (est.)" value={fmt(adjustedKept * 4.33)} positive />
        <MetricBox label="Monthly Payroll (est.)" value={fmt(metrics.weeklyPayrollCost * 4.33)} />
        <MetricBox label="Monthly Margin (est.)" value={fmt(adjustedMargin * 4.33)} positive={adjustedMargin > 0} />
      </div>

      {/* Per-Lane Revenue */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-3">Revenue by Lane</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(Object.entries(laneRevenues) as [LaneId, { gross: number; payroll: number }][]).map(([laneId, rev]) => {
            const kept = rev.gross * (keptRate / 100);
            const margin = kept - rev.payroll;
            const marginPctLane = kept > 0 ? Math.round((margin / kept) * 100) : 0;
            const census = state.clients.filter((c) => c.laneId === laneId && c.status === 'active').length;
            return (
              <div key={laneId} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-sm">{LANE_LABELS[laneId]}</h3>
                    <p className="text-slate-400 text-xs">{census} active clients</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${marginPctLane > 20 ? 'bg-emerald-500/20 text-emerald-300' : marginPctLane > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                    {marginPctLane}% margin
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Gross Revenue</span><span className="text-white font-medium">{fmt(rev.gross)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Kept ({keptRate}%)</span><span className="text-teal-400 font-medium">{fmt(kept)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Payroll Cost</span><span className="text-slate-300">{fmt(rev.payroll)}</span></div>
                  <div className="flex justify-between border-t border-slate-700 pt-1.5 mt-1.5">
                    <span className="text-slate-300 font-semibold">Contribution Margin</span>
                    <span className={`font-bold ${margin > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(margin)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue by Service Type */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-3">Revenue by Service Type</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 text-left">Service</th>
                <th className="px-4 py-2 text-right">Units</th>
                <th className="px-4 py-2 text-right">Gross Revenue</th>
                <th className="px-4 py-2 text-right">Kept Revenue</th>
                <th className="px-4 py-2 text-left pl-4">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(serviceRevMap)
                .sort((a, b) => b[1].gross - a[1].gross)
                .map(([svcType, data]) => {
                  const pct = metrics.weeklyGrossRevenue > 0 ? Math.round((data.gross / metrics.weeklyGrossRevenue) * 100) : 0;
                  return (
                    <tr key={svcType} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                      <td className="px-4 py-2.5 text-slate-300">{SERVICE_LABELS[svcType as ServiceType] ?? svcType}</td>
                      <td className="px-4 py-2.5 text-right text-slate-400">{Math.round(data.units).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-white font-medium">{fmt(data.gross)}</td>
                      <td className="px-4 py-2.5 text-right text-teal-400">{fmt(data.gross * keptRate / 100)}</td>
                      <td className="px-4 py-2.5 pl-4">
                        <div className="flex items-center gap-2">
                          <ProgressBar pct={pct} color="bg-teal-500" />
                          <span className="text-slate-400 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Staff */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-3">Revenue Contribution by Staff</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 text-left">Staff</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-right">Sched. Hours</th>
                <th className="px-4 py-2 text-right">Gross Revenue</th>
                <th className="px-4 py-2 text-right">Payroll Cost</th>
                <th className="px-4 py-2 text-right">Est. Margin</th>
              </tr>
            </thead>
            <tbody>
              {staffRevenue.slice(0, 12).map((s) => (
                <tr key={s.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-2.5 text-slate-200">{s.name}</td>
                  <td className="px-4 py-2.5 text-slate-400 capitalize">{s.role.replace('_', ' ')}</td>
                  <td className="px-4 py-2.5 text-right text-slate-300">{s.scheduledBillableHours}h</td>
                  <td className="px-4 py-2.5 text-right text-white font-medium">{fmt(s.gross)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-400">{fmt(s.cost)}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${s.margin > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmt(s.margin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3">
        <p className="text-slate-400 text-xs">
          <span className="text-slate-300 font-semibold">Disclaimer:</span> Revenue figures are illustrative estimates using approximate Ohio Medicaid billing rates.
          Actual revenue depends on attendance, note completion, authorization status, payer mix, and billing adjudication. Always verify with your billing team before using for financial decisions.
        </p>
      </div>
    </div>
  );
}
