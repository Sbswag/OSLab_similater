import React, { useState, useEffect } from 'react';
import { BookOpen, HelpCircle, Calculator, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, AlertBanner } from '../components/CommonUI';

export default function LearningModePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('guides');
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');

  // Quiz state
  const [quizModule, setQuizModule] = useState('all');
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  // Practice state
  const [practiceInputs, setPracticeInputs] = useState({});
  const [practiceFeedback, setPracticeFeedback] = useState({});
  const [showHints, setShowHints] = useState({});

  useEffect(() => {
    api
      .getLearningContent()
      .then((data) => setContent(data))
      .catch((err) => setError(err.message));
  }, []);

  const filteredQuizzes =
    content?.quizzes?.filter((q) => quizModule === 'all' || q.module === quizModule) || [];

  const handleQuizSubmit = async () => {
    setError('');
    try {
      const res = await api.submitQuiz({ module: quizModule, answers });
      setQuizResult(res);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePracticeCheck = async (problemId) => {
    setError('');
    try {
      const res = await api.checkPractice({
        problemId,
        answer: practiceInputs[problemId] || ''
      });
      setPracticeFeedback((prev) => ({ ...prev, [problemId]: res }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Learning Mode & Practice Lab"
        badge="Guides • Quizzes • Practice Problems"
        subtitle="Master OS theory with step-by-step algorithm walkthroughs, auto-graded quizzes, and interactive numerical problems."
      />

      <AlertBanner type="error" message={error} />

      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => setTab('guides')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
            tab === 'guides' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Step-by-Step Guides
        </button>
        <button
          onClick={() => setTab('quizzes')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
            tab === 'quizzes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> Interactive Quizzes
        </button>
        <button
          onClick={() => setTab('practice')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
            tab === 'practice' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Practice Problems
        </button>
      </div>

      {!content && !error && (
        <div className="glass-panel p-6 text-sm text-slate-400">Loading learning modules...</div>
      )}

      {/* Guides Tab */}
      {content && tab === 'guides' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {content.modules.map((mod) => (
            <div key={mod.id} className="glass-panel p-5 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">{mod.title}</h2>
                <p className="text-xs text-slate-400 mt-1">{mod.summary}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[11px] font-semibold uppercase text-cyan-400">Key Formulas</div>
                {mod.keyFormulas.map((f, idx) => (
                  <div key={idx} className="text-xs font-mono text-slate-300">
                    • {f}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {mod.algorithms.map((algo) => (
                  <div key={algo.name} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-xs font-bold text-indigo-300 mb-1.5">{algo.name}</div>
                    <ol className="space-y-1 text-xs text-slate-300 list-decimal list-inside">
                      {algo.steps.map((st, idx) => (
                        <li key={idx}>{st}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quizzes Tab */}
      {content && tab === 'quizzes' && (
        <div className="space-y-5">
          <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Filter Module:</span>
              <select
                value={quizModule}
                onChange={(e) => {
                  setQuizModule(e.target.value);
                  setQuizResult(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="all">All Modules ({content.quizzes.length} Questions)</option>
                {content.modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            {user ? (
              <span className="text-xs text-emerald-400">
                Signed in as {user.name}: Quiz scores save automatically
              </span>
            ) : (
              <span className="text-xs text-slate-400">Sign in to save your quiz score history</span>
            )}
          </div>

          {quizResult && (
            <div className="glass-panel p-5 border-l-4 border-indigo-500 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase text-slate-400 font-semibold">Quiz Result</div>
                <div className="text-2xl font-bold text-white mt-0.5">
                  {quizResult.score} / {quizResult.total} ({quizResult.percentage}%)
                </div>
              </div>
              <button
                onClick={() => {
                  setAnswers({});
                  setQuizResult(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
              >
                Retake Quiz
              </button>
            </div>
          )}

          <div className="space-y-4">
            {filteredQuizzes.map((q, idx) => {
              const detail = quizResult?.details?.find((d) => d.questionId === q.id);
              return (
                <div key={q.id} className="glass-panel p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      {idx + 1}. {q.question}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] uppercase text-slate-400 shrink-0">
                      {q.module}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answers[q.id] === optIdx;
                      let optionStyle =
                        'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700';

                      if (detail) {
                        if (optIdx === detail.correctIndex) {
                          optionStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200';
                        } else if (isSelected && !detail.isCorrect) {
                          optionStyle = 'bg-rose-500/15 border-rose-500/40 text-rose-200';
                        }
                      } else if (isSelected) {
                        optionStyle = 'bg-indigo-600/20 border-indigo-500 text-white';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={Boolean(quizResult)}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                          className={`p-3 rounded-xl border text-left text-xs transition ${optionStyle}`}
                        >
                          <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {detail && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start gap-2">
                      {detail.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <span className="text-slate-300">{detail.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!quizResult && filteredQuizzes.length > 0 && (
            <button
              onClick={handleQuizSubmit}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
            >
              Submit & Grade Quiz
            </button>
          )}
        </div>
      )}

      {/* Practice Problems Tab */}
      {content && tab === 'practice' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {content.practiceProblems.map((prob) => {
            const fb = practiceFeedback[prob.id];
            return (
              <div key={prob.id} className="glass-panel p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white">{prob.title}</h3>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[10px] uppercase border border-indigo-500/30">
                    {prob.module}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{prob.prompt}</p>

                <div className="flex gap-2">
                  <input
                    value={practiceInputs[prob.id] || ''}
                    onChange={(e) =>
                      setPracticeInputs((prev) => ({ ...prev, [prob.id]: e.target.value }))
                    }
                    placeholder={`Enter answer (${prob.unit})`}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                  <button
                    onClick={() => handlePracticeCheck(prob.id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    Check
                  </button>
                </div>

                <button
                  onClick={() =>
                    setShowHints((prev) => ({ ...prev, [prob.id]: !prev[prob.id] }))
                  }
                  className="text-xs text-amber-300 hover:underline inline-flex items-center gap-1"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {showHints[prob.id] ? 'Hide Hint' : 'Show Hint'}
                </button>

                {showHints[prob.id] && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                    {prob.hint}
                  </div>
                )}

                {fb && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      fb.isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <div className="font-bold">
                      {fb.isCorrect
                        ? 'Correct!'
                        : `Not quite — Expected Answer: ${fb.expectedAnswer}`}
                    </div>
                    <div className="text-slate-300">{fb.solution}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
