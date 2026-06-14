import React, { useState } from 'react';
import { Filter, User, Briefcase, Heart, Shield, AlertTriangle } from 'lucide-react';
import { useCommandCenter } from '../CommandCenterContext';
import { LaneId, Client, RiskLevel } from '../types';

const RISK_BADGES: Record<RiskLevel, string> = {
  low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  moderate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  crisis: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const TX_LABELS: Record<string, string> = {
  current: 'Current', due_soon: 'Due Soon', overdue: 'Overdue', missing: 'Missing',
};
const TX_COLORS: Record<string, string> = {
  current: 'text-emerald-400', due_soon: 'text-amber-400', overdue: 'text-red-400', missing: 'text-red-500',
};

const LANE_LABELS: Record<LaneId, string> = { lane1: 'Lane 1', lane2: 'Lane 2', virtual: 'Virtual' };

function ClientDetailPanel({ client, staffMap, onClose }: { client: Client; staffMap: Record<string, string>; onClose: () => void }) {
  const critFlags = client.flags.filter((f) => f.severity === 'critical');
  const warnFlags = client.flags.filter((f) => f.severity === 'warning');
  const paUsedPct = client.paUnitsAuthorized ? Math.round((client.paUnitsUsed! / client.paUnitsAuthorized) * 100) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold">{client.displayName}</h2>
            <p className="text-slate-400 text-xs">{client.id} · {LANE_LABELS[client.laneId]} · {client.levelOfCare}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 border border-slate-700 rounded-lg">Close</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status Row */}
          <div className="flex flex-wrap gap-2">
            <span className={`border rounded px-2 py-0.5 text-xs capitalize ${RISK_BADGES[client.riskLevel]}`}>{client.riskLevel} risk</span>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded px-2 py-0.5 text-xs">{client.asamLevel}</span>
            <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded px-2 py-0.5 text-xs">{client.diagnosisCode}</span>
          </div>

          {/* Diagnosis */}
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Primary Diagnosis</p>
            <p className="text-slate-200 text-sm">{client.diagnosisDisplay}</p>
          </div>

          {/* Clinical Team */}
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Clinical Team</p>
            <div className="space-y-2">
              {[
                { icon: User, label: 'Counselor', id: client.assignedCounselorId, color: 'text-blue-400' },
                { icon: Briefcase, label: 'Case Manager', id: client.assignedCaseManagerId, color: 'text-purple-400' },
                { icon: Heart, label: 'Peer Support', id: client.assignedPeerWorkerId, color: 'text-rose-400' },
              ].map(({ icon: Icon, label, id, color }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <Icon size={14} className={color} />
                  <span className="text-slate-400 w-28 text-xs">{label}</span>
                  {id ? (
                    <span className="text-slate-200 text-xs">{staffMap[id] ?? id}</span>
                  ) : (
                    <span className="text-red-400 text-xs font-semibold">UNASSIGNED</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Service Stats */}
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Service Status</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-slate-500">Attendance Rate</p>
                <p className={`font-bold text-base mt-0.5 ${client.attendanceRate >= 80 ? 'text-emerald-400' : client.attendanceRate >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                  {client.attendanceRate}%
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-slate-500">Treatment Plan</p>
                <p className={`font-bold text-base mt-0.5 ${TX_COLORS[client.treatmentPlanStatus]}`}>
                  {TX_LABELS[client.treatmentPlanStatus]}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-slate-500">H0005 Eligible</p>
                <p className={`font-bold text-base mt-0.5 ${client.h0005Eligible ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {client.h0005Eligible ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-slate-500">Transportation</p>
                <p className={`font-bold text-base mt-0.5 ${client.transportationNeeds ? 'text-amber-400' : 'text-slate-500'}`}>
                  {client.transportationNeeds ? 'Needed' : 'No need'}
                </p>
              </div>
            </div>
          </div>

          {/* PA Status */}
          {paUsedPct !== null && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Authorization Status</p>
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Units Used / Authorized</span>
                  <span className={`font-mono ${paUsedPct >= 90 ? 'text-red-400' : paUsedPct >= 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {client.paUnitsUsed}/{client.paUnitsAuthorized} ({paUsedPct}%)
                  </span>
                </div>
                <div className="bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${paUsedPct >= 90 ? 'bg-red-500' : paUsedPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(paUsedPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>PA expires: {client.paExpiresDate ?? '—'}</span>
                  {paUsedPct >= 90 && <span className="text-red-400 font-semibold">⚠ Concurrent review needed</span>}
                </div>
              </div>
            </div>
          )}

          {/* Flags */}
          {client.flags.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Active Flags</p>
              <div className="space-y-1.5">
                {[...critFlags, ...warnFlags].map((flag, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 rounded-lg px-3 py-2 border text-xs ${
                      flag.severity === 'critical'
                        ? 'bg-red-950/30 border-red-500/30 text-red-300'
                        : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                    {flag.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ClientRoster() {
  const { state } = useCommandCenter();
  const [filterLane, setFilterLane] = useState<LaneId | 'all'>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterFlag, setFilterFlag] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const staffMap = Object.fromEntries(state.staff.map((s) => [s.id, s.name]));

  const filtered = state.clients
    .filter((c) => c.status === 'active')
    .filter((c) => filterLane === 'all' || c.laneId === filterLane)
    .filter((c) => filterRisk === 'all' || c.riskLevel === filterRisk)
    .filter((c) => filterFlag === 'all' || c.flags.some((f) => f.type === filterFlag));

  const sorted = [...filtered].sort((a, b) => {
    const score = (c: Client) => {
      const r = { crisis: 4, high: 3, moderate: 2, low: 1 }[c.riskLevel] ?? 0;
      const critical = c.flags.some((f) => f.severity === 'critical') ? 100 : 0;
      return critical + r * 10;
    };
    return score(b) - score(a);
  });

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-white text-2xl font-bold">Client Roster</h1>
        <p className="text-slate-400 text-sm mt-0.5">{state.clients.filter((c) => c.status === 'active').length} active clients across all lanes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Filter size={14} className="text-slate-400" />
        <select value={filterLane} onChange={(e) => setFilterLane(e.target.value as LaneId | 'all')}
          className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none">
          <option value="all">All Lanes</option>
          <option value="lane1">Lane 1</option>
          <option value="lane2">Lane 2</option>
          <option value="virtual">Virtual</option>
        </select>
        <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none">
          <option value="all">All Risk Levels</option>
          <option value="crisis">Crisis</option>
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
          <option value="low">Low</option>
        </select>
        <select value={filterFlag} onChange={(e) => setFilterFlag(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none">
          <option value="all">Any Status</option>
          <option value="no_counselor">No Counselor</option>
          <option value="no_cm">No Case Manager</option>
          <option value="no_peer">No Peer</option>
          <option value="tx_plan_due">Tx Plan Due</option>
          <option value="pa_threshold">PA Threshold</option>
          <option value="high_risk">High Risk</option>
          <option value="attendance_risk">Attendance Risk</option>
        </select>
        <span className="text-slate-500 text-xs ml-auto">{sorted.length} clients</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-700 bg-slate-800">
        <table className="w-full min-w-[750px] text-xs">
          <thead className="sticky top-0 bg-slate-900 text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Lane</th>
              <th className="px-3 py-2 text-left">Risk</th>
              <th className="px-3 py-2 text-left">Diagnosis</th>
              <th className="px-3 py-2 text-left">Counselor</th>
              <th className="px-3 py-2 text-left">CM</th>
              <th className="px-3 py-2 text-left">Peer</th>
              <th className="px-3 py-2 text-left">Tx Plan</th>
              <th className="px-3 py-2 text-right">Att.</th>
              <th className="px-3 py-2 text-center">Flags</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const critCount = c.flags.filter((f) => f.severity === 'critical').length;
              const warnCount = c.flags.filter((f) => f.severity === 'warning').length;
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedClient(c)}
                  className={`border-t border-slate-700/40 cursor-pointer hover:bg-slate-700/30 transition-colors ${critCount > 0 ? 'bg-red-950/10' : ''}`}
                >
                  <td className="px-3 py-2 font-mono text-slate-300">{c.id}</td>
                  <td className="px-3 py-2 text-slate-400">{LANE_LABELS[c.laneId]}</td>
                  <td className="px-3 py-2">
                    <span className={`border rounded px-1.5 py-0.5 capitalize ${RISK_BADGES[c.riskLevel]}`}>{c.riskLevel}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-400 max-w-[160px] truncate">{c.diagnosisDisplay.split(',')[0]}</td>
                  <td className="px-3 py-2">
                    {c.assignedCounselorId
                      ? <span className="text-slate-300">{staffMap[c.assignedCounselorId]?.split(' ').pop()}</span>
                      : <span className="text-red-400 font-semibold">NONE</span>}
                  </td>
                  <td className="px-3 py-2">
                    {c.assignedCaseManagerId
                      ? <span className="text-slate-300">{staffMap[c.assignedCaseManagerId]?.split(' ').pop()}</span>
                      : <span className="text-red-400 font-semibold">NONE</span>}
                  </td>
                  <td className="px-3 py-2">
                    {c.assignedPeerWorkerId
                      ? <span className="text-slate-300">{staffMap[c.assignedPeerWorkerId]?.split(' ').pop()}</span>
                      : <span className="text-amber-400 font-semibold">NONE</span>}
                  </td>
                  <td className={`px-3 py-2 ${TX_COLORS[c.treatmentPlanStatus]}`}>{TX_LABELS[c.treatmentPlanStatus]}</td>
                  <td className={`px-3 py-2 text-right ${c.attendanceRate < 60 ? 'text-red-400' : c.attendanceRate < 80 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {c.attendanceRate}%
                  </td>
                  <td className="px-3 py-2 text-center">
                    {critCount + warnCount === 0 ? (
                      <span className="text-slate-600">—</span>
                    ) : (
                      <span className={`font-semibold ${critCount > 0 ? 'text-red-400' : 'text-amber-400'}`}>
                        {critCount + warnCount}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          staffMap={staffMap}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
