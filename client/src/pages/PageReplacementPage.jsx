import React, { useState, useEffect } from 'react';
import { Layers, Play, Save, RotateCcw } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, StatCard, AlertBanner, chartDarkOptions } from '../components/CommonUI';

const DEFAULT_REFS = '7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2';
const BELADY_REFS = '1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5';

export default function PageReplacementPage() {
  const { user } = useAuth();
  const [refInput, setRefInput] = useState(DEFAULT_REFS);
  const [frameCount, setFrameCount] = useState(3);
  const [algorithm, setAlgorithm] = useState('FIFO');

  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [selectedStep, setSelectedStep] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const runSim = async (save = false) => {
    setError('');
    setNotice('');
    try {
      const referenceString = refInput
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number);

      const data = await api.simulate('page', {
        referenceString,
        frameCount: Number(frameCount),
        algorithm,
        includeComparison: true,
        save,
        title: `Page ${algorithm} (${frameCount} frames)`
      });
      setResult(data.result);
      setComparison(data.comparison);
      setSelectedStep(data.result.steps.length - 1);
      if (save && data.savedRecord) setNotice('Page replacement run saved.');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    runSim(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = comparison
    ? {
        labels: comparison.map((c) => c.algorithm),
        datasets: [
          {
            label: 'Page Faults',
            data: comparison.map((c) => c.pageFaults),
            backgroundColor: 'rgba(244, 63, 94, 0.8)',
            borderRadius: 6
          },
          {
            label: 'Page Hits',
            data: comparison.map((c) => c.pageHits),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 6
          }
        ]
      }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Layers}
        title="Page Replacement Simulator"
        badge="FIFO • LRU • Optimal"
        subtitle="Trace frame allocations step-by-step, inspect page hits vs faults, and test Belady’s Anomaly."
        actions={
          <>
            <button
              onClick={() => {
                setRefInput(BELADY_REFS);
                setFrameCount(3);
                setAlgorithm('FIFO');
              }}
              className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium"
            >
              Belady’s Anomaly Preset
            </button>
            <button
              onClick={() => {
                setRefInput(DEFAULT_REFS);
                setFrameCount(3);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
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

      <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">
            Page Reference String (comma or space separated)
          </label>
          <input
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Algorithm & Frames</label>
          <div className="flex gap-2">
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            >
              <option value="FIFO">FIFO</option>
              <option value="LRU">LRU</option>
              <option value="OPTIMAL">Optimal</option>
            </select>
            <input
              type="number"
              min={1}
              max={10}
              value={frameCount}
              onChange={(e) => setFrameCount(e.target.value)}
              className="w-20 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            />
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
            <StatCard label="Total References" value={result.metrics.totalReferences} accent="indigo" />
            <StatCard label="Page Faults" value={result.metrics.pageFaults} accent="rose" />
            <StatCard label="Page Hits" value={result.metrics.pageHits} accent="emerald" />
            <StatCard
              label="Hit / Fault Rate"
              value={`${result.metrics.hitRate}% / ${result.metrics.faultRate}%`}
              accent="cyan"
            />
          </div>

          <div className="glass-panel p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">
                Frame Allocation Matrix ({result.algorithm})
              </h3>
              <span className="text-xs text-slate-400">Click any column to inspect the eviction decision</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-slate-400 border-b border-slate-800">Ref</th>
                    {result.steps.map((s, idx) => (
                      <th
                        key={s.step}
                        onClick={() => setSelectedStep(idx)}
                        className={`p-2 border-b border-slate-800 cursor-pointer transition ${
                          selectedStep === idx ? 'bg-indigo-600/30 text-white rounded-t-lg' : 'text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        {s.page}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: result.frameCount }).map((_, fIdx) => (
                    <tr key={fIdx}>
                      <td className="p-2 text-left text-slate-400 font-medium border-b border-slate-800/60">
                        Frame {fIdx + 1}
                      </td>
                      {result.steps.map((s, idx) => (
                        <td
                          key={`${s.step}-${fIdx}`}
                          onClick={() => setSelectedStep(idx)}
                          className={`p-2 border-b border-slate-800/60 cursor-pointer font-semibold ${
                            selectedStep === idx ? 'bg-indigo-600/15' : ''
                          }`}
                        >
                          {s.frames[fIdx] !== null ? (
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${
                                s.frames[fIdx] === s.page && s.fault
                                  ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40'
                                  : s.frames[fIdx] === s.page && s.hit
                                  ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-200'
                              }`}
                            >
                              {s.frames[fIdx]}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-2 text-left text-slate-400 font-medium">Status</td>
                    {result.steps.map((s) => (
                      <td key={`status-${s.step}`} className="p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            s.hit
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {s.hit ? 'HIT' : 'FAULT'}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {result.steps[selectedStep] && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
                <strong className="text-indigo-300">Step {result.steps[selectedStep].step}:</strong>{' '}
                {result.steps[selectedStep].explanation}
              </div>
            )}
          </div>
        </>
      )}

      {chartData && (
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            FIFO vs LRU vs Optimal Comparison
          </h3>
          <div className="h-72">
            <Bar data={chartData} options={chartDarkOptions} />
          </div>
        </div>
      )}
    </div>
  );
}
