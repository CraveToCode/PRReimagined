import React from 'react';
import { Beaker, FileCode, Sparkles } from 'lucide-react';

export default function DiffViewer({
  file,
  highlightedFunction,
  setHighlightedFunction,
  activeTestCase,
  onTestCaseClick,
  setSelectedFileId
}) {
  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
        <FileCode className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-sm">Select a file from the explorer to view diff</p>
      </div>
    );
  }

  const lines = file.content.split('\n');

  // Find line range for highlighted function
  let highlightRange = null;
  if (highlightedFunction && !file.isTest && file.functions) {
    const fnMeta = file.functions.find(f => f.name === highlightedFunction);
    if (fnMeta) {
      highlightRange = { start: fnMeta.lineStart, end: fnMeta.lineEnd };
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* File Header Info */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          {file.isTest ? (
            <Beaker className="w-4 h-4 text-emerald-400" />
          ) : (
            <FileCode className="w-4 h-4 text-indigo-400" />
          )}
          <span className="font-mono text-xs text-slate-300">{file.path}</span>
        </div>

        {/* Quick Jump for Implementation Files */}
        {!file.isTest && file.functions && file.functions.length > 0 && (
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500">Jump to:</span>
            <div className="flex flex-wrap gap-1">
              {file.functions.map(fn => (
                <button
                  key={fn.name}
                  onClick={() => setHighlightedFunction(fn.name)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                    highlightedFunction === fn.name
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {fn.name}()
                </button>
              ))}
            </div>
          </div>
        )}

        {highlightedFunction && (
          <div className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="text-[11px] text-indigo-300 font-mono">
              Highlighting function: <strong className="text-white">{highlightedFunction}()</strong>
            </span>
            {file.pairedWith && (
              <button
                onClick={() => {
                  setSelectedFileId(file.pairedWith);
                  setHighlightedFunction(null);
                }}
                className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 transition-all ml-2"
              >
                ← Back to Test
              </button>
            )}
            <button 
              onClick={() => setHighlightedFunction(null)}
              className="text-slate-400 hover:text-white text-xs ml-1 font-bold"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Main Code & Test Case Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Lines */}
        <div className="flex-1 overflow-y-auto font-mono text-xs p-4 bg-slate-950/40 select-text">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const isHighlighted = highlightRange && lineNum >= highlightRange.start && lineNum <= highlightRange.end;
                
                return (
                  <tr 
                    key={idx} 
                    className={`group transition-colors ${
                      isHighlighted 
                        ? 'bg-indigo-500/10 border-l-4 border-indigo-500' 
                        : 'hover:bg-slate-900/30 border-l-4 border-transparent'
                    }`}
                  >
                    <td className="w-10 text-right pr-4 text-slate-600 select-none text-[10px] border-r border-slate-800/50">
                      {lineNum}
                    </td>
                    <td className="pl-4 whitespace-pre text-slate-300 py-0.5">
                      {line}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Interactive Test Cases Panel (Only shown for Test Files) */}
        {file.isTest && file.testCases && (
          <div className="w-80 border-l border-slate-800 bg-slate-900/40 p-4 flex flex-col overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <span>🧪 Test Assertions</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full">
                {file.testCases.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Click any test assertion below to instantly jump to and highlight the corresponding implementation function.
            </p>

            <div className="space-y-2">
              {file.testCases.map((tc) => (
                <button
                  key={tc.id}
                  onClick={() => onTestCaseClick(tc)}
                  className="w-full text-left p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all group flex flex-col space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {tc.name}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1 rounded border border-emerald-500/20 font-mono">
                      PASS
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Targets: <strong className="font-mono text-slate-400">{tc.targets}()</strong></span>
                    <span className="text-indigo-400 group-hover:underline">Trace →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}