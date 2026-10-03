import React from 'react';
import { SeverityBadge } from './SeverityBadge';
import { CheckSquare, Square, FileText, Code2, AlertCircle } from 'lucide-react';

export const ConsumerQuestCard = ({ consumer, onToggleVerify }) => {
  return (
    <div className={`bg-slate-950/70 border rounded-2xl p-5 transition-all shadow-lg ${
      consumer.verified 
        ? 'border-emerald-500/40 bg-emerald-950/10'
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* Top Meta */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="font-mono font-semibold text-slate-200 text-sm">{consumer.path}</span>
          <span className="text-xs text-slate-500">Line {consumer.lineNumber}</span>
        </div>
        <SeverityBadge severity={consumer.severity} />
      </div>

      {/* Risk Description */}
      <div className="mb-4 text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200 font-semibold">Risk Analysis:</strong> {consumer.riskDescription}
        </div>
      </div>

      {/* Actionable Quest Mission */}
      <div className="mb-4 p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl">
        <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5" /> Actionable Verification Quest
        </div>
        <p className="text-sm text-slate-200 font-medium">{consumer.quest}</p>
      </div>

      {/* Side-by-Side Diff Preview */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Original Call-site */}
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3">
          <div className="text-[11px] font-semibold text-red-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
            <span>Original Call-site</span>
            <span>Line {consumer.lineNumber}</span>
          </div>
          <pre className="font-mono text-xs text-red-200 overflow-x-auto p-2 bg-red-950/40 rounded-lg">
            <code>{consumer.originalCode}</code>
          </pre>
        </div>

        {/* Updated Call-site / Diff */}
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3">
          <div className="text-[11px] font-semibold text-emerald-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
            <span>Expected Consumer State</span>
            <span>Updated</span>
          </div>
          <pre className="font-mono text-xs text-emerald-200 overflow-x-auto p-2 bg-emerald-950/40 rounded-lg">
            <code>{consumer.updatedCode}</code>
          </pre>
        </div>
      </div>

      {/* Verification Checkbox Toggle */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <button
          onClick={() => onToggleVerify(consumer.id)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            consumer.verified
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500'
          }`}
        >
          {consumer.verified ? (
            <CheckSquare className="w-5 h-5 text-emerald-400" />
          ) : (
            <Square className="w-5 h-5 text-slate-400" />
          )}
          <span>{consumer.verified ? 'Interface Contract Verified (+50 XP)' : 'Mark Interface Contract Verified (+50 XP)'}</span>
        </button>

        {consumer.verified && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            ✓ Quest Completed
          </span>
        )}
      </div>
    </div>
  );
};
