import React, { useState } from 'react';
import { User, Clock, FileText, AlertTriangle } from 'lucide-react';
import { useCommandCenter } from '../CommandCenterContext';
import { StaffMember, LaneId } from '../types';

const ROLE_LABELS: Record<string, string> = {
  lead_counselor: 'Lead Counselor',
  co_lead: 'Co-Lead',
  individual_counselor: 'Indiv. Counselor',
  case_manager: 'Case Manager',
  peer_specialist: 'Peer Specialist',
  virtual_contractor: 'Virtual Contractor',
  supervisor: 'Supervisor',
  qa_coordinator: 'QA Coordinator',
  pa_ur: 'PA/UR Coordinator',
};

const LANE_LABELS: Record<LaneId | 'all', string> = {
  lane1: 'Lane 1', lane2: 'Lane 2', virtual: 'Virtual', all: 'All Lanes',
};

function StaffCard({ staff }: { staff: StaffMember }) {
  const pct = staff.billableHoursTarget > 0 ? Math.round((staff.scheduledBillableHours / staff.billableHoursTarget) * 100) : null;
  const docPct = staff.scheduledBillableHours > 0 ? Math.round((staff.documentedBillableHours / staff.scheduledBillableHours) * 100) : null;
  const barColor = pct == null ? 'bg-slate-600' : pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-red-500';
  const problemNotes = staff.lateNotesCount + staff.missingNotesCount;

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition-colors ${staff.status === 'leave' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="bg-slate-700 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
          <User size={18} className="text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{staff.name}</p>
              <p className="text-slate-400 text-xs">{staff.credential} · {ROLE_LABELS[staff.role] ?? staff.role}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${
              staff.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
              staff.status === 'leave' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
              'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }`}>
              {staff.status}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">{LANE_LABELS[staff.laneId]}</p>
        </div>
      </div>

      {/* Productivity */}
      {staff.billableHoursTarget > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1"><Clock size={10} /> Billable Hours</span>
            <span className={`font-mono ${pct !== null && pct < 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {staff.scheduledBillableHours}/{staff.billableHoursTarget}h
            </span>
          </div>
          <div className="bg-slate-700 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(pct ?? 0, 100)}%` }} />
          </div>
          {docPct !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1"><FileText size={10} /> Doc. Compliance</span>
              <span className={`font-mono ${docPct >= 90 ? 'text-emerald-400' : docPct >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                {docPct}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-700/50 rounded-lg p-2">
          <p className="text-white text-sm font-bold">{staff.clientCount}</p>
          <p className="text-slate-500 text-xs">Clients</p>
        </div>
        <div className={`rounded-lg p-2 ${problemNotes > 0 ? 'bg-red-950/30 border border-red-500/20' : 'bg-slate-700/50'}`}>
          <p className={`text-sm font-bold ${problemNotes > 0 ? 'text-red-400' : 'text-white'}`}>{problemNotes}</p>
          <p className="text-slate-500 text-xs">Note Issues</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-2">
          <p className="text-white text-sm font-bold">${staff.hourlyRate.toFixed(0)}/hr</p>
          <p className="text-slate-500 text-xs">Rate</p>
        </div>
      </div>

      {/* Note Flags */}
      {problemNotes > 0 && (
        <div className="mt-2 flex items-start gap-1.5 bg-red-950/20 border border-red-500/20 rounded-lg px-2.5 py-1.5">
          <AlertTriangle size={11} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs">
            {staff.lateNotesCount > 0 && `${staff.lateNotesCount} late note${staff.lateNotesCount > 1 ? 's' : ''}`}
            {staff.lateNotesCount > 0 && staff.missingNotesCount > 0 && ' · '}
            {staff.missingNotesCount > 0 && `${staff.missingNotesCount} missing note${staff.missingNotesCount > 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      {/* Weekly Hours Detail */}
      {staff.billableHoursTarget > 0 && (
        <div className="mt-3 border-t border-slate-700/50 pt-2.5 grid grid-cols-3 gap-1 text-xs">
          <div>
            <p className="text-slate-500">Scheduled</p>
            <p className="text-slate-200 font-medium">{staff.scheduledBillableHours}h</p>
          </div>
          <div>
            <p className="text-slate-500">Completed</p>
            <p className="text-slate-200 font-medium">{staff.completedBillableHours}h</p>
          </div>
          <div>
            <p className="text-slate-500">Documented</p>
            <p className="text-slate-200 font-medium">{staff.documentedBillableHours}h</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function StaffDirectory() {
  const { state } = useCommandCenter();
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterLane, setFilterLane] = useState<string>('all');

  const filtered = state.staff.filter((s) => {
    if (filterRole !== 'all' && s.role !== filterRole) return false;
    if (filterLane !== 'all' && s.laneId !== filterLane) return false;
    return true;
  });

  const belowTarget = state.staff.filter((s) => s.billableHoursTarget > 0 && s.scheduledBillableHours < s.billableHoursTarget).length;
  const problemNoteStaff = state.staff.filter((s) => s.lateNotesCount + s.missingNotesCount > 0).length;
  const weeklyPayroll = state.staff.reduce((sum, s) => sum + s.scheduledBillableHours * s.hourlyRate, 0);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-white text-2xl font-bold">Staff Directory</h1>
        <p className="text-slate-400 text-sm mt-0.5">{state.staff.length} staff members · Week of June 9–13, 2026</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
          <p className="text-slate-400 text-xs">Active Staff</p>
          <p className="text-white text-xl font-bold">{state.staff.filter((s) => s.status === 'active').length}</p>
        </div>
        <div className={`bg-slate-800 border rounded-xl p-3 ${belowTarget > 0 ? 'border-amber-500/40' : 'border-slate-700'}`}>
          <p className="text-slate-400 text-xs">Below 34h Target</p>
          <p className={`text-xl font-bold ${belowTarget > 0 ? 'text-amber-400' : 'text-white'}`}>{belowTarget}</p>
        </div>
        <div className={`bg-slate-800 border rounded-xl p-3 ${problemNoteStaff > 0 ? 'border-red-500/40' : 'border-slate-700'}`}>
          <p className="text-slate-400 text-xs">Note Issues</p>
          <p className={`text-xl font-bold ${problemNoteStaff > 0 ? 'text-red-400' : 'text-white'}`}>{problemNoteStaff} staff</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
          <p className="text-slate-400 text-xs">Est. Weekly Payroll</p>
          <p className="text-white text-xl font-bold">${weeklyPayroll.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={filterLane}
          onChange={(e) => setFilterLane(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Lanes</option>
          <option value="lane1">Lane 1</option>
          <option value="lane2">Lane 2</option>
          <option value="virtual">Virtual</option>
        </select>
        <span className="text-slate-500 text-xs">{filtered.length} staff shown</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((s) => <StaffCard key={s.id} staff={s} />)}
      </div>
    </div>
  );
}
