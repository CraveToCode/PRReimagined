import React, { useState } from 'react';

export default function DiffViewer({
  diffs,
  annotations,
  onAnnotate
}) {
  const [collapsedRationales, setCollapsedRationales] = useState({});

  const toggleRationale = (diffId) => {
    setCollapsedRationales(prev => ({
      ...prev,
      [diffId]: !prev[diffId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <span>📂 Code Diff & Agent Rationale</span>
          <span className="text-xs font-normal text-slate-400">({diffs.length} files changed)</span>
        </h2>
      </div>

      {diffs.map((diff) => {
        const annotation = annotations[diff.id] || { status: 'pending' };
        const isCollapsed = collapsedRationales[diff.id];

        return (
          <div key={diff.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            {/* File Header */}
            <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-slate-400 text-sm font-mono">{diff.filename}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-emerald-400 font-mono">+{diff.additions}</span>
                <span className="text-rose-400 font-mono">-{diff.deletions}</span>
              </div>
            </div>

            {/* "What the LLM Thinks It Did" Banner (Agent Rationale) */}
            <div className="bg-slate-950 border-b border-slate-800/80">
              <div 
                onClick={() => toggleRationale(diff.id)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">🤖</span>
                  <div>
                    <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Agent Rationale</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isCollapsed ? "Click to expand AI intent & assumptions" : "AI commentary on why this code was written"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Status Badge */}
                  {annotation.status === 'agreed' && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">
                      ✓ Agreed
                    </span>
                  )}
                  {annotation.status === 'flagged' && (
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded border border-rose-500/20">
                      ⚠️ Flagged as Bug
                    </span>
                  )}
                  {annotation.status === 'dismissed' && (
                    <span className="px-2 py-0.5 bg-slate-500/10 text-slate-400 text-[10px] font-bold rounded border border-slate-500/20">
                      Dismissed
                    </span>
                  )}
                  <button className="text-slate-400 hover:text-slate-200">
                    {isCollapsed ? '▼' : '▲'}
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-900/60 space-y-3 bg-slate-950/80">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Intent</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{diff.rationale.intent}</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Assumptions</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{diff.rationale.assumptions}</p>
                    </div>
                  </div>

                  {/* Feedback Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900/60">
                    <span className="text-[11px] text-slate-400">Do you agree with this agent rationale?</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onAnnotate(diff.id, 'agreed')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1 ${
                          annotation.status === 'agreed'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                        }`}
                      >
                        <span>✓</span> <span>Agree</span>
                      </button>
                      <button
                        onClick={() => onAnnotate(diff.id, 'flagged')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1 ${
                          annotation.status === 'flagged'
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                        }`}
                      >
                        <span>⚠️</span> <span>Flag as Bug</span>
                      </button>
                      <button
                        onClick={() => onAnnotate(diff.id, 'dismissed')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1 ${
                          annotation.status === 'dismissed'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-700'
                        }`}
                      >
                        <span>✕</span> <span>Dismiss</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Code Diff Block */}
            <div className="overflow-x-auto font-mono text-xs leading-relaxed bg-slate-950">
              <table className="w-full border-collapse">
                <tbody>
                  {diff.codeLines.map((line, idx) => {
                    let rowBg = 'hover:bg-slate-900/30';
                    let sign = ' ';
                    let textColor = 'text-slate-400';

                    if (line.type === 'addition') {
                      rowBg = 'bg-emerald-950/20 hover:bg-emerald-950/30';
                      sign = '+';
                      textColor = 'text-emerald-300';
                    } else if (line.type === 'deletion') {
                      rowBg = 'bg-rose-950/20 hover:bg-rose-950/30';
                      sign = '-';
                      textColor = 'text-rose-300';
                    }

                    return (
                      <tr key={idx} className={`${rowBg} transition-colors`}>
                        <td className="w-10 text-right select-none pr-3 text-slate-600 border-r border-slate-900 text-[10px] py-0.5">
                          {idx + 1}
                        </td>
                        <td className="w-6 text-center select-none text-slate-500 font-bold text-[11px] py-0.5">
                          {sign}
                        </td>
                        <td className={`pl-4 whitespace-pre py-0.5 ${textColor}`}>
                          {line.text}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}