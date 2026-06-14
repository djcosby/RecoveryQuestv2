import React, { useState } from 'react';
import { useCommandCenter } from '../CommandCenterContext';
import { LaneId, ScheduledService, ServiceType } from '../types';

const DAYS = ['Mon 6/9', 'Tue 6/10', 'Wed 6/11', 'Thu 6/12', 'Fri 6/13'];
const DAY_DATES = ['2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13'];

const SERVICE_COLORS: Record<ServiceType, string> = {
  iop_group: 'bg-blue-600/80 border-blue-500',
  individual_counseling: 'bg-purple-600/80 border-purple-500',
  case_management: 'bg-amber-600/80 border-amber-500',
  peer_support: 'bg-rose-600/80 border-rose-500',
  h0005_group: 'bg-teal-600/80 border-teal-500',
  treatment_team: 'bg-slate-500/80 border-slate-400',
  assessment: 'bg-indigo-600/80 border-indigo-500',
  supervision: 'bg-slate-600/80 border-slate-500',
  admin: 'bg-slate-700/80 border-slate-600',
};

const SERVICE_LABELS: Record<ServiceType, string> = {
  iop_group: 'IOP Group',
  individual_counseling: 'Individual',
  case_management: 'Case Mgmt',
  peer_support: 'Peer Support',
  h0005_group: 'H0005 Group',
  treatment_team: 'Tx Team',
  assessment: 'Assessment',
  supervision: 'Supervision',
  admin: 'Admin',
};

const STATUS_ICON: Record<string, string> = {
  completed: '✓',
  scheduled: '○',
  no_show: '✗',
  cancelled_client: '—',
  cancelled_staff: '—',
};

type ViewMode = 'lane' | 'staff' | 'client';

interface DayBlock {
  date: string;
  services: ScheduledService[];
}

function ServiceBlock({ svc, label }: { svc: ScheduledService; label: string }) {
  const color = SERVICE_COLORS[svc.serviceType] ?? 'bg-slate-600/80 border-slate-500';
  const opacity = svc.status === 'no_show' ? 'opacity-40' : svc.status === 'cancelled_client' || svc.status === 'cancelled_staff' ? 'opacity-30' : '';
  return (
    <div className={`border rounded px-1.5 py-0.5 text-xs mb-0.5 ${color} ${opacity}`}>
      <span className="font-mono text-white/80 mr-1">{STATUS_ICON[svc.status]}</span>
      <span className="text-white text-xs">{label}</span>
      <span className="text-white/60 text-xs ml-1">{svc.startTime}</span>
    </div>
  );
}

function DayColumn({ day, date, blocks }: { day: string; date: string; blocks: ScheduledService[] }) {
  const grouped: Record<ServiceType, ScheduledService[]> = {} as Record<ServiceType, ScheduledService[]>;
  blocks.forEach((s) => {
    if (!grouped[s.serviceType]) grouped[s.serviceType] = [];
    grouped[s.serviceType].push(s);
  });

  return (
    <div className="flex-1 min-w-0 border-r border-slate-700/50 last:border-0">
      <div className="bg-slate-900 px-2 py-1.5 text-center border-b border-slate-700">
        <p className="text-slate-300 text-xs font-semibold">{day}</p>
      </div>
      <div className="p-1.5 min-h-[200px]">
        {(Object.entries(grouped) as [ServiceType, ScheduledService[]][]).map(([svcType, svcs]) => (
          <div key={svcType} className={`border rounded px-1.5 py-1 mb-1 ${SERVICE_COLORS[svcType]} text-xs`}>
            <p className="text-white font-semibold leading-tight">{SERVICE_LABELS[svcType]}</p>
            <p className="text-white/70 text-xs">{svcs.length} service{svcs.length > 1 ? 's' : ''}</p>
            <div className="mt-0.5 flex gap-2 text-xs text-white/60">
              <span>✓{svcs.filter((s) => s.status === 'completed').length}</span>
              <span>✗{svcs.filter((s) => s.status === 'no_show').length}</span>
            </div>
          </div>
        ))}
        {blocks.length === 0 && (
          <p className="text-slate-600 text-xs text-center mt-4">No services</p>
        )}
      </div>
    </div>
  );
}

export function WeeklyCalendar() {
  const { state } = useCommandCenter();
  const [viewMode, setViewMode] = useState<ViewMode>('lane');
  const [selectedLane, setSelectedLane] = useState<LaneId>('lane1');
  const [selectedStaffId, setSelectedStaffId] = useState(state.staff[3]?.id ?? '');
  const [selectedClientId, setSelectedClientId] = useState(state.clients[0]?.id ?? '');

  const filterServices = (): ScheduledService[] => {
    if (viewMode === 'lane') return state.services.filter((s) => s.laneId === selectedLane);
    if (viewMode === 'staff') return state.services.filter((s) => s.staffId === selectedStaffId);
    return state.services.filter((s) => s.clientId === selectedClientId);
  };

  const filteredServices = filterServices();

  const dayBlocks: DayBlock[] = DAY_DATES.map((date, i) => ({
    date,
    services: filteredServices.filter((s) => s.date === date),
  }));

  // Summary stats
  const completed = filteredServices.filter((s) => s.status === 'completed').length;
  const noShows = filteredServices.filter((s) => s.status === 'no_show').length;
  const lateOrMissing = filteredServices.filter((s) => s.noteStatus === 'late_note' || s.noteStatus === 'missing').length;
  const billable = filteredServices.filter((s) => s.billable).length;

  const LANE_LABELS: Record<LaneId, string> = { lane1: 'Lane 1', lane2: 'Lane 2', virtual: 'Virtual' };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-white text-2xl font-bold">Weekly Calendar</h1>
        <p className="text-slate-400 text-sm mt-0.5">June 9–13, 2026</p>
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
          {(['lane', 'staff', 'client'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${viewMode === mode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              By {mode}
            </button>
          ))}
        </div>

        {viewMode === 'lane' && (
          <select
            value={selectedLane}
            onChange={(e) => setSelectedLane(e.target.value as LaneId)}
            className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="lane1">Lane 1 — IOP</option>
            <option value="lane2">Lane 2 — IOP</option>
            <option value="virtual">Virtual Lane</option>
          </select>
        )}
        {viewMode === 'staff' && (
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {state.staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role.replace('_', ' ')})</option>)}
          </select>
        )}
        {viewMode === 'client' && (
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {state.clients.filter((c) => c.status === 'active').map((c) => (
              <option key={c.id} value={c.id}>{c.id} — {LANE_LABELS[c.laneId]}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stats Strip */}
      <div className="flex gap-4 mb-4 text-xs">
        {[
          { label: 'Total Services', value: filteredServices.length, color: 'text-white' },
          { label: 'Completed', value: completed, color: 'text-emerald-400' },
          { label: 'No-Shows', value: noShows, color: 'text-amber-400' },
          { label: 'Billable', value: billable, color: 'text-teal-400' },
          { label: 'Note Issues', value: lateOrMissing, color: lateOrMissing > 0 ? 'text-red-400' : 'text-slate-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
            <p className="text-slate-500 text-xs">{label}</p>
            <p className={`font-bold text-sm ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([type, label]) => (
          <span key={type} className={`border rounded px-2 py-0.5 text-xs text-white ${SERVICE_COLORS[type]}`}>{label}</span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex">
        {dayBlocks.map((block, i) => (
          <DayColumn key={block.date} day={DAYS[i]} date={block.date} blocks={block.services} />
        ))}
      </div>
    </div>
  );
}
