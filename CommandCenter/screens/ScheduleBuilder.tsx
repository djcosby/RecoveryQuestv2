import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Plus, Info } from 'lucide-react';
import { useCommandCenter } from '../CommandCenterContext';
import { LaneId } from '../types';

interface LaneConfig {
  laneId: LaneId;
  activeClients: number;
  groupDaysPerWeek: number;
  groupHoursPerDay: number;
  individualsPerClient: number;
  cmSessionsPerClient: number;
  peerHoursPerClient: number;
  leadId: string;
  coLeadId: string;
  caseManagerId: string;
  peerCount: number;
}

function RequirementRow({ label, value, check, warn }: { label: string; value: string; check: boolean; warn?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-slate-700/50 text-xs ${warn ? 'bg-amber-950/10 -mx-3 px-3' : ''}`}>
      <span className="text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-slate-200 font-mono">{value}</span>
        {check && !warn && <CheckCircle size={12} className="text-emerald-400" />}
        {warn && <AlertTriangle size={12} className="text-amber-400" />}
        {!check && !warn && <AlertTriangle size={12} className="text-red-400" />}
      </div>
    </div>
  );
}

function RuleViolation({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-950/20 border border-red-500/30 rounded-lg px-3 py-2 text-xs">
      <AlertTriangle size={12} className="text-red-400 shrink-0 mt-0.5" />
      <span className="text-red-300">{message}</span>
    </div>
  );
}

function RulePass({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <CheckCircle size={11} className="text-emerald-500 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function ScheduleBuilder() {
  const { state } = useCommandCenter();

  const INITIAL_CONFIGS: Record<LaneId, LaneConfig> = {
    lane1: {
      laneId: 'lane1', activeClients: 24, groupDaysPerWeek: 3, groupHoursPerDay: 3,
      individualsPerClient: 1, cmSessionsPerClient: 2, peerHoursPerClient: 12,
      leadId: 'C01', coLeadId: 'C02', caseManagerId: 'CM01', peerCount: 3,
    },
    lane2: {
      laneId: 'lane2', activeClients: 24, groupDaysPerWeek: 3, groupHoursPerDay: 3,
      individualsPerClient: 1, cmSessionsPerClient: 2, peerHoursPerClient: 12,
      leadId: 'C03', coLeadId: 'C04', caseManagerId: 'CM02', peerCount: 3,
    },
    virtual: {
      laneId: 'virtual', activeClients: 24, groupDaysPerWeek: 3, groupHoursPerDay: 3,
      individualsPerClient: 1, cmSessionsPerClient: 2, peerHoursPerClient: 12,
      leadId: 'C05', coLeadId: 'C06', caseManagerId: 'CM03', peerCount: 2,
    },
  };

  const [configs, setConfigs] = useState(INITIAL_CONFIGS);
  const [selectedLane, setSelectedLane] = useState<LaneId>('lane1');

  const cfg = configs[selectedLane];

  const updateConfig = (key: keyof LaneConfig, value: number | string) => {
    setConfigs((prev) => ({ ...prev, [selectedLane]: { ...prev[selectedLane], [key]: value } }));
  };

  // Calculations
  const groupHoursPerWeek = cfg.groupDaysPerWeek * cfg.groupHoursPerDay;
  const totalGroupClientHours = cfg.activeClients * groupHoursPerWeek;
  const totalIndividualSessions = cfg.activeClients * cfg.individualsPerClient;
  const totalCMSessions = cfg.activeClients * cfg.cmSessionsPerClient;
  const totalCMHours = totalCMSessions; // assuming 1h each
  const totalPeerHours = cfg.activeClients * cfg.peerHoursPerClient;

  // Lead counselor hours
  const leadGroupHours = cfg.groupHoursPerDay * cfg.groupDaysPerWeek;
  const leadIndivSessions = Math.ceil(cfg.activeClients / 2); // split with co-lead
  const coLeadIndivSessions = Math.floor(cfg.activeClients / 2);
  const leadNonBillable = 5; // documentation, supervision, admin
  const leadTotalScheduled = leadGroupHours + leadIndivSessions + leadNonBillable;
  const coLeadTotalScheduled = leadGroupHours + coLeadIndivSessions + leadNonBillable;

  // CM hours
  const cmTotalHours = totalCMHours + 4; // 4h admin/documentation
  const cmOverCapacity = cmTotalHours > 40;

  // Peer hours per peer worker
  const peerHoursEach = cfg.peerCount > 0 ? Math.ceil(totalPeerHours / cfg.peerCount) : totalPeerHours;
  const peerOverCapacity = peerHoursEach > 34;

  // Revenue estimates
  const H0015_RATE = 8.00; // per 15-min unit per client
  const INDIV_RATE = 148.00; // per session
  const CM_RATE = 15.00; // per 15-min unit
  const PEER_RATE = 5.50; // per 15-min unit

  const iopRevenue = totalGroupClientHours * 4 * H0015_RATE; // 4 units per hour
  const indivRevenue = totalIndividualSessions * INDIV_RATE;
  const cmRevenue = totalCMHours * 4 * CM_RATE;
  const peerRevenue = totalPeerHours * 4 * PEER_RATE;
  const totalGross = iopRevenue + indivRevenue + cmRevenue + peerRevenue;

  const staffById = Object.fromEntries(state.staff.map((s) => [s.id, s]));
  const directServiceStaff = state.staff.filter((s) => ['lead_counselor', 'co_lead', 'individual_counselor', 'case_manager', 'peer_specialist', 'virtual_contractor'].includes(s.role));

  // Rule violations
  const violations: string[] = [];
  const passes: string[] = [];

  if (cfg.activeClients > 24) violations.push(`Lane capacity exceeded — ${cfg.activeClients} clients assigned, maximum is 24.`);
  else passes.push('Lane capacity within limit (24 max).');

  if (!cfg.leadId) violations.push('No lead counselor assigned to this lane.');
  else passes.push('Lead counselor assigned.');

  if (!cfg.coLeadId) violations.push('No co-lead counselor assigned.');
  else passes.push('Co-lead counselor assigned.');

  if (!cfg.caseManagerId) violations.push('No case manager assigned to this lane.');
  else passes.push('Case manager assigned.');

  if (cfg.peerCount < 1) violations.push('No peer support workers assigned to this lane.');
  else passes.push(`${cfg.peerCount} peer support worker(s) assigned.`);

  if (cmOverCapacity) violations.push(`Case manager is scheduled for ${cmTotalHours}h — exceeds 40h available time. Additional CM coverage required.`);
  else passes.push('Case manager load within available hours.');

  if (peerOverCapacity) violations.push(`Peer workers average ${peerHoursEach}h each — exceeds 34h billable target. Additional peer coverage needed.`);
  else passes.push('Peer support hours distributed within staff targets.');

  if (leadTotalScheduled < 30) violations.push(`Lead counselor may be under-utilized at ${leadTotalScheduled}h scheduled.`);
  if (leadTotalScheduled > 34) passes.push(`Lead counselor at ${leadTotalScheduled}h — at/above 34h target.`);

  const LANE_LABELS: Record<LaneId, string> = {
    lane1: 'Lane 1 — IOP On-Site', lane2: 'Lane 2 — IOP On-Site', virtual: 'Virtual Lane — IOP',
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-white text-2xl font-bold">Schedule Builder</h1>
        <p className="text-slate-400 text-sm mt-0.5">Configure lane structure and validate capacity, staffing, and service requirements</p>
      </div>

      {/* Lane Selector */}
      <div className="flex gap-2 mb-6">
        {(['lane1', 'lane2', 'virtual'] as LaneId[]).map((laneId) => (
          <button
            key={laneId}
            onClick={() => setSelectedLane(laneId)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedLane === laneId
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            {laneId === 'lane1' ? 'Lane 1' : laneId === 'lane2' ? 'Lane 2' : 'Virtual'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-white font-semibold text-sm mb-4">{LANE_LABELS[selectedLane]} — Configuration</h2>

            <div className="space-y-3">
              {/* Clients */}
              <div>
                <label className="text-slate-400 text-xs block mb-1">Active Clients (max 24)</label>
                <input
                  type="number" min={0} max={30} value={cfg.activeClients}
                  onChange={(e) => updateConfig('activeClients', Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Group Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Group Days / Week</label>
                  <input
                    type="number" min={1} max={5} value={cfg.groupDaysPerWeek}
                    onChange={(e) => updateConfig('groupDaysPerWeek', Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Group Hours / Day</label>
                  <input
                    type="number" min={1} max={8} value={cfg.groupHoursPerDay}
                    onChange={(e) => updateConfig('groupHoursPerDay', Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Per-Client Services */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Indiv. Sessions/Client</label>
                  <input
                    type="number" min={0} max={5} value={cfg.individualsPerClient}
                    onChange={(e) => updateConfig('individualsPerClient', Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">CM Sessions/Client</label>
                  <input
                    type="number" min={0} max={5} value={cfg.cmSessionsPerClient}
                    onChange={(e) => updateConfig('cmSessionsPerClient', Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Peer Hours/Client</label>
                  <input
                    type="number" min={0} max={20} value={cfg.peerHoursPerClient}
                    onChange={(e) => updateConfig('peerHoursPerClient', Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Staff Assignments */}
              <div>
                <label className="text-slate-400 text-xs block mb-1">Lead Counselor</label>
                <select
                  value={cfg.leadId}
                  onChange={(e) => updateConfig('leadId', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">— Select —</option>
                  {directServiceStaff.filter((s) => ['lead_counselor', 'co_lead'].includes(s.role)).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.credential})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Co-Lead</label>
                <select
                  value={cfg.coLeadId}
                  onChange={(e) => updateConfig('coLeadId', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">— Select —</option>
                  {directServiceStaff.filter((s) => ['lead_counselor', 'co_lead', 'individual_counselor', 'virtual_contractor'].includes(s.role)).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.credential})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Case Manager</label>
                  <select
                    value={cfg.caseManagerId}
                    onChange={(e) => updateConfig('caseManagerId', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">— Select —</option>
                    {directServiceStaff.filter((s) => s.role === 'case_manager').map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Peer Workers</label>
                  <input
                    type="number" min={0} max={6} value={cfg.peerCount}
                    onChange={(e) => updateConfig('peerCount', Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements + Validation */}
        <div className="space-y-4">
          {/* Expected Services */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-white font-semibold text-sm mb-3">Expected Weekly Services</h2>
            <div className="space-y-0">
              <RequirementRow label="IOP Group Client-Hours" value={`${totalGroupClientHours}h (${cfg.activeClients} clients × ${groupHoursPerWeek}h)`} check={groupHoursPerWeek >= 9} />
              <RequirementRow label="Individual Counseling Sessions" value={`${totalIndividualSessions} sessions`} check={cfg.individualsPerClient >= 1} />
              <RequirementRow label="Case Management Sessions" value={`${totalCMSessions} sessions (${totalCMHours}h)`} check={cfg.cmSessionsPerClient >= 1} warn={cmOverCapacity} />
              <RequirementRow label="Peer Support Hours" value={`${totalPeerHours}h (${peerHoursEach}h/worker)`} check={!peerOverCapacity} warn={peerOverCapacity} />
            </div>
          </div>

          {/* Staff Load */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-white font-semibold text-sm mb-3">Staff Load Estimates</h2>
            <div className="space-y-0">
              <RequirementRow label="Lead Counselor Scheduled" value={`${leadTotalScheduled}h (target: 34h)`} check={leadTotalScheduled >= 30} warn={leadTotalScheduled > 40} />
              <RequirementRow label="Co-Lead Counselor Scheduled" value={`${coLeadTotalScheduled}h (target: 34h)`} check={coLeadTotalScheduled >= 30} warn={coLeadTotalScheduled > 40} />
              <RequirementRow label="Case Manager Total Load" value={`${cmTotalHours}h (max: 40h)`} check={!cmOverCapacity} warn={cmOverCapacity} />
              <RequirementRow label="Avg Peer Worker Load" value={`${peerHoursEach}h (target: 34h)`} check={!peerOverCapacity} warn={peerOverCapacity} />
            </div>
          </div>

          {/* Revenue Projection */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h2 className="text-white font-semibold text-sm mb-3">Weekly Revenue Projection</h2>
            <div className="space-y-1.5 text-xs">
              {[
                { label: 'IOP Group (H0015)', value: iopRevenue },
                { label: 'Individual (90837)', value: indivRevenue },
                { label: 'Case Management (T1016)', value: cmRevenue },
                { label: 'Peer Support (H0038)', value: peerRevenue },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-200 font-mono">${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1.5 font-semibold">
                <span className="text-white">Gross Weekly Revenue</span>
                <span className="text-teal-400">${totalGross.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>At 78% kept rate</span>
                <span>${(totalGross * 0.78).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Rule Violations */}
          {violations.length > 0 && (
            <div>
              <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-red-400" /> Rule Violations
              </h2>
              <div className="space-y-1.5">
                {violations.map((v, i) => <RuleViolation key={i} message={v} />)}
              </div>
            </div>
          )}

          {/* Passing Rules */}
          <div>
            <h2 className="text-white font-semibold text-sm mb-2 flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-400" /> Rules Passing
            </h2>
            <div className="space-y-1">
              {passes.map((p, i) => <RulePass key={i} message={p} />)}
            </div>
          </div>

          <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg px-3 py-2.5 flex items-start gap-2">
            <Info size={12} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-300 text-xs">
              Schedule Builder validates structure against IOP service requirements. Adjust parameters above to model different staffing configurations. Revenue projections use approximate Ohio Medicaid rates and should be verified with your billing team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
