import React, { useState, useEffect } from 'react';
import { MemoryStick, Play, Save, RotateCcw } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, StatCard, AlertBanner, chartDarkOptions } from '../components/CommonUI';

const DEFAULT_BLOCKS = '100, 500, 200, 300, 600';
const DEFAULT_REQUESTS = '212, 417, 112, 426';

export default function MemoryManagementPage() {
  const { user } = useAuth();
  const [blocksInput, setBlocksInput] = useState(DEFAULT_BLOCKS);
  const [requestsInput, setRequestsInput] = useState(DEFAULT_REQUESTS);
  const [algorithm, setAlgorithm] = useState('FIRST_FIT');
  const [partitionMode, setPartitionMode] = useState('fixed');

  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const parseNumbers = (str) =>
    str
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);

  const runSim = async (save = false) => {
    setError('');
    setNotice('');
    try {
      const blocks = parseNumbers(blocksInput);
      const requests = parseNumbers(requestsInput).map((size, idx) => ({
        pid: `P${idx + 1}`,
        size
      }));

      const data = await api.simulate('memory', {
        blocks,
        requests,
        algorithm,
        partitionMode,
        includeComparison: true,
        save,
        title: `Memory ${algorithm} (${partitionMode})`
      });
      setResult(data.result);
      setComparison(data.comparison);
      setActiveStep(Math.max(0, data.result.steps.length - 1));
      if (save && data.savedRecord) setNotice('Memory simulation saved to history.');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    runSim(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayedBlocks =
    result?.steps?.[activeStep]?.blocksSnapshot || result?.blocks || [];

  const chartData = comparison
    ? {
        labels: comparison.map((c) => c.algorithm.replace('_', ' ')),
        datasets: [
          {
            label: 'Memory Utilization (%)',
            data: comparison.map((c) => c.utilizationPercent),
            backgroundColor: 'rgba(6, 182, 212, 0.8)',
            borderRadius: 6
          },
          {
            label: 'Internal Fragmentation (KB)',
            data: comparison.map((c) => c.internalFragmentation),
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            borderRadius: 6
          }
        ]
      }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MemoryStick}
        title="Memory Management Simulator"
        badge="First Fit • Best Fit • Worst Fit"
        subtitle="Simulate contiguous memory allocation, compare fixed vs variable partitioning, and visualize internal & external fragmentation."
        actions={
          <>
            <button
              onClick={() => {
                setBlocksInput(DEFAULT_BLOCKS);
                setRequestsInput(DEFAULT_REQUESTS);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Textbook Preset
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
        <div className="glass-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Partition & Request Input
          </h2>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Allocation Strategy</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            >
              <option value="FIRST_FIT">First Fit</option>
              <option value="BEST_FIT">Best Fit</option>
              <option value="WORST_FIT">Worst Fit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Partitioning Mode</label>
            <select
              value={partitionMode}
              onChange={(e) => setPartitionMode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            >
              <option value="fixed">Fixed Partitions (Internal Fragmentation)</option>
              <option value="variable">Variable Partitions (Dynamic Splitting)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Memory Block Sizes (KB, comma-separated)
            </label>
            <input
              value={blocksInput}
              onChange={(e) => setBlocksInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Process Request Sizes (KB, comma-separated)
            </label>
            <input
              value={requestsInput}
              onChange={(e) => setRequestsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            />
          </div>

          <button
            onClick={() => runSim(false)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Run Allocation
          </button>
        </div>

        <div className="xl:col-span-2 space-y-6">
          {result && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Allocated"
                  value={`${result.metrics.allocatedCount} / ${result.allocations.length}`}
                  accent="emerald"
                />
                <StatCard
                  label="Utilization"
                  value={`${result.metrics.utilizationPercent}%`}
                  sub={`${result.metrics.usedMemory} / ${result.metrics.totalMemory} KB`}
                  accent="cyan"
                />
                <StatCard
                  label="Internal Frag"
                  value={`${result.metrics.internalFragmentation} KB`}
                  accent="amber"
                />
                <StatCard
                  label="External Frag"
                  value={`${result.metrics.externalFragmentation} KB`}
                  sub={`${result.metrics.failedCount} unallocated`}
                  accent="rose"
                />
              </div>

              {/* Visual Memory Blocks */}
              <div className="glass-panel p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">
                    Physical Memory Block Map
                  </h3>
                  {result.steps.length > 0 && (
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>
                        Step {activeStep + 1}/{result.steps.length}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={result.steps.length - 1}
                        value={activeStep}
                        onChange={(e) => setActiveStep(Number(e.target.value))}
                        className="w-36 accent-cyan-400"
                      />
                    </div>
                  )}
                </div>

                {result.steps[activeStep] && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    {result.steps[activeStep].message}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedBlocks.map((b) => {
                    const usedPct = b.size > 0 ? Math.round((b.allocatedSize / b.size) * 100) : 0;
                    return (
                      <div
                        key={b.id}
                        className={`p-3.5 rounded-xl border ${
                          b.allocatedTo
                            ? 'bg-indigo-950/30 border-indigo-500/40'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-white">{b.id}</span>
                          <span className="text-slate-400">{b.size} KB</span>
                        </div>
                        <div className="w-full h-4 rounded-lg bg-slate-900 overflow-hidden flex border border-slate-800">
                          {b.allocatedTo ? (
                            <>
                              <div
                                style={{ width: `${usedPct}%` }}
                                className="bg-indigo-500 h-full"
                                title={`Used: ${b.allocatedSize} KB`}
                              />
                              {b.internalFragmentation > 0 && (
                                <div
                                  style={{ width: `${100 - usedPct}%` }}
                                  className="bg-amber-500/40 h-full"
                                  title={`Internal Fragmentation: ${b.internalFragmentation} KB`}
                                />
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full bg-emerald-500/15" />
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          {b.allocatedTo ? (
                            <>
                              <span className="text-indigo-300 font-semibold">
                                {b.allocatedTo} ({b.allocatedSize} KB)
                              </span>
                              <span className="text-amber-300">
                                Waste: {b.internalFragmentation} KB
                              </span>
                            </>
                          ) : (
                            <span className="text-emerald-400">Free Block</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Allocation Summary Table */}
              <div className="glass-panel p-5 overflow-x-auto">
                <h3 className="text-sm font-semibold text-white mb-3">Process Allocation Table</h3>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="py-2">Process</th>
                      <th className="py-2">Requested</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Assigned Block</th>
                      <th className="py-2">Internal Fragmentation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {result.allocations.map((a) => (
                      <tr key={a.pid}>
                        <td className="py-2 font-bold text-white">{a.pid}</td>
                        <td className="py-2">{a.requestedSize} KB</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              a.allocated
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {a.allocated ? 'Allocated' : 'Not Allocated'}
                          </span>
                        </td>
                        <td className="py-2">{a.blockId || '—'}</td>
                        <td className="py-2">{a.internalFragmentation} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {chartData && (
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            First Fit vs Best Fit vs Worst Fit Comparison
          </h3>
          <div className="h-72">
            <Bar data={chartData} options={chartDarkOptions} />
          </div>
        </div>
      )}
    </div>
  );
}
