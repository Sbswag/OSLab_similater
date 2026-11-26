import React, { useState, useEffect } from 'react';
import { ShieldAlert, Play, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, StatCard, AlertBanner } from '../components/CommonUI';

const SAFE_PRESET = {
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2]
  ],
  max: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3]
  ],
  available: [3, 3, 2],
  requestProcess: 1,
  requestVec: [1, 0, 2]
};

const UNSAFE_PRESET = {
  allocation: [
    [2, 1, 0],
    [1, 2, 1],
    [1, 1, 2]
  ],
  max: [
    [5, 3, 2],
    [4, 4, 3],
    [3, 4, 4]
  ],
  available: [0, 1, 0],
  requestProcess: 0,
  requestVec: [0, 0, 0]
};

export default function DeadlockPage() {
  const { user } = useAuth();
  const [allocation, setAllocation] = useState(SAFE_PRESET.allocation);
  const [maxMat, setMaxMat] = useState(SAFE_PRESET.max);
  const [available, setAvailable] = useState(SAFE_PRESET.available);
  const [enableRequest, setEnableRequest] = useState(true);
  const [reqProcess, setReqProcess] = useState(SAFE_PRESET.requestProcess);
  const [reqResources, setReqResources] = useState(SAFE_PRESET.requestVec);

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadPreset = (preset, testReq = false) => {
    setAllocation(preset.allocation.map((r) => [...r]));
    setMaxMat(preset.max.map((r) => [...r]));
    setAvailable([...preset.available]);
    setReqProcess(preset.requestProcess);
    setReqResources([...preset.requestVec]);
    setEnableRequest(testReq);
  };

  const runSim = async (save = false) => {
    setError('');
    setNotice('');
    try {
      const payload = {
        allocation,
        max: maxMat,
        available,
        request: enableRequest
          ? { processIndex: Number(reqProcess), resources: reqResources.map(Number) }
          : null,
        save,
        title: `Banker's Algorithm (${allocation.length}x${available.length})`
      };
      const data = await api.simulate('deadlock', payload);
      setResult(data.result);
      if (save && data.savedRecord) setNotice("Banker's simulation saved to history.");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    runSim(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCell = (setter, r, c, val) => {
    setter((prev) =>
      prev.map((row, rIdx) =>
        rIdx === r ? row.map((cell, cIdx) => (cIdx === c ? Number(val) : cell)) : row
      )
    );
  };

  const resourceLabels = available.map((_, j) => String.fromCharCode(65 + j));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldAlert}
        title="Deadlock Management (Banker's Algorithm)"
        badge="Safety Check • Resource Request"
        subtitle="Inspect Allocation, Max, Available, and Need matrices, trace safe sequences, and test whether a new resource request avoids deadlock."
        actions={
          <>
            <button
              onClick={() => loadPreset(SAFE_PRESET, true)}
              className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
            >
              Safe Preset (5×3)
            </button>
            <button
              onClick={() => loadPreset(UNSAFE_PRESET, false)}
              className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium"
            >
              Unsafe Preset (3×3)
            </button>
            {user && (
              <button
                onClick={() => runSim(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Run
              </button>
            )}
          </>
        }
      />

      <AlertBanner type="error" message={error} />
      <AlertBanner type="success" message={notice} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matrix Editor */}
        <div className="lg:col-span-2 glass-panel p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              System Resource Matrices
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Available:</span>
              {available.map((val, j) => (
                <label key={j} className="inline-flex items-center gap-1">
                  <span className="text-cyan-400 font-bold">{resourceLabels[j]}</span>
                  <input
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e) =>
                      setAvailable((prev) =>
                        prev.map((x, idx) => (idx === j ? Number(e.target.value) : x))
                      )
                    }
                    className="w-12 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-center"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2 text-left">Process</th>
                  <th className="py-2" colSpan={available.length}>
                    Allocation ({resourceLabels.join(' ')})
                  </th>
                  <th className="py-2" colSpan={available.length}>
                    Max ({resourceLabels.join(' ')})
                  </th>
                  <th className="py-2">Need (Max − Alloc)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allocation.map((row, i) => (
                  <tr key={i}>
                    <td className="py-2 text-left font-bold text-indigo-300">P{i}</td>
                    {row.map((val, j) => (
                      <td key={`a-${i}-${j}`} className="py-1.5 px-1">
                        <input
                          type="number"
                          min={0}
                          value={val}
                          onChange={(e) => updateCell(setAllocation, i, j, e.target.value)}
                          className="w-11 px-1.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-center"
                        />
                      </td>
                    ))}
                    {maxMat[i].map((val, j) => (
                      <td key={`m-${i}-${j}`} className="py-1.5 px-1">
                        <input
                          type="number"
                          min={0}
                          value={val}
                          onChange={(e) => updateCell(setMaxMat, i, j, e.target.value)}
                          className="w-11 px-1.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-center"
                        />
                      </td>
                    ))}
                    <td className="py-1.5 font-mono text-amber-300">
                      [{maxMat[i].map((m, j) => m - row[j]).join(', ')}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resource Request Tester */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={enableRequest}
                onChange={(e) => setEnableRequest(e.target.checked)}
              />
              Test Dynamic Resource Request (Resource-Request Algorithm)
            </label>

            {enableRequest && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <select
                  value={reqProcess}
                  onChange={(e) => setReqProcess(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  {allocation.map((_, i) => (
                    <option key={i} value={i}>
                      Process P{i}
                    </option>
                  ))}
                </select>
                <span className="text-slate-400">requests:</span>
                {reqResources.map((val, j) => (
                  <label key={j} className="inline-flex items-center gap-1">
                    <span className="text-cyan-400">{resourceLabels[j]}</span>
                    <input
                      type="number"
                      min={0}
                      value={val}
                      onChange={(e) =>
                        setReqResources((prev) =>
                          prev.map((x, idx) => (idx === j ? Number(e.target.value) : x))
                        )
                      }
                      className="w-12 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-center"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => runSim(false)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Run Safety & Request Check
          </button>
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          {result && (
            <>
              <div
                className={`glass-panel p-5 border-l-4 ${
                  result.isSafe ? 'border-emerald-500' : 'border-rose-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.isSafe ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  )}
                  <h3 className="font-bold text-white">
                    {result.isSafe ? 'System is in a SAFE State' : 'System is UNSAFE (Deadlock Risk)'}
                  </h3>
                </div>
                {result.isSafe ? (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {result.safeSequence.map((p, idx) => (
                      <React.Fragment key={p}>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                          {p}
                        </span>
                        {idx < result.safeSequence.length - 1 && (
                          <span className="text-slate-500">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-rose-300 mt-1">
                    Unfinished processes: {result.unfinished.join(', ')}
                  </p>
                )}
              </div>

              {result.requestResult && (
                <div
                  className={`glass-panel p-4 border-l-4 ${
                    result.requestResult.granted ? 'border-cyan-500' : 'border-amber-500'
                  }`}
                >
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Resource Request Verdict ({result.requestResult.process})
                  </div>
                  <div
                    className={`text-sm font-bold mt-1 ${
                      result.requestResult.granted ? 'text-cyan-300' : 'text-amber-300'
                    }`}
                  >
                    {result.requestResult.granted ? 'REQUEST GRANTED' : 'REQUEST DENIED'}
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5">{result.requestResult.reason}</p>
                </div>
              )}

              <StatCard
                label="Final Work Vector"
                value={`[${result.finalWork.join(', ')}]`}
                sub="Sum of Available + released allocations"
                accent="indigo"
              />
            </>
          )}
        </div>
      </div>

      {/* Step-by-Step Safety Trace */}
      {result && (
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-white mb-3">
            Step-by-Step Safety Algorithm Trace
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {result.steps.map((s, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                  s.passed
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>{s.explanation}</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-[11px] font-mono">
                  {s.passed ? 'EXECUTED' : 'WAITING'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
