import React from 'react';
import { Shield, Award, CheckCircle, RefreshCw, ChevronRight } from 'lucide-react';

export default function QuestHeader({ 
  level, 
  setLevel, 
  unlockedLevel = 1,
  xp, 
  totalFiles, 
  reviewedCount, 
  progressPercent = 0,
  onReset, 
  onOpenVerdict,
  onOpenArch,
  onOpenProgress
}) {
  const levels = [
    { num: 1, name: "Spec & Intent Check", desc: "Verify changes map to JIRA criteria" },
    { num: 2, name: "Architectural & Core Logic", desc: "Inspect primary abstractions & state" },
    { num: 3, name: "Blast Radius & Impact", desc: "Validate cross-file dependencies" },
    { num: 4, name: "Tests & Final Verdict", desc: "Review unit tests & submit review" }
  ];

  return (
    <header className="bg-white border-b border-[#E6E0D5] px-6 py-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & XP */}
        <div className="flex items-center gap-3">
          <div className="bg-[#C35832] text-white p-2.5 rounded-lg shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#242220] tracking-tight">PR Quest</h1>
              <span className="text-xs font-semibold bg-[#F1ECE4] text-[#6B635A] px-2 py-0.5 rounded-full border border-[#E6E0D5]">
                v1.0 Agentic Reviewer
              </span>
            </div>
            <p className="text-xs text-[#6B635A] mt-0.5">Gamified Hierarchical Code Review Workspace</p>
          </div>
        </div>

        {/* XP & Progress */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-[#F9F6F0] border border-[#E6E0D5] rounded-lg px-4 py-2 flex items-center gap-3">
            <div className="bg-[#D08A29] text-white p-1.5 rounded-full">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6B635A] font-bold">Total XP Earned</div>
              <div className="text-lg font-extrabold text-[#D08A29] leading-none">{xp} XP</div>
            </div>
          </div>

          <button 
            onClick={onOpenProgress}
            className="bg-[#F9F6F0] hover:bg-[#F1ECE4] border border-[#E6E0D5] hover:border-[#C35832]/50 rounded-lg px-4 py-2 flex items-center gap-3 min-w-[170px] transition-all cursor-pointer text-left group shadow-2xs"
            title="Click to view detailed Review Progress breakdown"
          >
            <div className="w-full">
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-[#6B635A] font-bold mb-1 group-hover:text-[#C35832] transition-colors">
                <span className="flex items-center gap-1">
                  <span>Review Progress</span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="font-extrabold text-[#242220]">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#E6E0D5] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#4F6D56] h-full transition-all duration-500 rounded-full" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenArch}
              className="px-3 py-2 bg-white border border-[#E6E0D5] text-[#242220] hover:bg-[#F9F6F0] rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              📖 Architecture Map
            </button>
            <button
              onClick={onOpenVerdict}
              className="px-4 py-2 bg-[#C35832] hover:bg-[#A84725] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              🏆 Final Verdict
            </button>
            <button
              onClick={onReset}
              title="Reset Quest Progress"
              className="p-2 text-[#6B635A] hover:text-[#C35832] hover:bg-[#F9F6F0] rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Level Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4 pt-4 border-t border-[#F1ECE4]">
        {levels.map((lvl) => {
          const isActive = level === lvl.num;
          const isCompleted = unlockedLevel > lvl.num;
          const isLocked = lvl.num > unlockedLevel;
          return (
            <button
              key={lvl.num}
              onClick={() => {
                if (!isLocked) {
                  setLevel(lvl.num);
                }
              }}
              title={isLocked ? `Complete Level ${lvl.num - 1} milestone to unlock` : `Switch to Level ${lvl.num}`}
              className={`text-left p-2.5 rounded-lg border transition-all ${
                isActive 
                  ? 'bg-[#FFFDF9] border-[#D08A29] shadow-sm ring-2 ring-[#D08A29] cursor-default' 
                  : isCompleted
                    ? 'bg-[#F4F8F5] border-[#4F6D56]/30 text-[#4F6D56] hover:bg-white cursor-pointer'
                    : isLocked
                      ? 'bg-[#F9F6F0]/60 border-[#E6E0D5] opacity-60 cursor-not-allowed'
                      : 'bg-[#F9F6F0] border-[#E6E0D5] hover:bg-white cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isActive ? 'text-[#D08A29]' : isCompleted ? 'text-[#4F6D56]' : 'text-[#6B635A]'
                }`}>
                  Level {lvl.num}
                </span>
                {isCompleted && <CheckCircle className="w-4 h-4 text-[#4F6D56]" />}
                {isLocked && <span className="text-[10px] text-[#6B635A] bg-[#F1ECE4] px-1.5 py-0.5 rounded font-medium">🔒 Locked</span>}
              </div>
              <div className="font-semibold text-sm text-[#242220] mt-0.5 truncate">{lvl.name}</div>
              <div className="text-[11px] text-[#6B635A] truncate mt-0.5">{lvl.desc}</div>
            </button>
          );
        })}
      </div>
    </header>
  );
}