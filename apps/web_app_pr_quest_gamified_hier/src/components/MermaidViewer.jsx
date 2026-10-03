import React, { useState } from 'react';
import { Layers, CheckCircle, ExternalLink, Copy } from 'lucide-react';

export default function MermaidViewer({ 
  mermaidCode, 
  onSelectNodeFile,
  onOpenArchModal 
}) {
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'code'
  const [copied, setCopied] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nodes = [
    {
      id: "SM",
      title: "SessionManager",
      tier: "Tier 1: Core Logic",
      path: "src/services/SessionManager.js",
      desc: "Crypto token rotation & localStorage fallback",
      color: "border-[#C35832] bg-[#FBEFEF] text-[#C35832]",
      badge: "Core Engine"
    },
    {
      id: "API",
      title: "ApiClient",
      tier: "Tier 1: Core Logic",
      path: "src/api/ApiClient.js",
      desc: "Axios response interceptor & 401 loop guard",
      color: "border-[#C35832] bg-[#FBEFEF] text-[#C35832]",
      badge: "Interceptor"
    },
    {
      id: "SC",
      title: "SessionProvider",
      tier: "Tier 2: Consumer",
      path: "src/context/SessionContext.jsx",
      desc: "React context with 14-min interval rotation",
      color: "border-[#D08A29] bg-[#FFFDF9] text-[#D08A29]",
      badge: "Context State"
    },
    {
      id: "PR",
      title: "ProtectedRoute",
      tier: "Tier 2: Consumer",
      path: "src/components/ProtectedRoute.jsx",
      desc: "Route guard subscribing to user context",
      color: "border-[#D08A29] bg-[#FFFDF9] text-[#D08A29]",
      badge: "UI Guard"
    }
  ];

  return (
    <div className="bg-white border border-[#E6E0D5] rounded-xl p-4 shadow-sm flex flex-col space-y-3">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-2.5">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#C35832]" />
          <span className="text-xs font-bold text-[#242220] uppercase tracking-wider">
            Architecture Flow
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#F9F6F0] p-0.5 rounded-lg border border-[#E6E0D5]">
          <button
            onClick={() => setViewMode('visual')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              viewMode === 'visual'
                ? 'bg-white text-[#C35832] shadow-2xs font-bold'
                : 'text-[#6B635A] hover:text-[#242220]'
            }`}
          >
            Visual Diagram
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              viewMode === 'code'
                ? 'bg-white text-[#C35832] shadow-2xs font-bold'
                : 'text-[#6B635A] hover:text-[#242220]'
            }`}
          >
            Mermaid Code
          </button>
        </div>
      </div>

      {viewMode === 'visual' ? (
        <div className="space-y-3">
          <p className="text-[11px] text-[#6B635A] leading-relaxed">
            Click any component node to focus its diff in the workspace:
          </p>

          {/* Interactive Visual Node Stack with Directional Connectors */}
          <div className="space-y-2 relative">
            {nodes.map((node, index) => {
              const isSelected = selectedNode === node.id;
              return (
                <div key={node.id} className="relative">
                  <div
                    onClick={() => {
                      setSelectedNode(node.id);
                      if (onSelectNodeFile) onSelectNodeFile(node.path);
                    }}
                    className={`border-2 rounded-lg p-2.5 transition-all cursor-pointer hover:shadow-xs ${node.color} ${
                      isSelected ? 'ring-2 ring-[#C35832] scale-[1.01]' : 'hover:border-opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#242220] flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-[11px] opacity-75">{node.id}:</span>
                        {node.title}
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-white/80 border border-current">
                        {node.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B635A] font-mono mt-0.5 truncate">
                      {node.path}
                    </div>
                    <div className="text-[10px] text-[#242220]/80 mt-1">
                      {node.desc}
                    </div>
                  </div>

                  {/* Flow Arrow to next node */}
                  {index < nodes.length - 1 && (
                    <div className="flex items-center justify-center my-1 text-[#6B635A]/60">
                      <div className="text-[10px] bg-[#F1ECE4] px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1">
                        <span>↓</span>
                        {index === 0 && "Invoked on 401 retry"}
                        {index === 1 && "Provides bearer token to context"}
                        {index === 2 && "Guards auth routing state"}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#F1ECE4] flex items-center justify-between text-[11px]">
            <span className="text-[#6B635A]">Generated from ARCHITECTURE.md</span>
            <button
              onClick={onOpenArchModal}
              className="text-[#C35832] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Edit Arch Map</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#6B635A] tracking-wider">
              Mermaid Syntax
            </span>
            <button
              onClick={handleCopy}
              className="text-[11px] text-[#C35832] font-semibold flex items-center gap-1 hover:underline"
            >
              {copied ? <CheckCircle className="w-3 h-3 text-[#4F6D56]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied!" : "Copy Syntax"}</span>
            </button>
          </div>
          <pre className="bg-[#242220] text-[#E6E0D5] p-3 rounded-lg text-[10px] font-mono overflow-x-auto leading-relaxed max-h-[300px]">
            {mermaidCode}
          </pre>
          <p className="text-[10px] text-[#6B635A]">
            💡 Renders natively in GitHub Markdown diff descriptions and PR summaries.
          </p>
        </div>
      )}
    </div>
  );
}
