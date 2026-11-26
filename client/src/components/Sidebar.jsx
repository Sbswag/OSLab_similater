import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  MemoryStick,
  Layers,
  ShieldAlert,
  HardDrive,
  RefreshCw,
  BookOpen,
  History,
  Terminal
} from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/cpu', label: 'CPU Scheduling', icon: Cpu },
  { to: '/memory', label: 'Memory Allocation', icon: MemoryStick },
  { to: '/page-replacement', label: 'Page Replacement', icon: Layers },
  { to: '/deadlock', label: "Deadlock & Banker's", icon: ShieldAlert },
  { to: '/disk', label: 'Disk Scheduling', icon: HardDrive },
  { to: '/synchronization', label: 'Synchronization', icon: RefreshCw },
  { to: '/learning', label: 'Learning & Quizzes', icon: BookOpen },
  { to: '/history', label: 'Saved History', icon: History }
];

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white leading-none">OSLab Studio</div>
            <div className="text-[11px] text-slate-400 mt-1">Unified OS Simulator</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="font-medium text-slate-300">6 Core OS Modules + Lab Mode</div>
          <div className="mt-1">React • Express • Mongoose • Chart.js</div>
        </div>
      </aside>
    </>
  );
}
