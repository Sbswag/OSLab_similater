import React, { useState, useEffect } from 'react';
import { History, Trash2, Award, Cpu } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, AlertBanner } from '../components/CommonUI';

export default function HistoryPage({ onOpenAuth }) {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [simRes, quizRes] = await Promise.all([api.getHistory(), api.getQuizAttempts()]);
      setSimulations(simRes.items || []);
      setAttempts(quizRes.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await api.deleteHistory(id);
      setSimulations((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={History}
          title="Saved Simulation & Quiz History"
          subtitle="Sign in with your account to view your saved simulation runs and quiz scores."
        />
        <div className="glass-panel p-8 text-center space-y-4">
          <p className="text-sm text-slate-300">
            You are currently exploring in Guest Mode. Sign in or register to persist simulations
            and track your Learning Mode quiz progress.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
          >
            Sign In / Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={History}
        title="Saved History & Quiz Progress"
        badge={`${simulations.length} Runs • ${attempts.length} Quizzes`}
        subtitle="Review your saved experiments and quiz performance."
      />

      <AlertBanner type="error" message={error} />

      {loading && <div className="glass-panel p-5 text-sm text-slate-400">Loading history...</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Saved Simulation Runs</span>
          </div>

          {simulations.length === 0 ? (
            <p className="text-xs text-slate-400">
              No saved simulations yet. Click "Save Run" inside any simulator module!
            </p>
          ) : (
            <div className="space-y-3">
              {simulations.map((sim) => (
                <div
                  key={sim._id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {sim.title || `${sim.module.toUpperCase()} (${sim.algorithm})`}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[10px] uppercase">
                        {sim.module}
                      </span>
                    </div>
                    <pre className="text-[11px] text-slate-400 mt-1.5 whitespace-pre-wrap font-mono">
                      {JSON.stringify(sim.summary)}
                    </pre>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(sim.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(sim._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Quiz Attempts</span>
          </div>

          {attempts.length === 0 ? (
            <p className="text-xs text-slate-400">
              No quiz attempts recorded yet. Visit Learning & Quizzes to test your knowledge!
            </p>
          ) : (
            <div className="space-y-3">
              {attempts.map((att) => (
                <div
                  key={att._id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white uppercase">{att.module}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(att.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">{att.percentage}%</div>
                    <div className="text-[11px] text-slate-400">
                      {att.score}/{att.total} correct
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
