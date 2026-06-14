import React, { useState } from 'react';
import { AlertTriangle, Filter } from 'lucide-react';
import { useCommandCenter } from '../CommandCenterContext';
import { LaneId, Client } from '../types';

const LANE_LABELS: Record<LaneId, string> = {
  lane1: 'Lane 1', lane2: 'Lane 2', virtual: 'Virtual',
};

const GAP_TYPES = [
  { key: 'no_counselor', label: 'Missing Counselor', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
  { key: 'no_cm', label: 'Missing Case Manager', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
  { key: 'no_peer', label: 'Missing Peer', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30' },
  { key: 'tx_plan_due', label: 'Tx Plan Due/Overdue', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30' },
  { key: 'attendance_risk', label: 'Low Attendance', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/30' },
  { key: 'pa_threshold', label: 'PA at Threshold', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/30' },
  { key: 'pa_expiring', label: 'PA Expiring', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/30' },
  { key: 'high_risk', label: 'High Risk', color: 'text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/30' },
];

function GapSummaryCard({ count, label, color, bgColor }: { count: number; label: string; color: string; bgColor: string }) {
  return (
    <div className={`border rounded-lg p-3 ${bgColor}`}>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function ClientGapRow({ client, staffMap }: { client: Client; staffMap: Record<string, string> }) {
  const criticalFlags = client.flags.filter((f) => f.severity === 'critical');
  return (
    <tr className={`border-b border-slate-700/40 text-xs ${criticalFlags.length > 0 ? 'bg-red-950/10' : 'hover:bg-slate-700/20'}`}>
      <td className="px-3 py-2 font-mono text-slate-300">{client.id}</td>
      <td className="px-3 py-2 text-slate-400">{LANE_LABELS[client.laneId]}</td>
      <td className="px-3 py-2">
        <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
          client.riskLevel === 'crisis' ? 'bg-red-500' :
          client.riskLevel === 'high' ? 'bg-orange-500' :
          client.riskLevel === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
        }`} />
        <span className="text-slate-300 capitalize">{client.riskLevel}</span>
      </td>
      <td className="px-3 py-2 text-slate-300">{staffMap[client.assignedCounselorId ?? ''] ?? <span className="text-red-400 font-semibold">UNASSIGNED</span>}</td>
      <td className="px-3 py-2 text-slate-300">{staffMap[client.assignedCaseManagerId ?? ''] ?? <span className="text-red-400 font-semibold">UNASSIGNED</span>}</td>
      <td className="px-3 py-2 text-slate-300">{staffMap[client.assignedPeerWorkerId ?? ''] ?? <span className="text-amber-400 font-semibold">UNASSIGNED</span>}</td>
      <td className="px-3 py-2">
        <span className={`text-xs ${
          client.treatmentPlanStatus === 'current' ? 'text-emerald-400' :
          client.treatmentPlanStatus === 'due_soon' ? 'text-amber-400' : 'text-red-400'
        }`}>
          {client.treatmentPlanStatus.replace('_', ' ')}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {client.flags.map((flag, i) => (
            <span
              key={i}
              className={`inline-block px-1.5 py-0.5 rounded text-xs border ${
                flag.severity === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {flag.type.replace('_', ' ')}
            </span>
          ))}
        </div>
      </td>
    </tr>
  );
}

export function ServiceGapReport() {
  const { state } = useCommandCenter();
  const [filterLane, setFilterLane] = useState<LaneId | 'all'>('all');
  const [filterGap, setFilterGap] = useState<string>('all');

  const staffMap = Object.fromEntries(state.staff.map((s) => [s.id, s.name]));
  const activeClients = state.clients.filter((c) => c.status === 'active');

  const gapCounts = Object.fromEntries(
    GAP_TYPES.map(({ key }) => [
      key,
      activeClients.filter((c) => c.flags.some((f) => f.type === key)).length,
    ]),
  );

  const filteredClients = activeClients.filter((c) => {
    if (filterLane !== 'all' && c.laneId !== filterLane) return false;
    if (filterGap !== 'all' && !c.flags.some((f) => f.type === filterGap)) return false;
    if (filterGap === 'all' && c.flags.length === 0) return false;
    return true;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    const severityScore = (c: Client) => {
      const hasCritical = c.flags.some((f) => f.severity === 'critical');
      const riskScore = { crisis: 4, high: 3, moderate: 2, low: 1 }[c.riskLevel] ?? 0;
      return (hasCritical ? 100 : 0) + riskScore * 10 + c.flags.length;
    };
    return severityScore(b) - severityScore(a);
  });

  const totalGapClients = activeClients.filter((c) => c.flags.length > 0).length;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Service Gap Report</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {totalGapClients} of {activeClients.length} active clients have one or more gaps · Week of June 9–13, 2026
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
        {GAP_TYPES.map(({ key, label, color, bgColor }) => (
          <GapSummaryCard
            key={key}
            count={gapCounts[key] ?? 0}
            label={label}
            color={color}
            bgColor={bgColor}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={14} className="text-slate-400" />
        <select
          value={filterLane}
          onChange={(e) => setFilterLane(e.target.value as LaneId | 'all')}
          className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Lanes</option>
          <option value="lane1">Lane 1</option>
          <option value="lane2">Lane 2</option>
          <option value="virtual">Virtual</option>
        </select>
        <select
          value={filterGap}
          onChange={(e) => setFilterGap(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Any Gap</option>
          {GAP_TYPES.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <span className="text-slate-500 text-xs">{sortedClients.length} clients shown</span>
      </div>

      {/* Gap Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-700 bg-slate-800">
        <table className="w-full min-w-[700px]">
          <thead className="sticky top-0 bg-slate-900 text-xs text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left">Client ID</th>
              <th className="px-3 py-2 text-left">Lane</th>
              <th className="px-3 py-2 text-left">Risk</th>
              <th className="px-3 py-2 text-left">Counselor</th>
              <th className="px-3 py-2 text-left">Case Mgr</th>
              <th className="px-3 py-2 text-left">Peer</th>
              <th className="px-3 py-2 text-left">Tx Plan</th>
              <th className="px-3 py-2 text-left">Active Gaps</th>
            </tr>
          </thead>
          <tbody>
            {sortedClients.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-slate-500 py-12 text-sm">
                  No gaps found for selected filters.
                </td>
              </tr>
            ) : (
              sortedClients.map((c) => (
                <ClientGapRow key={c.id} client={c} staffMap={staffMap} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Critical Action Note */}
      <div className="mt-3 bg-red-950/30 border border-red-500/30 rounded-lg px-4 py-3 flex items-start gap-2">
        <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
        <p className="text-red-300 text-xs">
          Clients with critical gaps (missing counselor or CM) are a compliance and billing risk. All gaps require
          an owner and a resolution date before the next billing cycle.
        </p>
      </div>
    </div>
  );
}
