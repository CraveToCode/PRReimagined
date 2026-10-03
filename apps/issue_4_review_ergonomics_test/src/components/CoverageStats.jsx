import React from 'react';
import { Shield, Plus, CheckCircle2 } from 'lucide-react';

export default function CoverageStats({ files, onGenerateTest, setSelectedFileId, setHighlightedFunction }) {
  const implementationFiles = files.filter(f => !f.isTest);

  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
        <Shield className="w-4 h-4 text-indigo-400" />
        <span>Coverage Parity Assistant</span>
      </h3>

      <div className="space-y-4">
        {implementationFiles.map((file) => {
          const total = file.functions ? file.functions.length : 0;
          const covered = file.functions ? file.functions.filter(f => f.covered).length : 0;
          const percent = total > 0 ? Math.round((covered / total) * 100) : 0;

          return (
            <div key={file.id} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-300 truncate max-w-[180px]" title={file.name}>
                  {file.name}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  percent === 100 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {covered}/{total} covered ({percent}%)
                </span>
              </div>

              {/* Function List & Quick Test Generation */}
              {file.functions && file.functions.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {file.functions.map((fn) => (
                    <div 
                      key={fn.name} 
                      className="flex items-center justify-between text-[11px] bg-slate-950/40 px-2 py-1 rounded border border-slate-800/40"
                    >
                      <button
                        onClick={() => {
                          setSelectedFileId(file.id);
                          setHighlightedFunction(fn.name);
                        }}
                        className="font-mono text-slate-400 hover:text-indigo-400 transition-colors text-left"
                        title="Click to view and highlight function"
                      >
                        {fn.name}()
                      </button>
                      {fn.covered ? (
                        <span className="text-emerald-400 flex items-center space-x-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Covered</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onGenerateTest(file.id, fn.name)}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/30 flex items-center space-x-0.5 transition-all"
                          title="Generate a test case for this function"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Test</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic">No functions detected</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}