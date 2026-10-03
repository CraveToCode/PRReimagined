import React from 'react';

export default function JiraSpecPanel({ pr }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded border border-blue-500/20">
            {pr.jiraId}
          </span>
          <h2 className="text-lg font-bold text-slate-100">JIRA Requirements</h2>
        </div>
        <span className="text-xs text-slate-400 flex items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
          Active Spec
        </span>
      </div>

      <h3 className="text-sm font-semibold text-slate-300 mb-2">{pr.jiraTitle}</h3>
      
      <div className="space-y-3 mt-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Acceptance Criteria (AC)</p>
        <ul className="space-y-2.5">
          {pr.jiraSpecs.map((spec, index) => (
            <li key={index} className="flex items-start space-x-2.5 text-sm text-slate-300">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-400 font-mono">
                {index + 1}
              </span>
              <span className="leading-relaxed">{spec}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-800/60">
        <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/50">
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold mb-1">
            <span>💡 Pro-Tip for Reviewers</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Compare these criteria directly with the <strong>Agent Rationale</strong> and <strong>Blindspots</strong> on the right to catch discrepancies before merging.
          </p>
        </div>
      </div>
    </div>
  );
}