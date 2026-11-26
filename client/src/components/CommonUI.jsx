import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const PALETTE = [
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#f97316', // orange
  '#14b8a6'  // teal
];

export function PageHeader({ icon: Icon, title, subtitle, badge, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            {badge && (
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, accent = 'indigo' }) {
  const accentMap = {
    indigo: 'border-indigo-500/30 text-indigo-400',
    cyan: 'border-cyan-500/30 text-cyan-400',
    emerald: 'border-emerald-500/30 text-emerald-400',
    amber: 'border-amber-500/30 text-amber-400',
    rose: 'border-rose-500/30 text-rose-400'
  };
  return (
    <div className={`glass-panel p-4 border-l-4 ${accentMap[accent] || accentMap.indigo}`}>
      <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export function AlertBanner({ type = 'error', message }) {
  if (!message) return null;
  const styles =
    type === 'success'
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
      : type === 'info'
      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
      : 'bg-rose-500/10 border-rose-500/30 text-rose-300';

  return <div className={`px-4 py-3 rounded-xl border text-sm mb-4 ${styles}`}>{message}</div>;
}

export const chartDarkOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#cbd5e1', font: { size: 12 } }
    }
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.1)' }
    },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.1)' }
    }
  }
};
