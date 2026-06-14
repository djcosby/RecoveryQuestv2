import React, { useState } from 'react';
import { AlertTriangle, User, Briefcase, Heart, Shield, Clock, Activity } from 'lucide-react';
import { useCommandCenter } from '../CommandCenterContext';
import { LaneId, Client } from '../types';

const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  moderate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  crisis: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const TX_COLORS: Record<string, string> = {
  current: 'text-emerald-400',
  due_soon: 'text-amber-400',
  overdue: 'text-red-400',
  missing: 'text-red-500',
};

function ClientRow({ client, staffMap }: { client: Client; staffMap: Record<string, string> }) {
  const criticalFlags = client.flags.filter((f) => f.severity === 'critical');
  const warnFlags = client.flags.filter((f) => f.severity === 'warning');

  return (
    <div className={`border-b border-slate-700/40 py-2 px-3 text-xs hover:bg-slate-700/20 transition-colors ${criticalFlags.length > 0 ? 'bg-red-950/10' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="text-slate-300 font-mono w-16 shrink-0">{client.id}</span>
        <span className={`border rounded px-1.5 py-0.5 text-xs font-medium w-16 text-center shrink-0 ${RISK_COLORS[client.riskLevel]}`}>
          {client.riskLevel}
        </span>
        <span className="text-slate-400 flex-1 truncate">{client.diagnosisDisplay.split(',')[0]}</span>
        <span className={`text-xs shrink-0 ${TX_COLORS[client.treatmentPlanStatus]}`} title={`Tx plan: ${client.treatmentPlanStatus}`}>
          {client.treatmentPlanStatus === 'current' ? '✓ TP' : client.treatmentPlanStatus === 'due_soon' ? '! TP' : '⚠ TP'}
        </span>
        <span className="text-slate-500 w-10 text-right shrink-0">{client.attendanceRate}%</span>
      </div>
      <div className="flex items-center gap-3 mt-1 pl-0">
        <span className={`flex items-center gap-0.5 ${client.assignedCounselorId ? 'text-slate-500' : 'text-red-400 font-semibold'}`}>
          <User size={9} /> {client.assignedCounselorId ? staffMap[client.assignedCounselorId]?.split(' ').pop() ?? '—' : 'NONE'}
        </span>
        <span className={`flex items-center gap-0.5 ${client.assignedCaseManagerId ? 'text-slate-500' : 'text-red-400 font-semibold'}`}>
          <Briefcase size={9} /> {client.assignedCaseManagerId ? staffMap[client.assignedCaseManagerId]?.split(' ').pop() ?? '—' : 'NONE'}
        </span>
        <span className={`flex items-center gap-0.5 ${client.assignedPeerWorkerId ? 'text-slate-500' : 'text-amber-400 font-semibold'}`}>
          <Heart size={9} /> {client.assignedPeerWorkerId ? staffMap[client.assignedPeerWorkerId]?.split(' ').pop() ?? '—' : 'NONE'}
        </span>
        {(criticalFlags.length > 0 || warnFlags.length > 0) && (
          <span className={`ml-auto flex items-center gap-0.5 text-xs ${criticalFlags.length > 0 ? 'text-red-400' : 'text-amber-400'}`}>
            <AlertTriangle size={9} />
            {criticalFlags.length + warnFlags.length} flag{criticalFlags.length + warnFlags.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

function LaneColumn({
  laneId, name, capacity, census, groupDays, groupTime, lead, coLead, caseManagers, peers, clients, staffMap,
}: {
  laneId: LaneId; name: string; capacity: number; census: number;
  groupDays: string[]; groupTime: string;
  lead: string; coLead: string; caseManagers: string[]; peers: string[];
  clients: Client[]; staffMap: Record<string, string>;
}) {
  const [showAll, setShowAll] = useState(false);
  const criticals = clients.filter((c) => c.flags.some((f) => f.severity === 'critical'));
  const pctFull = Math.round((census / capacity) * 100);
  const barColor = pctFull >= 95 ? 'bg-red-500' : pctFull >= 85 ? 'bg-amber-500' : 'bg-emerald-500';
  const displayed = showAll ? clients : clients.slice(0, 12);

  const laneColors: Record<LaneId, string> = {
    lane1: 'border-blue-500/40',
    lane2: 'border-purple-500/40',
    virtual: 'border-teal-500/40',
  };
  const headerColors: Record<LaneId, string> = {
    lane1: 'bg-blue-950/30 border-b border-blue-500/30',
    lane2: 'bg-purple-950/30 border-b border-purple-500/30',
    virtual: 'bg-teal-950/30 border-b border-teal-500/30',
  };

  return (
    <div className={`bg-slate-800 border ${laneColors[laneId]} rounded-xl flex flex-col overflow-hidden`}>
      {/* Lane Header */}
      <div className={`${headerColors[laneId]} p-4`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">{name}</h3>
            <p className="text-slate-400 text-xs mt-0.5">{groupDays.join(' · ')} · {groupTime}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-lg leading-none">{census}/{capacity}</p>
            <p className="text-slate-400 text-xs">{capacity - census} open</p>
          </div>
        </div>
        <div className="mt-2 bg-slate-700 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full ${barColor} transition-all`} style={{ width: `${pctFull}%` }} />
        </div>
      </div>

      {/* Staff Assignments */}
      <div className="p-3 border-b border-slate-700/50 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          <User size={12} className="text-blue-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Lead</span>
          <span className="text-slate-200 font-medium truncate">{staffMap[lead] ?? '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <User size={12} className="text-slate-500 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Co-Lead</span>
          <span className="text-slate-200 truncate">{staffMap[coLead] ?? '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Briefcase size={12} className="text-purple-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Case Mgr</span>
          <span className="text-slate-200 truncate">{caseManagers.map((id) => staffMap[id]?.split(' ').pop()).join(', ')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Heart size={12} className="text-rose-400 shrink-0" />
          <span className="text-slate-400 w-20 shrink-0">Peer Team</span>
          <span className="text-slate-200 truncate">{peers.map((id) => staffMap[id]?.split(' ').pop()).join(', ')}</span>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-slate-700/50">
        {criticals.length > 0 && (
          <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs rounded px-2 py-0.5 flex items-center gap-1">
            <AlertTriangle size={10} /> {criticals.length} critical
          </span>
        )}
        {clients.filter((c) => c.riskLevel === 'high' || c.riskLevel === 'crisis').length > 0 && (
          <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs rounded px-2 py-0.5 flex items-center gap-1">
            <Activity size={10} /> {clients.filter((c) => c.riskLevel === 'high' || c.riskLevel === 'crisis').length} high risk
          </span>
        )}
        {clients.filter((c) => c.treatmentPlanStatus === 'overdue' || c.treatmentPlanStatus === 'missing').length > 0 && (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs rounded px-2 py-0.5 flex items-center gap-1">
            <Clock size={10} /> {clients.filter((c) => c.treatmentPlanStatus === 'overdue' || c.treatmentPlanStatus === 'missing').length} TP overdue
          </span>
        )}
        {clients.filter((c) => c.paUnitsUsed && c.paUnitsAuthorized && (c.paUnitsUsed / c.paUnitsAuthorized) >= 0.9).length > 0 && (
          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs rounded px-2 py-0.5 flex items-center gap-1">
            <Shield size={10} /> {clients.filter((c) => c.paUnitsUsed && c.paUnitsAuthorized && (c.paUnitsUsed / c.paUnitsAuthorized) >= 0.9).length} PA threshold
          </span>
        )}
      </div>

      {/* Column Headers */}
      <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-slate-500 border-b border-slate-700/30 bg-slate-800/50">
        <span className="w-16">ID</span>
        <span className="w-16">Risk</span>
        <span className="flex-1">Diagnosis</span>
        <span className="w-8">TP</span>
        <span className="w-10 text-right">Att.</span>
      </div>

      {/* Client Rows */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {displayed.map((client) => (
          <ClientRow key={client.id} client={client} staffMap={staffMap} />
        ))}
        {clients.length > 12 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-blue-400 text-xs py-2 hover:text-blue-300 transition-colors border-t border-slate-700/40"
          >
            {showAll ? 'Show less' : `Show all ${clients.length} clients`}
          </button>
        )}
      </div>
    </div>
  );
}

export function LaneBoard() {
  const { state, getClientsForLane } = useCommandCenter();

  const staffMap = Object.fromEntries(state.staff.map((s) => [s.id, s.name]));

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-white text-2xl font-bold">Lane Board</h1>
        <p className="text-slate-400 text-sm mt-0.5">Real-time view of all three treatment lanes · Week of June 9–13, 2026</p>
      </div>
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
        {state.lanes.map((lane) => {
          const clients = getClientsForLane(lane.id);
          return (
            <LaneColumn
              key={lane.id}
              laneId={lane.id}
              name={lane.name}
              capacity={lane.capacity}
              census={clients.length}
              groupDays={lane.groupDays}
              groupTime={`${lane.groupStartTime}–${lane.groupEndTime}`}
              lead={lane.leadCounselorId}
              coLead={lane.coLeadId}
              caseManagers={lane.caseManagerIds}
              peers={lane.peerWorkerIds}
              clients={clients}
              staffMap={staffMap}
            />
          );
        })}
      </div>
    </div>
  );
}
