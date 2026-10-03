import React from 'react';
import { Zap, Award, RotateCcw } from 'lucide-react';

export const Header = ({ xp, totalXp, level, onReset }) => {
  const progressPercent = Math.min(100, Math.round((xp / totalXp) * 100));

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-inner text-white">
          <Zap className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Blast Radius Quest Center</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
              Level {level}
            </span>
          </div>
          <p className="text-xs text-slate-400">Transforming passive file lists into interactive dependency verification quests</p>
        </div>
      </div>

      <div className="flex items-center gap-6 w-full md:w-auto justify-end">
        {/* XP & Progress */}
        <div className="flex flex-col items-end min-w-[200px]">
          <div className="flex items-center justify-between w-full text-xs mb-1 font-medium">
            <span className="text-slate-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Verification XP
            </span>
            <span className="text-indigo-300 font-bold">{xp} / {totalXp} XP</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          onClick={onReset}
          title="Reset Quest Progress"
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition flex items-center gap-2 text-xs font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
