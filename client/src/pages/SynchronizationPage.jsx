import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Pause, Plus, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader, AlertBanner } from '../components/CommonUI';

const DEFAULT_ACTIONS = [
  'PRODUCE',
  'PRODUCE',
  'CONSUME',
  'PRODUCE',
  'PRODUCE',
  'PRODUCE',
  'PRODUCE',
  'CONSUME',
  'CONSUME'
];

export default function SynchronizationPage() {
  const [tab, setTab] = useState('pc');

  // Producer-Consumer state
  const [bufferSize, setBufferSize] = useState(4);
  const [actions, setActions] = useState(DEFAULT_ACTIONS);
  const [pcResult, setPcResult] = useState(null);
  const [pcStep, setPcStep] = useState(0);
  const [pcPlaying, setPcPlaying] = useState(false);

  // Dining Philosophers state
  const [philosopherCount, setPhilosopherCount] = useState(5);
  const [strategy, setStrategy] = useState('asymmetric');
  const [rounds, setRounds] = useState(6);
  const [dpResult, setDpResult] = useState(null);
  const [dpStep, setDpStep] = useState(0);
  const [dpPlaying, setDpPlaying] = useState(false);

  const [error, setError] = useState('');

  const runProducerConsumer = async (customActions = actions, cap = bufferSize) => {
    setError('');
    try {
      const data = await api.simulate('sync', {
        problem: 'PRODUCER_CONSUMER',
        bufferSize: Number(cap),
        actions: customActions
      });
      setPcResult(data.result);
      setPcStep(0);
      setPcPlaying(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const runDiningPhilosophers = async (strat = strategy, count = philosopherCount) => {
    setError('');
    try {
      const data = await api.simulate('sync', {
        problem: 'DINING_PHILOSOPHERS',
        philosopherCount: Number(count),
        strategy: strat,
        rounds: Number(rounds)
      });
      setDpResult(data.result);
      setDpStep(0);
      setDpPlaying(false);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    runProducerConsumer();
    runDiningPhilosophers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pcPlaying || !pcResult) return undefined;
    const timer = setInterval(() => {
      setPcStep((prev) => {
        if (prev >= pcResult.trace.length - 1) {
          setPcPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [pcPlaying, pcResult]);

  useEffect(() => {
    if (!dpPlaying || !dpResult) return undefined;
    const timer = setInterval(() => {
      setDpStep((prev) => {
        if (prev >= dpResult.trace.length - 1) {
          setDpPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [dpPlaying, dpResult]);

  const activePc = pcResult?.trace?.[pcStep];
  const activeDp = dpResult?.trace?.[dpStep];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={RefreshCw}
        title="Process Synchronization Lab"
        badge="Producer-Consumer • Dining Philosophers"
        subtitle="Animate semaphores on a bounded buffer and visualize Dining Philosophers deadlock vs deadlock-free strategies."
      />

      <AlertBanner type="error" message={error} />

      <div className="flex gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => setTab('pc')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            tab === 'pc' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Producer–Consumer
        </button>
        <button
          onClick={() => setTab('dp')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            tab === 'dp' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Dining Philosophers
        </button>
      </div>

      {tab === 'pc' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Bounded Buffer Controls
            </h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Buffer Capacity (N)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={bufferSize}
                onChange={(e) => setBufferSize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Action Sequence ({actions.length})</span>
                <button
                  onClick={() => setActions(DEFAULT_ACTIONS)}
                  className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {actions.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActions((prev) => prev.filter((_, i) => i !== idx))}
                    title="Click to remove"
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                      act === 'PRODUCE'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {act === 'PRODUCE' ? '+P' : '−C'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActions((prev) => [...prev, 'PRODUCE'])}
                  className="py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium inline-flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Produce
                </button>
                <button
                  onClick={() => setActions((prev) => [...prev, 'CONSUME'])}
                  className="py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-medium inline-flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Consume
                </button>
              </div>
            </div>

            <button
              onClick={() => runProducerConsumer(actions, bufferSize)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Rebuild Simulation
            </button>
          </div>

          <div className="lg:col-span-2 glass-panel p-5 space-y-5">
            {pcResult && activePc && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Step {activePc.step} / {pcResult.trace.length}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{activePc.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (pcStep >= pcResult.trace.length - 1) setPcStep(0);
                        setPcPlaying((p) => !p);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      {pcPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {pcPlaying ? 'Pause' : 'Animate'}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={pcResult.trace.length - 1}
                      value={pcStep}
                      onChange={(e) => {
                        setPcPlaying(false);
                        setPcStep(Number(e.target.value));
                      }}
                      className="w-32 accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Semaphores */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 uppercase">mutex</div>
                    <div className="text-xl font-bold text-indigo-400">{activePc.semaphores.mutex}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 uppercase">empty slots</div>
                    <div className="text-xl font-bold text-amber-400">{activePc.semaphores.empty}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 uppercase">full slots</div>
                    <div className="text-xl font-bold text-emerald-400">{activePc.semaphores.full}</div>
                  </div>
                </div>

                {/* Buffer Slots */}
                <div>
                  <div className="text-xs text-slate-400 mb-2">Shared Bounded Buffer</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Array.from({ length: pcResult.bufferSize }).map((_, idx) => {
                      const item = activePc.buffer[idx];
                      return (
                        <div
                          key={idx}
                          className={`h-16 rounded-xl border flex flex-col items-center justify-center text-xs font-semibold transition ${
                            item
                              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-200'
                              : 'bg-slate-950 border-slate-800 text-slate-600'
                          }`}
                        >
                          <span className="text-[10px] text-slate-500">Slot {idx + 1}</span>
                          <span>{item || 'EMPTY'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trace Log */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {pcResult.trace.map((t, idx) => (
                    <div
                      key={t.step}
                      onClick={() => {
                        setPcPlaying(false);
                        setPcStep(idx);
                      }}
                      className={`p-2.5 rounded-lg text-xs border cursor-pointer flex items-center justify-between ${
                        idx === pcStep
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>
                        #{t.step} [{t.action}] {t.message}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'SUCCESS'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'dp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Dining Philosophers Setup
            </h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Synchronization Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              >
                <option value="naive">Naive (All Pick Left First — Deadlock!)</option>
                <option value="asymmetric">Asymmetric (Deadlock-Free)</option>
                <option value="waiter">Waiter Arbitrator (N−1 Permits — Deadlock-Free)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Philosophers</label>
                <input
                  type="number"
                  min={3}
                  max={8}
                  value={philosopherCount}
                  onChange={(e) => setPhilosopherCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rounds</label>
                <input
                  type="number"
                  min={2}
                  max={15}
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>
            </div>

            <button
              onClick={() => runDiningPhilosophers(strategy, philosopherCount)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Run Table Simulation
            </button>

            {dpResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
                  dpResult.deadlockDetected
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {dpResult.deadlockDetected ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>
                  {dpResult.deadlockDetected
                    ? 'Circular Wait Deadlock detected under Naive strategy!'
                    : 'No deadlock: philosophers take turns eating fairly.'}
                </span>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 glass-panel p-5 space-y-4">
            {dpResult && activeDp && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Round {activeDp.round} ({dpResult.strategy.toUpperCase()})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{activeDp.event}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (dpStep >= dpResult.trace.length - 1) setDpStep(0);
                        setDpPlaying((p) => !p);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      {dpPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {dpPlaying ? 'Pause' : 'Animate'}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={dpResult.trace.length - 1}
                      value={dpStep}
                      onChange={(e) => {
                        setDpPlaying(false);
                        setDpStep(Number(e.target.value));
                      }}
                      className="w-32 accent-indigo-500"
                    />
                  </div>
                </div>

                {/* SVG Round Table */}
                <div className="flex justify-center py-2">
                  <svg viewBox="0 0 340 340" className="w-72 h-72 sm:w-80 sm:h-80">
                    <circle
                      cx="170"
                      cy="170"
                      r="82"
                      fill="#0f172a"
                      stroke="#334155"
                      strokeWidth="3"
                    />
                    <text
                      x="170"
                      y="166"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {activeDp.deadlockDetected ? 'DEADLOCK!' : 'DINING TABLE'}
                    </text>
                    <text x="170" y="184" textAnchor="middle" fill="#64748b" fontSize="10">
                      Round {activeDp.round}
                    </text>

                    {activeDp.states.map((st, i) => {
                      const n = activeDp.states.length;
                      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
                      const px = 170 + 124 * Math.cos(angle);
                      const py = 170 + 124 * Math.sin(angle);

                      const forkAngle = angle + Math.PI / n;
                      const fx = 170 + 70 * Math.cos(forkAngle);
                      const fy = 170 + 70 * Math.sin(forkAngle);
                      const forkOwner = activeDp.forks[i];

                      const color =
                        st === 'EATING'
                          ? '#10b981'
                          : st === 'HUNGRY'
                          ? '#f59e0b'
                          : '#6366f1';

                      return (
                        <g key={i}>
                          <circle
                            cx={fx}
                            cy={fy}
                            r="11"
                            fill={forkOwner === null ? '#1e293b' : '#f43f5e'}
                            stroke="#475569"
                            strokeWidth="1.5"
                          />
                          <text
                            x={fx}
                            y={fy + 3}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="700"
                          >
                            F{i}
                          </text>

                          <circle
                            cx={px}
                            cy={py}
                            r="26"
                            fill={color}
                            fillOpacity="0.22"
                            stroke={color}
                            strokeWidth="2.5"
                          />
                          <text
                            x={px}
                            y={py - 3}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="700"
                          >
                            P{i}
                          </text>
                          <text
                            x={px}
                            y={py + 10}
                            textAnchor="middle"
                            fill="#cbd5e1"
                            fontSize="8"
                          >
                            {st} ({activeDp.eatCounts[i]})
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-500" /> THINKING
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500" /> HUNGRY
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" /> EATING
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500" /> FORK HELD
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
