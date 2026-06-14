import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, XCircle, Filter } from 'lucide-react';
import { useCommandCenter } from '../CommandCenterContext';
import { NoteStatus, LaneId } from '../types';

const NOTE_STATUS_CONFIG: Record<NoteStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-slate-400', icon: Clock },
  documented: { label: 'Documented', color: 'text-emerald-400', icon: CheckCircle },
  late_note: { label: 'Late Note', color: 'text-amber-400', icon: Clock },
  missing: { label: 'Missing', color: 'text-red-400', icon: XCircle },
  needs_correction: { label: 'Needs Correction', color: 'text-orange-400', icon: AlertTriangle },
  supervisor_review: { label: 'Supv Review', color: 'text-purple-400', icon: AlertTriangle },
  qa_approved: { label: 'QA Approved', color: 'text-teal-400', icon: CheckCircle },
};

const SERVICE_LABELS: Record<string, string> = {
  iop_group: 'IOP Group',
  individual_counseling: 'Individual',
  case_management: 'Case Mgmt',
  peer_support: 'Peer Support',
  h0005_group: 'H0005 Group',
  treatment_team: 'Tx Team',
  assessment: 'Assessment',
};

const LANE_LABELS: Record<LaneId, string> = {
  lane1: 'Lane 1', lane2: 'Lane 2', virtual: 'Virtual',
};

function NoteStatusBadge({ status }: { status: NoteStatus }) {
  const cfg = NOTE_STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${cfg.color}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

export function QADashboard() {
  const { state } = useCommandCenter();
  const [filterStatus, setFilterStatus] = useState<string>('problem');
  const [filterLane, setFilterLane] = useState<LaneId | 'all'>('all');
  const [filterStaff, setFilterStaff] = useState<string>('all');

  const staffMap = Object.fromEntries(state.staff.map((s) => [s.id, s.name]));
  const clientMap = Object.fromEntries(state.clients.map((c) => [c.id, c]));

  const completedServices = state.services.filter((s) => s.status === 'completed');

  const noteStatusCounts: Record<string, number> = {};
  completedServices.forEach((s) => {
    noteStatusCounts[s.noteStatus] = (noteStatusCounts[s.noteStatus] ?? 0) + 1;
  });

  const problemStatuses: NoteStatus[] = ['late_note', 'missing', 'needs_correction', 'supervisor_review'];

  const filtered = completedServices.filter((s) => {
    if (filterLane !== 'all' && s.laneId !== filterLane) return false;
    if (filterStaff !== 'all' && s.staffId !== filterStaff) return false;
    if (filterStatus === 'problem' && !problemStatuses.includes(s.noteStatus)) return false;
    if (filterStatus !== 'problem' && filterStatus !== 'all' && s.noteStatus !== filterStatus) return false;
    return true;
  });

  const sortedServices = [...filtered].sort((a, b) => {
    const urgency = (s: typeof a) => {
      if (s.noteStatus === 'missing') return 100;
      if (s.noteStatus === 'late_note') return 80;
      if (s.noteStatus === 'needs_correction') return 60;
      if (s.noteStatus === 'supervisor_review') return 50;
      return 0;
    };
    return urgency(b) - urgency(a);
  });

  // Staff note compliance
  const staffNoteStats = state.staff
    .filter((s) => ['lead_counselor', 'co_lead', 'individual_counselor', 'case_manager', 'peer_specialist', 'virtual_contractor'].includes(s.role))
    .map((s) => {
      const staffSvcs = completedServices.filter((svc) => svc.staffId === s.id);
      const total = staffSvcs.length;
      const documented = staffSvcs.filter((svc) => svc.noteStatus === 'documented' || svc.noteStatus === 'qa_approved').length;
      const problems = staffSvcs.filter((svc) => problemStatuses.includes(svc.noteStatus)).length;
      const compliancePct = total > 0 ? Math.round((documented / total) * 100) : 100;
      return { ...s, total, documented, problems, compliancePct };
    })
    .sort((a, b) => a.compliancePct - b.compliancePct);

  const totalProblems = (noteStatusCounts['missing'] ?? 0) + (noteStatusCounts['late_note'] ?? 0) + (noteStatusCounts['needs_correction'] ?? 0) + (noteStatusCounts['supervisor_review'] ?? 0);
  const compliancePct = completedServices.length > 0
    ? Math.round(((noteStatusCounts['documented'] ?? 0) + (noteStatusCounts['qa_approved'] ?? 0)) / completedServices.length * 100)
    : 0;

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto space-y-5">
      <div>
        <h1 className="text-white text-2xl font-bold">QA / Documentation Tracker</h1>
        <p className="text-slate-400 text-sm mt-0.5">Note compliance across all services · Week of June 9–13, 2026</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {(Object.entries(NOTE_STATUS_CONFIG) as [NoteStatus, typeof NOTE_STATUS_CONFIG[NoteStatus]][]).map(([status, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={status} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
              <Icon size={14} className={`${cfg.color} mx-auto`} />
              <p className={`text-xl font-bold mt-1 ${cfg.color}`}>{noteStatusCounts[status] ?? 0}</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-tight">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Overall Compliance */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-6">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider">Documentation Compliance</p>
          <p className={`text-4xl font-bold mt-1 ${compliancePct >= 90 ? 'text-emerald-400' : compliancePct >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
            {compliancePct}%
          </p>
          <p className="text-slate-500 text-xs mt-1">{totalProblems} services need attention</p>
        </div>
        <div className="flex-1">
          <div className="bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${compliancePct >= 90 ? 'bg-emerald-500' : compliancePct >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${compliancePct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0%</span>
            <span className="text-amber-400">75% threshold</span>
            <span className="text-emerald-400">90% target</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Staff Compliance Table */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-2">Staff Documentation Compliance</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 text-left">Staff</th>
                <th className="px-4 py-2 text-left">Lane</th>
                <th className="px-4 py-2 text-right">Total Svcs</th>
                <th className="px-4 py-2 text-right">Documented</th>
                <th className="px-4 py-2 text-right">Problems</th>
                <th className="px-4 py-2 text-left pl-4">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {staffNoteStats.map((s) => (
                <tr key={s.id} className={`border-t border-slate-700/50 hover:bg-slate-700/20 ${s.compliancePct < 75 ? 'bg-red-950/10' : ''}`}>
                  <td className="px-4 py-2.5 text-slate-200">{s.name}</td>
                  <td className="px-4 py-2.5 text-slate-400">{s.laneId === 'all' ? 'All' : LANE_LABELS[s.laneId as LaneId]}</td>
                  <td className="px-4 py-2.5 text-right text-slate-400">{s.total}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-400">{s.documented}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${s.problems > 0 ? 'text-red-400' : 'text-slate-600'}`}>{s.problems}</td>
                  <td className="px-4 py-2.5 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${s.compliancePct >= 90 ? 'bg-emerald-500' : s.compliancePct >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${s.compliancePct}%` }}
                        />
                      </div>
                      <span className={`text-xs w-8 text-right ${s.compliancePct >= 90 ? 'text-emerald-400' : s.compliancePct >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                        {s.compliancePct}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters + Service Log */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-white font-semibold text-sm">Service Note Log</h2>
          <div className="flex items-center gap-2 ml-auto">
            <Filter size={12} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="problem">Needs Attention</option>
              <option value="all">All Statuses</option>
              <option value="missing">Missing</option>
              <option value="late_note">Late Notes</option>
              <option value="needs_correction">Needs Correction</option>
              <option value="documented">Documented</option>
            </select>
            <select
              value={filterLane}
              onChange={(e) => setFilterLane(e.target.value as LaneId | 'all')}
              className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="all">All Lanes</option>
              <option value="lane1">Lane 1</option>
              <option value="lane2">Lane 2</option>
              <option value="virtual">Virtual</option>
            </select>
            <select
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="all">All Staff</option>
              {state.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full min-w-[600px] text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-left">Lane</th>
                <th className="px-3 py-2 text-left">Service</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Staff</th>
                <th className="px-3 py-2 text-left">Note Status</th>
                <th className="px-3 py-2 text-right">Billable</th>
              </tr>
            </thead>
            <tbody>
              {sortedServices.slice(0, 50).map((svc) => (
                <tr key={svc.id} className={`border-t border-slate-700/40 hover:bg-slate-700/20 ${svc.noteStatus === 'missing' ? 'bg-red-950/10' : ''}`}>
                  <td className="px-3 py-2 font-mono text-slate-300">{svc.clientId}</td>
                  <td className="px-3 py-2 text-slate-400">{LANE_LABELS[svc.laneId]}</td>
                  <td className="px-3 py-2 text-slate-300">{SERVICE_LABELS[svc.serviceType] ?? svc.serviceType}</td>
                  <td className="px-3 py-2 text-slate-400">{svc.date}</td>
                  <td className="px-3 py-2 text-slate-400">{staffMap[svc.staffId]?.split(' ').slice(-1)[0] ?? svc.staffId}</td>
                  <td className="px-3 py-2"><NoteStatusBadge status={svc.noteStatus} /></td>
                  <td className="px-3 py-2 text-right">
                    {svc.billable
                      ? <span className="text-emerald-400">✓</span>
                      : <span className="text-slate-600">—</span>
                    }
                  </td>
                </tr>
              ))}
              {sortedServices.length > 50 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-3 text-xs">
                    Showing 50 of {sortedServices.length} records. Use filters to narrow results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
