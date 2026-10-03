import React from 'react';
import { ToggleLeft, ToggleRight, RotateCcw } from 'lucide-react';

export default function Header({ testFirstMode, setTestFirstMode, onReset, files }) {
  const totalFunctions = files
    .filter(f => !f.isTest)
    .reduce((acc, f) => acc + (f.functions ? f.functions.length : 0), 0);

  const coveredFunctions = files
    .filter(f => !f.isTest)
    .reduce((acc, f) => acc + (f.functions ? f.functions.filter(fn => fn.covered).length : 0), 0);

  const coveragePercent = totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0;

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md z-10">
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white font-bold text-xl shadow-inner">
          🧪
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-100">TDD Reviewer</h1>
            <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-indigo-500/30">
              PR #42
            </span>
          </div>
          <p className="text-xs text-slate-400">Ergonomic "Test-First" Code Review Workspace</p>
        </div>
      </div>

      {/* Test-First Toggle & Stats */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 space-x-4">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Review Mode</div>
            <div className="text-sm font-bold text-slate-200">
              {testFirstMode ? '🧪 Test-First (TDD)' : '📁 Standard File Tree'}
            </div>
          </div>
          <button
            onClick={() => setTestFirstMode(!testFirstMode)}
            className="text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none"
            title="Toggle Test-First Sorting Mode"
          >
            {testFirstMode ? (
              <ToggleRight className="w-10 h-10 text-indigo-500" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-500" />
            )}
          </button>
        </div>

        {/* Coverage Parity Indicator */}
        <div className="flex items-center bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 space-x-3">
          <div>
            <div className="text-xs text-slate-400 font-medium">Coverage Parity</div>
            <div className="text-sm font-bold text-slate-200 flex items-center space-x-1.5">
              <span>{coveredFunctions} / {totalFunctions} Functions</span>
              <span className="text-xs text-indigo-400">({coveragePercent}%)</span>
            </div>
          </div>
          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-500"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/20"
          title="Reset Workspace Data"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}