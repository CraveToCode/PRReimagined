import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert, HelpCircle } from 'lucide-react';

export default function BlastRadiusPanel({ 
  activeFile, 
  references, 
  onSelectFileByPath 
}) {
  if (!activeFile) {
    return (
      <div className="bg-white border border-[#E6E0D5] rounded-xl p-4 shadow-sm text-center">
        <p className="text-xs text-[#6B635A]">Select a file in the workspace to inspect its Blast Radius.</p>
      </div>
    ); 
  }

  const fileRefs = references[activeFile.path] || [];

  return (
    <div className="bg-white border border-[#E6E0D5] rounded-xl p-4 shadow-sm h-full flex flex-col">
      <div className="border-b border-[#F1ECE4] pb-3 mb-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#C35832] uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" /> Blast Radius Inspector
        </div>
        <p className="text-[11px] text-[#6B635A] mt-1">
          Analyze cross-file impact and downstream consumers of the active module.
        </p>
      </div>

      {/* Active File Context */}
      <div className="bg-[#FFFDF9] border border-[#E6E0D5] rounded-lg p-3 mb-4">
        <div className="text-[10px] uppercase tracking-wider text-[#6B635A] font-bold">Active File</div>
        <div className="text-xs font-mono font-bold text-[#242220] truncate mt-0.5">{activeFile.path}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] bg-[#FBEFEF] text-[#C35832] px-1.5 py-0.2 rounded font-semibold">
            {activeFile.tier}
          </span>
          <span className="text-[10px] text-[#6B635A]">
            Importance: {activeFile.importance}/100
          </span>
        </div>
      </div>

      {/* Downstream References */}
      <div className="flex-1 overflow-y-auto min-h-[200px]">
        <div className="text-xs font-bold text-[#242220] mb-2 flex items-center justify-between">
          <span>Downstream Consumers</span>
          <span className="text-[10px] bg-[#F1ECE4] text-[#6B635A] px-1.5 py-0.5 rounded-full font-mono">
            {fileRefs.length} references
          </span>
        </div>

        {fileRefs.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#E6E0D5] rounded-lg bg-[#F9F6F0]/50">
            <HelpCircle className="w-6 h-6 text-[#6B635A]/40 mx-auto mb-1" />
            <p className="text-[11px] text-[#6B635A]">No downstream references detected for this file.</p>
          </div>
        ) : ( 
          <div className="space-y-2.5">
            {fileRefs.map((ref, idx) => {
              let riskBadgeColor = "bg-[#FBEFEF] text-[#C35832] border-[#C35832]/20";
              if (ref.risk === "Medium Impact") {
                riskBadgeColor = "bg-[#FFFDF9] text-[#D08A29] border-[#D08A29]/20";
              } else if (ref.risk === "Test" || ref.risk === "Low Impact") {
                riskBadgeColor = "bg-[#F4F8F5] text-[#4F6D56] border-[#4F6D56]/20";
              }

              return (
                <div 
                  key={idx}
                  className="border border-[#E6E0D5] rounded-lg p-2.5 hover:border-[#C35832] transition-all bg-white group"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${riskBadgeColor}`}>
                      {ref.risk}
                    </span>
                    <span className="text-[10px] text-[#6B635A] font-medium">{ref.type}</span>
                  </div>
                  <div className="text-xs font-mono text-[#242220] mt-1.5 truncate">
                    {ref.path}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => onSelectFileByPath(ref.path)}
                      className="text-[10px] text-[#C35832] font-bold flex items-center gap-1 hover:underline opacity-80 group-hover:opacity-100"
                    >
                      Inspect Changes <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Risk Summary */}
      <div className="mt-4 pt-3 border-t border-[#F1ECE4] bg-[#FBEFEF]/40 border-l-4 border-[#C35832] p-2.5 rounded-r-lg">
        <div className="text-[11px] font-bold text-[#C35832] flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> Architectural Risk Warning
        </div>
        <p className="text-[10px] text-[#6B635A] mt-1 leading-relaxed">
          Modifying core modules like <span className="font-mono font-bold">SessionManager.js</span> triggers downstream updates in state providers and network interceptors. Ensure all consumers are verified.
        </p>
      </div>
    </div>
  );
}