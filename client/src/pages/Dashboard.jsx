import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  MemoryStick,
  Layers,
  ShieldAlert,
  HardDrive,
  RefreshCw,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MODULES = [
  {
    to: '/cpu',
    title: 'CPU Scheduling',
    icon: Cpu,
    color: 'from-indigo-500 to-blue-500',
    algorithms: ['FCFS', 'SJF', 'SRTF', 'Priority', 'Round Robin'],
    desc: 'Interactive Gantt charts, turnaround/waiting/response metrics, step playback, and 5-way Chart.js comparison.'
  },
  {
    to: '/memory',
    title: 'Memory Management',
    icon: MemoryStick,
    color: 'from-cyan-500 to-teal-500',
    algorithms: ['First Fit', 'Best Fit', 'Worst Fit'],
    desc: 'Visual contiguous memory partition map, fixed vs variable allocation, and internal/external fragmentation analysis.'
  },
  {
    to: '/page-replacement',
    title: 'Page Replacement',
    icon: Layers,
    color: 'from-emerald-500 to-green-500',
    algorithms: ['FIFO', 'LRU', 'Optimal'],
    desc: 'Frame-by-frame grid trace, hit/fault ratio charts, Belady’s Anomaly preset, and step-by-step eviction explanations.'
  },
  {
    to: '/deadlock',
    title: "Deadlock & Banker's",
    icon: ShieldAlert,
    color: 'from-amber-500 to-orange-500',
    algorithms: ["Banker's Safety", 'Resource Request', 'Need Matrix'],
    desc: 'Verify safe sequences, inspect step-by-step Work vector updates, and test live resource requests.'
  },
  {
    to: '/disk',
    title: 'Disk Scheduling',
    icon: HardDrive,
    color: 'from-pink-500 to-rose-500',
    algorithms: ['FCFS', 'SSTF', 'SCAN', 'C-SCAN'],
    desc: 'Real-time head movement trajectory charts in Chart.js, seek distance logs, and multi-algorithm comparison.'
  },
  {
    to: '/synchronization',
    title: 'Process Synchronization',
    icon: RefreshCw,
    color: 'from-violet-500 to-purple-500',
    algorithms: ['Producer-Consumer', 'Dining Philosophers'],
    desc: 'Animated bounded buffer with semaphores and an interactive round-table Dining Philosophers deadlock lab.'
  }
];

export default function Dashboard({ onOpenAuth }) {
  const { user, dbStatus } = useAuth();

  return (
    <div className="space-y-8">
      <section className="glass-panel p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified Operating Systems Virtual Laboratory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Interactive Operating System Learning & Simulation Platform
          </h1>
          <p className="text-slate-300 mt-3 text-sm sm:text-base leading-relaxed">
            Master core Operating System algorithms in one unified platform—combining real-time
            visual simulators, Chart.js analytics, step-by-step traces, quizzes, and practice
            problems backed by Express, Mongoose, and JWT authentication.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/cpu"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
            >
              <span>Launch CPU Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/learning"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 transition"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Open Learning Mode</span>
            </Link>
            {!user && (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 font-medium text-sm transition"
              >
                <span>Sign In to Save Runs</span>
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 6 Core Simulators Combined
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Step-by-Step Playback
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Storage:{' '}
              <strong className="text-slate-200">
                {dbStatus === 'mongodb'
                  ? 'MongoDB'
                  : dbStatus === 'offline'
                  ? 'Offline'
                  : 'Zero-Config Local Storage'}
              </strong>
            </span>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Simulation Modules</h2>
          <span className="text-xs text-slate-400">Select a lab to begin experimenting</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {MODULES.map(({ to, title, icon: Icon, color, algorithms, desc }) => (
            <Link
              key={to}
              to={to}
              className="glass-panel p-5 hover:border-indigo-500/50 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                </div>
                <h3 className="text-base font-bold text-white">{title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{desc}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {algorithms.map((a) => (
                  <span
                    key={a}
                    className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 text-[11px] border border-slate-700/70"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
