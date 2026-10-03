import React from 'react';

export default function Dashboard({
  pr,
  annotations,
  onReset,
  onExport
}) {
  // Calculate stats
  const totalItems = pr.diffs.length + pr.blindspots.length;
  const annotatedItems = Object.values(annotations).filter(a => a.status !== 'pending');
  const agreedCount = annotatedItems.filter(a => a.status === 'agreed').length;
  const flaggedCount = annotatedItems.filter(a => a.status === 'flagged').length;
  const dismissedCount = annotatedItems.filter(a => a.status === 'dismissed').length;

  // Calculate health score (0 to 100)
  // High bugs reduce health score significantly. Agreed items increase it.
  const baseScore = 100;
  const bugPenalty = flaggedCount * 20;
  const healthScore = Math.max(0, Math.min(100, baseScore - bugPenalty));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚀</span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
                Proactive Review Co-Pilot
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Active PR: <span className="text-brand-400 font-mono">{pr.title}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 max-w-2xl">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Health Score</span>
            <span className={`text-lg font-extrabold ${healthScore > 70 ? 'text-emerald-400' : healthScore > 40 ? 'text-amber-400' : 'text-rose-400'}`}>
              {healthScore}%
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Agreed</span>
            <span className="text-lg font-extrabold text-emerald-400">
              {agreedCount}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Flagged Bugs</span>
            <span className="text-lg font-extrabold text-rose-400">
              {flaggedCount}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dismissed</span>
            <span className="text-lg font-extrabold text-slate-400">
              {dismissedCount}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onExport}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-brand-600/10"
          >
            Export Report
          </button>
          <button
            onClick={onReset}
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}