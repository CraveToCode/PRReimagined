import React from 'react';
import { Play, Terminal } from 'lucide-react';

export default function TestRunner({ status, logs, onRun, onClear }) {
  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col h-72">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Simulated Test Runner</span>
        </h3>
        <div className="flex items-center space-x-2">
          {logs.length > 0 && (
            <button
              onClick={onClear}
              className="px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            >
              Clear
            </button>
          )}
          <button
            onClick={onRun}
            disabled={status === 'running'}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              status === 'running'
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>{status === 'running' ? 'Running...' : 'Run Tests'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-y-auto border border-slate-800/60 space-y-1">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic flex flex-col items-center justify-center h-full space-y-1">
            <span>No test runs recorded.</span>
            <span className="text-[10px]">Click "Run Tests" to execute Vitest suite.</span>
          </div>
        ) : (
          logs.map((log, idx) => {
            let colorClass = 'text-slate-300';
            if (log.includes('PASS')) colorClass = 'text-emerald-400 font-semibold';
            if (log.includes('RUNS')) colorClass = 'text-amber-400';
            if (log.includes('✓')) colorClass = 'text-emerald-400 font-bold';
            if (log.includes('$')) colorClass = 'text-indigo-400';

            return (
              <div key={idx} className={`whitespace-pre-wrap ${colorClass}`}>
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}