import React from 'react';
import { ConsumerQuestCard } from './ConsumerQuestCard';
import { ShieldAlert, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';

export const QuestWorkspace = ({ file, onToggleVerify }) => {
  if (!file) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-xl">
        <div className="p-4 bg-slate-800/50 rounded-2xl text-indigo-400 mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-2">No File Selected</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Select a modified source file from the left panel to inspect downstream impact and perform actionable verification quests.
        </p>
      </div>
    );
  }

  const verifiedCount = file.consumers.filter(c => c.verified).length;
  const totalCount = file.consumers.length;
  const isAllVerified = verifiedCount === totalCount;

  return (
    <div className="space-y-6">
      {/* File Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                Blast Radius Target
              </span>
              <span className="text-xs text-slate-400 font-mono">{file.path}</span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {file.name}
            </h2>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-4 py-2.5 rounded-xl">
            <div className="text-right">
              <div className="text-xs text-slate-400">Quest Progress</div>
              <div className="text-sm font-bold text-indigo-300">{verifiedCount} / {totalCount} Verified</div>
            </div>
            <div className={`p-2 rounded-lg ${
              isAllVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {isAllVerified ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-300 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 mb-4">
          {file.summary}
        </p>

        {isAllVerified && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3 flex items-center gap-3 text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>All downstream consumer quests for <strong>{file.name}</strong> have been successfully verified! Bonus XP unlocked.</span>
          </div>
        )}
      </div>

      {/* Consumers / Quests List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400" /> Downstream Consumer Call-Sites & Quests
          </h3>
          <span className="text-xs text-slate-400">Click checkboxes to verify contracts (+50 XP each)</span>
        </div>

        {file.consumers.map((consumer) => (
          <ConsumerQuestCard
            key={consumer.id}
            consumer={consumer}
            onToggleVerify={onToggleVerify}
          />
        ))}
      </div>
    </div>
  );
};
