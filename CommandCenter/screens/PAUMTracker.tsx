import React, { useState } from 'react';
import { Shield, AlertTriangle, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useCommandCenter } from '../CommandCenterContext';
import { Authorization, LaneId } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle },
  approved: { label: 'Approved', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle },
  concurrent_review_due: { label: 'Review Due', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Clock },
  pending_determination: { label: 'Pending Det.', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: Clock },
  pending_submission: { label: 'Pending Sub.', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40', icon: Clock },
  pended: { label: 'Pended', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40', icon: AlertTriangle },
  denied: { label: 'Denied', color: 'bg-red-500/20 text-red-300 border-red-500/40', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-red-700/20 text-red-400 border-red-700/40', icon: XCircle },
};

const LANE_LABELS: Record<LaneId, string> = {
  lane1: 'Lane 1', lane2: 'Lane 2', virtual: 'Virtual',
};

function ThresholdBar({ used, authorized }: { used: number; authorized: number }) {
  const pct = Math.min((used / authorized) * 100, 100);
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono w-14 text-right ${pct >= 90 ? 'text-red-400' : pct >= 75 ? 'text-amber-400' : 'text-slate-400'}`}>
        {used}/{authorized}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded text-xs ${cfg.color}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function AuthRow({ auth }: { auth: Authorization }) {
  const pct = (auth.unitsUsed / auth.unitsAuthorized) * 100;
  const urgent = auth.authStatus === 'denied' || auth.authStatus === 'expired' || (auth.authStatus === 'concurrent_review_due' && pct >= 90);
  return (
    <tr className={`border-b border-slate-700/40 text-xs hover:bg-slate-700/20 ${urgent ? 'bg-red-950/10' : ''}`}>
      <td className="px-3 py-2 font-mono text-slate-300">{auth.clientId}</td>
      <td className="px-3 py-2 text-slate-400">{LANE_LABELS[auth.laneId]}</td>
      <td className="px-3 py-2 text-slate-400">{auth.mco}</td>
      <td className="px-3 py-2 text-slate-300 font-mono">{auth.serviceCode}</td>
      <td className="px-3 py-2">
        <StatusBadge status={auth.authStatus} />
      </td>
      <td className="px-3 py-2 min-w-[120px]">
        <ThresholdBar used={auth.unitsUsed} authorized={auth.unitsAuthorized} />
      </td>
      <td className="px-3 py-2 text-slate-400">{auth.startDate}</td>
      <td className="px-3 py-2 text-slate-400">{auth.endDate}</td>
      <td className="px-3 py-2 text-slate-400">{auth.concurrentReviewDate ?? auth.determinationDueDate ?? '—'}</td>
      <td className="px-3 py-2 text-slate-400">{auth.ownerName.split(' ').pop()}</td>
      {auth.denialCount > 0 ? (
        <td className="px-3 py-2 text-red-400 font-semibold">{auth.denialCount} denial{auth.denialCount > 1 ? 's' : ''}</td>
      ) : (
        <td className="px-3 py-2 text-slate-600">—</td>
      )}
    </tr>
  );
}

export function PAUMTracker() {
  const { state } = useCommandCenter();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLane, setFilterLane] = useState<LaneId | 'all'>('all');

  const filtered = state.authorizations.filter((a) => {
    if (filterLane !== 'all' && a.laneId !== filterLane) return false;
    if (filterStatus === 'needs_action') {
      return ['concurrent_review_due', 'pending_determination', 'pended', 'denied', 'expired'].includes(a.authStatus);
    }
    if (filterStatus !== 'all' && a.authStatus !== filterStatus) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const urgency = (auth: Authorization) => {
      if (auth.authStatus === 'denied' || auth.authStatus === 'expired') return 100;
      if (auth.authStatus === 'concurrent_review_due') return 80;
      if (auth.authStatus === 'pending_determination') return 60;
      if (auth.authStatus === 'pended') return 50;
      return 0;
    };
    return urgency(b) - urgency(a);
  });

  const statusCounts = state.authorizations.reduce<Record<string, number>>((acc, a) => {
    acc[a.authStatus] = (acc[a.authStatus] ?? 0) + 1;
    return acc;
  }, {});

  const atThreshold = state.authorizations.filter((a) => (a.unitsUsed / a.unitsAuthorized) >= 0.9).length;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-white text-2xl font-bold">PA / Utilization Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">Authorization tracking for all active clients · {state.authorizations.length} total auths</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {[
          { key: 'active', label: 'Active', icon: CheckCircle, color: 'text-emerald-400' },
          { key: 'concurrent_review_due', label: 'Review Due', icon: Clock, color: 'text-amber-400' },
          { key: 'pending_determination', label: 'Pend. Det.', icon: Clock, color: 'text-blue-400' },
          { key: 'pended', label: 'Pended', icon: AlertTriangle, color: 'text-orange-400' },
          { key: 'denied', label: 'Denied', icon: XCircle, color: 'text-red-400' },
          { key: 'at_threshold', label: 'At Threshold', icon: Shield, color: 'text-purple-400' },
        ].map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
            <Icon size={16} className={`${color} mx-auto`} />
            <p className={`text-xl font-bold mt-1 ${color}`}>
              {key === 'at_threshold' ? atThreshold : (statusCounts[key] ?? 0)}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Action Required Banner */}
      {(statusCounts['denied'] ?? 0) + (statusCounts['pended'] ?? 0) > 0 && (
        <div className="bg-red-950/30 border border-red-500/30 rounded-lg px-4 py-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs">
            <span className="font-semibold">{statusCounts['denied'] ?? 0} denied</span> and <span className="font-semibold">{statusCounts['pended'] ?? 0} pended</span> authorizations
            require immediate action. Denials should have appeal timelines assigned. Pended items need follow-up with the MCO.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-3">
        <Filter size={14} className="text-slate-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="needs_action">Needs Action</option>
          <option value="active">Active</option>
          <option value="concurrent_review_due">Review Due</option>
          <option value="pending_determination">Pending Determination</option>
          <option value="pended">Pended</option>
          <option value="denied">Denied</option>
          <option value="expired">Expired</option>
        </select>
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
        <span className="text-slate-500 text-xs">{sorted.length} records</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-700 bg-slate-800">
        <table className="w-full min-w-[900px]">
          <thead className="sticky top-0 bg-slate-900 text-xs text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left">Client</th>
              <th className="px-3 py-2 text-left">Lane</th>
              <th className="px-3 py-2 text-left">MCO</th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left min-w-[140px]">Units Used</th>
              <th className="px-3 py-2 text-left">Start</th>
              <th className="px-3 py-2 text-left">End</th>
              <th className="px-3 py-2 text-left">Action Due</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center text-slate-500 py-12 text-sm">No authorizations match the selected filters.</td>
              </tr>
            ) : (
              sorted.map((auth) => <AuthRow key={auth.id} auth={auth} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
