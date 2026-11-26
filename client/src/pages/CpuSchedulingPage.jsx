import React, { useState, useEffect } from 'react';
import { Cpu, Play, Plus, Trash2, Save, RotateCcw, StepForward } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, StatCard, AlertBanner, PALETTE, chartDarkOptions } from '../components/CommonUI';

const DEFAULT_PROCESSES = [
  { pid: 'P1', arrivalTime: 0, burstTime: 6, priority: 2 },
  { pid: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
  { pid: 'P3', arrivalTime: 2, burstTime: 2, priority: 3 },
  { pid: 'P4', arrivalTime: 3, burstTime: 5, priority: 2 }
];

const PID_COLORS = {
  IDLE: 'bg-slate-800 text-slate-400 border-slate-700'
};

function getSegmentStyle(pid, allPids) {
  if (pid === 'IDLE') return { backgroundColor: '#1e293b', color: '#94a3b8' };
  const idx = allPids.indexOf(pid);
  const bg = PALETTE[(idx >= 0 ? idx : 0) % PALETTE.length];
  return { backgroundColor: bg, color: '#ffffff' };
}

export default function CpuSchedulingPage() {
  const { user } = useAuth();
  const [processes, setProcesses] = useState(DEFAULT_PROCESSES);
  const [algorithm, setAlgorithm] = useState('FCFS');
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [preemptive, setPreemptive] = useState(false);
  const [higherNumberHigherPriority, setHigherNumberHigherPriority] = useState(false);

  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const runSim = async (save = false) => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const data = await api.simulate('cpu', {
        processes,
        algorithm,
        timeQuantum: Number(timeQuantum),
        preemptive,
        higherNumberHigherPriority,
        includeComparison: true,
        save,
        title: `CPU ${algorithm} (${processes.length} processes)`
      });
      setResult(data.result);
      setComparison(data.comparison);
      setActiveStep(data.result.steps.length - 1);
      if (save && data.savedRecord) {
        setNotice('Simulation saved to your history.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSim(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addProcess = () => {
    const nextNum = processes.length + 1;
    setProcesses([
      ...processes,
      { pid: `P${nextNum}`, arrivalTime: nextNum - 1, burstTime: 3, priority: 1 }
    ]);
  };

  const updateProc = (index, field, value) => {
    setProcesses((prev) =>
      prev.map((p, idx) =>
        idx === index ? { ...p, [field]: field === 'pid' ? value : Number(value) } : p
      )
    );
  };

  const removeProcess = (index) => {
    if (processes.length <= 1) return;
    setProcesses((prev) => prev.filter((_, idx) => idx !== index));
  };

  const pids = processes.map((p) => p.pid);

  const chartData = comparison
    ? {
        labels: comparison.map((c) => c.algorithm),
        datasets: [
          {
            label: 'Avg Turnaround Time',
            data: comparison.map((c) => c.avgTurnaroundTime),
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderRadius: 6
          },
          {
            label: 'Avg Waiting Time',
            data: comparison.map((c) => c.avgWaitingTime),
            backgroundColor: 'rgba(6, 182, 212, 0.8)',
            borderRadius: 6
          },
          {
            label: 'Avg Response Time',
            data: comparison.map((c) => c.avgResponseTime),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 6
          }
        ]
      }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Cpu}
        title="CPU Scheduling Simulator"
        badge="FCFS • SJF • SRTF • Priority • RR"
        subtitle="Configure processes, visualize the dynamic Gantt chart, inspect step-by-step ready queues, and benchmark all 5 algorithms."
        actions={
          <>
            <button
              onClick={() => setProcesses(DEFAULT_PROCESSES)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Preset
            </button>
            {user && (
              <button
                onClick={() => runSim(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Run
              </button>
            )}
          </>
        }
      />

      <AlertBanner type="error" message={error} />
      <AlertBanner type="success" message={notice} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Controls & Process Table */}
        <div className="glass-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Scheduler Configuration
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Algorithm</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              >
                <option value="FCFS">FCFS</option>
                <option value="SJF">SJF (Non-Preemptive)</option>
                <option value="SRTF">SRTF (Preemptive SJF)</option>
                <option value="PRIORITY">Priority Scheduling</option>
                <option value="RR">Round Robin (RR)</option>
              </select>
            </div>

            {algorithm === 'RR' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Time Quantum (q)</label>
                <input
                  type="number"
                  min={1}
                  value={timeQuantum}
                  onChange={(e) => setTimeQuantum(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>
            )}
          </div>

          {algorithm === 'PRIORITY' && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preemptive}
                  onChange={(e) => setPreemptive(e.target.checked)}
                />
                Preemptive Priority Mode
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={higherNumberHigherPriority}
                  onChange={(e) => setHigherNumberHigherPriority(e.target.checked)}
                />
                Higher number = higher priority (default: lower is higher)
              </label>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-slate-300 uppercase">Process Queue</span>
            <button
              onClick={addProcess}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Process
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2 pr-2">PID</th>
                  <th className="py-2 px-1">Arrival</th>
                  <th className="py-2 px-1">Burst</th>
                  <th className="py-2 px-1">Priority</th>
                  <th className="py-2 pl-1"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {processes.map((proc, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 pr-2">
                      <input
                        value={proc.pid}
                        onChange={(e) => updateProc(idx, 'pid', e.target.value)}
                        className="w-14 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number"
                        min={0}
                        value={proc.arrivalTime}
                        onChange={(e) => updateProc(idx, 'arrivalTime', e.target.value)}
                        className="w-14 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number"
                        min={1}
                        value={proc.burstTime}
                        onChange={(e) => updateProc(idx, 'burstTime', e.target.value)}
                        className="w-14 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number"
                        value={proc.priority}
                        onChange={(e) => updateProc(idx, 'priority', e.target.value)}
                        className="w-14 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white"
                      />
                    </td>
                    <td className="py-1.5 pl-1 text-right">
                      <button
                        onClick={() => removeProcess(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Remove process"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => runSim(false)}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4" />
            <span>{loading ? 'Simulating...' : 'Run CPU Simulation'}</span>
          </button>
        </div>

        {/* Gantt + Metrics + Step Trace */}
        <div className="xl:col-span-2 space-y-6">
          {result && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Avg Turnaround"
                  value={`${result.metrics.avgTurnaroundTime} ms`}
                  accent="indigo"
                />
                <StatCard
                  label="Avg Waiting"
                  value={`${result.metrics.avgWaitingTime} ms`}
                  accent="cyan"
                />
                <StatCard
                  label="CPU Utilization"
                  value={`${result.metrics.cpuUtilization}%`}
                  sub={`${result.metrics.contextSwitches} context switches`}
                  accent="emerald"
                />
                <StatCard
                  label="Avg Response"
                  value={`${result.metrics.avgResponseTime} ms`}
                  sub={`Total: ${result.metrics.totalTime} ms`}
                  accent="amber"
                />
              </div>

              {/* Gantt Chart */}
              <div className="glass-panel p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">
                    Gantt Chart ({result.algorithm})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Timeline: 0 → {result.metrics.totalTime} ms
                  </span>
                </div>

                <div className="w-full overflow-x-auto pb-2">
                  <div className="min-w-[520px]">
                    <div className="flex h-14 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      {result.gantt.map((seg, i) => {
                        const widthPct = ((seg.end - seg.start) / result.metrics.totalTime) * 100;
                        const style = getSegmentStyle(seg.pid, pids);
                        return (
                          <div
                            key={`${seg.pid}-${seg.start}-${i}`}
                            style={{ width: `${widthPct}%`, ...style }}
                            className={`flex flex-col items-center justify-center border-r border-slate-950/60 text-xs font-bold transition-all ${
                              PID_COLORS[seg.pid] || ''
                            }`}
                            title={`${seg.pid}: ${seg.start} to ${seg.end}`}
                          >
                            <span>{seg.pid}</span>
                            <span className="text-[10px] font-normal opacity-80">
                              {seg.start}–{seg.end}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Step-by-step execution trace */}
                {result.steps.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span className="text-xs font-semibold text-slate-300 inline-flex items-center gap-1.5">
                        <StepForward className="w-3.5 h-3.5 text-cyan-400" />
                        Step-by-Step Execution ({activeStep + 1}/{result.steps.length})
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={result.steps.length - 1}
                        value={activeStep}
                        onChange={(e) => setActiveStep(Number(e.target.value))}
                        className="w-40 accent-indigo-500"
                      />
                    </div>
                    {result.steps[activeStep] && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                        <span className="text-slate-200">{result.steps[activeStep].event}</span>
                        <span className="text-slate-400">
                          Ready Queue:{' '}
                          <strong className="text-cyan-300">
                            {result.steps[activeStep].readyQueue.length > 0
                              ? result.steps[activeStep].readyQueue.join(', ')
                              : 'Empty'}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Process Metrics Table */}
              <div className="glass-panel p-5 overflow-x-auto">
                <h3 className="text-sm font-semibold text-white mb-3">Per-Process Metrics</h3>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="py-2">PID</th>
                      <th className="py-2">AT</th>
                      <th className="py-2">BT</th>
                      <th className="py-2">Start</th>
                      <th className="py-2">CT</th>
                      <th className="py-2">TAT</th>
                      <th className="py-2">WT</th>
                      <th className="py-2">RT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {result.processes.map((p) => (
                      <tr key={p.pid} className="text-slate-200">
                        <td className="py-2 font-bold text-indigo-300">{p.pid}</td>
                        <td className="py-2">{p.arrivalTime}</td>
                        <td className="py-2">{p.burstTime}</td>
                        <td className="py-2">{p.startTime}</td>
                        <td className="py-2">{p.completionTime}</td>
                        <td className="py-2 font-semibold">{p.turnaroundTime}</td>
                        <td className="py-2 font-semibold text-cyan-300">{p.waitingTime}</td>
                        <td className="py-2">{p.responseTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Comparison Chart */}
      {chartData && (
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Algorithm Benchmark Comparison (All 5 CPU Schedulers)
          </h3>
          <div className="h-72">
            <Bar data={chartData} options={chartDarkOptions} />
          </div>
        </div>
      )}
    </div>
  );
}
