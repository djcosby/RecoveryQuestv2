import React from 'react';
import {
  LayoutDashboard, Columns, Users, UserCircle, Calendar,
  CalendarDays, AlertTriangle, DollarSign, Shield, FileText,
  X, Activity, ChevronRight,
} from 'lucide-react';
import { CommandCenterProvider, useCommandCenter } from './CommandCenterContext';
import { Screen } from './types';
import { ExecutiveDashboard } from './screens/ExecutiveDashboard';
import { LaneBoard } from './screens/LaneBoard';
import { ClientRoster } from './screens/ClientRoster';
import { StaffDirectory } from './screens/StaffDirectory';
import { ScheduleBuilder } from './screens/ScheduleBuilder';
import { WeeklyCalendar } from './screens/WeeklyCalendar';
import { ServiceGapReport } from './screens/ServiceGapReport';
import { RevenueDashboard } from './screens/RevenueDashboard';
import { PAUMTracker } from './screens/PAUMTracker';
import { QADashboard } from './screens/QADashboard';

interface NavItem {
  screen: Screen;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

function Sidebar() {
  const { state, metrics, setScreen } = useCommandCenter();
  const active = state.currentScreen;
  const unresolvedAlerts = state.alerts.filter((a) => !a.resolved);
  const criticals = unresolvedAlerts.filter((a) => a.severity === 'critical').length;

  const navItems: NavItem[] = [
    {
      screen: 'dashboard', label: 'Command Dashboard', icon: LayoutDashboard,
      badge: criticals > 0 ? criticals : undefined, badgeColor: 'bg-red-500',
    },
    { screen: 'lanes', label: 'Lane Board', icon: Columns },
    {
      screen: 'clients', label: 'Client Roster', icon: UserCircle,
      badge: metrics.clientsMissingCounselor + metrics.clientsMissingCM > 0
        ? metrics.clientsMissingCounselor + metrics.clientsMissingCM : undefined,
      badgeColor: 'bg-red-500',
    },
    { screen: 'staff', label: 'Staff Directory', icon: Users },
    { screen: 'schedule', label: 'Schedule Builder', icon: Calendar },
    { screen: 'calendar', label: 'Weekly Calendar', icon: CalendarDays },
    {
      screen: 'gaps', label: 'Service Gap Report', icon: AlertTriangle,
      badge: unresolvedAlerts.filter((a) => a.type === 'service_gap').length || undefined,
      badgeColor: 'bg-amber-500',
    },
    { screen: 'revenue', label: 'Revenue Dashboard', icon: DollarSign },
    {
      screen: 'pa_um', label: 'PA / UM Tracker', icon: Shield,
      badge: metrics.paAlerts > 0 ? metrics.paAlerts : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      screen: 'qa', label: 'QA Dashboard', icon: FileText,
      badge: metrics.lateNotes > 0 ? metrics.lateNotes : undefined,
      badgeColor: 'bg-orange-500',
    },
  ];

  return (
    <aside className="w-56 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col">
      {/* Logo / Title */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white text-xs font-bold leading-tight">Recovery Academy</p>
            <p className="text-blue-400 text-xs leading-tight">Command Center</p>
          </div>
        </div>
        <div className="mt-3 bg-slate-800 rounded-lg p-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Active Census</span>
            <span className="text-white font-bold">{metrics.totalActiveCensus}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-slate-400">Week</span>
            <span className="text-slate-300">Jun 9–13, 2026</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {navItems.map(({ screen, label, icon: Icon, badge, badgeColor }) => (
          <button
            key={screen}
            onClick={() => setScreen(screen)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
              active === screen
                ? 'bg-blue-600/20 text-white border-l-2 border-blue-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-l-2 border-transparent'
            }`}
          >
            <Icon size={14} className={active === screen ? 'text-blue-400' : 'text-slate-500'} />
            <span className="flex-1">{label}</span>
            {badge !== undefined && (
              <span className={`text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-tight ${badgeColor ?? 'bg-slate-600'}`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Health Summary at Bottom */}
      <div className="p-3 border-t border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Service Rate</span>
          <span className={metrics.serviceCompletionRate >= 85 ? 'text-emerald-400' : 'text-amber-400'}>
            {metrics.serviceCompletionRate}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Doc Compliance</span>
          <span className="text-amber-400">↓ Check QA</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Phase</span>
          <span className="text-blue-400">De-ID Mock Data</span>
        </div>
      </div>
    </aside>
  );
}

function MainContent() {
  const { state } = useCommandCenter();
  switch (state.currentScreen) {
    case 'dashboard': return <ExecutiveDashboard />;
    case 'lanes': return <LaneBoard />;
    case 'clients': return <ClientRoster />;
    case 'staff': return <StaffDirectory />;
    case 'schedule': return <ScheduleBuilder />;
    case 'calendar': return <WeeklyCalendar />;
    case 'gaps': return <ServiceGapReport />;
    case 'revenue': return <RevenueDashboard />;
    case 'pa_um': return <PAUMTracker />;
    case 'qa': return <QADashboard />;
    default: return <ExecutiveDashboard />;
  }
}

interface CommandCenterAppProps {
  onClose: () => void;
}

function CommandCenterInner({ onClose }: CommandCenterAppProps) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900 font-sans">
      {/* Top Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Activity size={14} className="text-blue-400" />
          <span>Recovery Academy Command Center</span>
          <ChevronRight size={12} />
          <span className="text-white">Staff Portal</span>
          <span className="ml-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded px-2 py-0.5 text-xs">
            Phase 1 · De-Identified Mock Data
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs hidden sm:block">Press Ctrl+Shift+C to close</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            title="Close Command Center"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden bg-slate-900">
          <MainContent />
        </main>
      </div>
    </div>
  );
}

export function CommandCenterApp({ onClose }: CommandCenterAppProps) {
  return (
    <CommandCenterProvider>
      <CommandCenterInner onClose={onClose} />
    </CommandCenterProvider>
  );
}
