import React, { useState, useEffect } from 'react';
import { HardDrive, Play, Save, RotateCcw } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, StatCard, AlertBanner, chartDarkOptions } from '../components/CommonUI';

const DEFAULT_REQS = '98, 183, 37, 122, 14, 124, 65, 67';

export default function DiskSchedulingPage() {
  const { user } = useAuth();
  const [reqInput, setReqInput] = useState(DEFAULT_REQS);
  const [head, setHead] = useState(53);
  const [diskSize, setDiskSize] = useState(200);
  const [algorithm, setAlgorithm] = useState('FCFS');
  const [direction, setDirection] = useState('up');

  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const runSim = async (save = false) => {
    setError('');
    setNotice('');
    try {
      const requests = reqInput
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number);

      const data = await api.simulate('disk', {
        requests,
        head: Number(head),
        diskSize: Number(diskSize),
        algorithm,
        direction,
        includeComparison: true,
        save,
        title: `Disk ${algorithm} (head=${head})`
      });
      setResult(data.result);
      setComparison(data.comparison);
      if (save && data.savedRecord) setNotice('Disk scheduling run saved.');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    runSim(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lineData = result
    ? {
        labels: result.sequence.map((cyl, idx) => (idx === 0 ? `Start (${cyl})` : `Step ${idx}: ${cyl}`)),
        datasets: [
          {
            label: `Disk Head Cylinder (${result.algorithm})`,
            data: result.sequence,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.25)',
            pointBackgroundColor: '#6366f1',
            pointRadius: 5,
            tension: 0.15,
            fill: true
          }
        ]
      }
    : null;

  const cmpData = comparison
    ? {
        labels: comparison.map((c) => c.algorithm),
        datasets: [
          {
            label: 'Total Seek Distance (cylinders)',
            data: comparison.map((c) => c.totalSeekTime),
            backgroundColor: ['#6366f1', '#10b981', '#06b6d4', '#f59e0b'],
            borderRadius: 6
          }
        ]
      }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={HardDrive}
        title="Disk Scheduling Simulator"
        badge="FCFS • SSTF • SCAN • C-SCAN"
        subtitle="Plot disk arm seek trajectories across cylinders, inspect head movements, and compare total seek time."
        actions={
          <>
            <button
              onClick={() => {
                setReqInput(DEFAULT_REQS);
                setHead(53);
                setDiskSize(200);
              }}
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

      <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Cylinder Request Queue</label>
          <input
            value={reqInput}
            onChange={(e) => setReqInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Initial Head / Disk Size</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={head}
              onChange={(e) => setHead(e.target.value)}
              className="w-1/2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              title="Initial Head"
            />
            <input
              type="number"
              min={10}
              value={diskSize}
              onChange={(e) => setDiskSize(e.target.value)}
              className="w-1/2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              title="Disk Cylinders"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Algorithm & Direction</label>
          <div className="flex gap-2">
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="flex-1 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            >
              <option value="FCFS">FCFS</option>
              <option value="SSTF">SSTF</option>
              <option value="SCAN">SCAN</option>
              <option value="C-SCAN">C-SCAN</option>
            </select>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            >
              <option value="up">Up (→)</option>
              <option value="down">Down (←)</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => runSim(false)}
          className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" /> Simulate
        </button>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Total Seek Time"
              value={`${result.metrics.totalSeekTime} cyl`}
              accent="indigo"
            />
            <StatCard
              label="Average Seek"
              value={`${result.metrics.averageSeekTime} cyl`}
              accent="cyan"
            />
            <StatCard label="Max Single Seek" value={`${result.metrics.maxSeek} cyl`} accent="amber" />
            <StatCard label="Requests Served" value={result.metrics.requestCount} accent="emerald" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass-panel p-5">
              <h3 className="text-sm font-semibold text-white mb-4">
                Head Movement Trajectory ({result.algorithm})
              </h3>
              <div className="h-72">{lineData && <Line data={lineData} options={chartDarkOptions} />}</div>
            </div>

            <div className="glass-panel p-5">
              <h3 className="text-sm font-semibold text-white mb-4">
                Total Seek Comparison (All 4 Algorithms)
              </h3>
              <div className="h-72">{cmpData && <Bar data={cmpData} options={chartDarkOptions} />}</div>
            </div>
          </div>

          <div className="glass-panel p-5 overflow-x-auto">
            <h3 className="text-sm font-semibold text-white mb-3">
              Head Movement Sequence: {result.sequence.join(' → ')}
            </h3>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2">Step</th>
                  <th className="py-2">From Cylinder</th>
                  <th className="py-2">To Cylinder</th>
                  <th className="py-2">Seek Distance</th>
                  <th className="py-2">Cumulative Seek</th>
                  <th className="py-2">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.movements.map((m) => (
                  <tr key={m.step} className="text-slate-200">
                    <td className="py-2 font-bold text-indigo-300">#{m.step}</td>
                    <td className="py-2">{m.from}</td>
                    <td className="py-2">{m.to}</td>
                    <td className="py-2 font-semibold text-cyan-300">{m.distance}</td>
                    <td className="py-2">{m.cumulativeSeek}</td>
                    <td className="py-2 text-slate-400">
                      {m.isWrapJump ? 'C-SCAN Wrap Jump' : m.isBoundary ? 'Disk Boundary' : 'Service Request'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
