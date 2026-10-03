import React from 'react';
import { FileCode, ChevronRight, CheckCircle2 } from 'lucide-react';

export const FileList = ({ files, selectedFileId, onSelectFile }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-indigo-400" /> Modified Source Files
        </h2>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
          {files.length} active
        </span>
      </div>

      <div className="space-y-2">
        {files.map((file) => {
          const verifiedCount = file.consumers.filter(c => c.verified).length;
          const totalCount = file.consumers.length;
          const isComplete = verifiedCount === totalCount;
          const isSelected = file.id === selectedFileId;

          return (
            <button
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 border flex items-center justify-between group ${
                isSelected 
                  ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-500/5'
                  : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-2 rounded-lg mt-0.5 ${
                  isComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-indigo-400'
                }`}>
                  {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200 truncate group-hover:text-white">
                      {file.name}
                    </span>
                    {isComplete && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{file.path}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span>{totalCount} downstream consumer{totalCount !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span className="text-amber-400/90 font-medium">+{file.xpReward} XP</span>
                  </div>
                </div>
              </div>

              <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'translate-x-1 text-indigo-400' : 'group-hover:translate-x-0.5'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
