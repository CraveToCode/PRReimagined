import React, { useState } from 'react';
import { 
  Layers, 
  X, 
  GitCommit, 
  ArrowRight, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  PlusCircle, 
  RefreshCw, 
  MinusCircle, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle 
} from 'lucide-react';

export default function ArchitectureDiagramModal({
  isOpen,
  onClose,
  onSelectNodeFile,
  netChanges,
  baselineMermaid,
  proposedMermaid,
  diffMermaid,
  onAddXp
}) {
  const [activeTab, setActiveTab] = useState('diff'); // 'diff' | 'proposed' | 'baseline' | 'code'
  const [selectedNodeId, setSelectedNodeId] = useState('SM');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nodes = [
    {
      id: "SM",
      title: "SessionManager",
      tier: "Tier 1: Core Logic",
      path: "src/services/SessionManager.js",
      diffStatus: "added",
      badge: "+ ADDED IN PR",
      color: "border-[#4F6D56] bg-[#F4F8F5] text-[#242220]",
      badgeColor: "bg-[#4F6D56] text-white",
      desc: "Crypto token rotation engine & AES localStorage fallback cache.",
      archRole: "Acts as single source of truth for access & refresh tokens. Exposes rotateSessionToken().",
      rationale: "Decouples credential lifecycle from React UI rendering and Axios networking."
    },
    {
      id: "API",
      title: "ApiClient",
      tier: "Tier 1: Core Logic",
      path: "src/api/ApiClient.js",
      diffStatus: "modified",
      badge: "~ MODIFIED FLOW",
      color: "border-[#D08A29] bg-[#FFFDF9] text-[#242220]",
      badgeColor: "bg-[#D08A29] text-white",
      desc: "Axios response interceptor catching 401s with _retry guard flag.",
      archRole: "Intercepts unauthorized 401 responses, asks SessionManager for a new token, then seamlessly replays queued HTTP requests.",
      rationale: "Replaces destructive hard logout with self-healing token refresh loop."
    },
    {
      id: "SC",
      title: "SessionProvider",
      tier: "Tier 2: Consumer",
      path: "src/context/SessionContext.jsx",
      diffStatus: "modified",
      badge: "~ MODIFIED FLOW",
      color: "border-[#D08A29] bg-[#FFFDF9] text-[#242220]",
      badgeColor: "bg-[#D08A29] text-white",
      desc: "React Context managing auth state with 14-min interval rotation timer.",
      archRole: "Proactively triggers token rotation every 14 minutes before 15m JWT TTL expires. Cleaned up on unmount.",
      rationale: "Prevents token expiration during active user sessions before user makes network calls."
    },
    {
      id: "PR",
      title: "ProtectedRoute",
      tier: "Tier 2: Consumer",
      path: "src/components/ProtectedRoute.jsx",
      diffStatus: "unchanged",
      badge: "= UNCHANGED",
      color: "border-[#E6E0D5] bg-[#F9F6F0] text-[#242220]",
      badgeColor: "bg-[#6B635A] text-white",
      desc: "Route guard subscribing to user context.",
      archRole: "Checks isAuthenticated boolean before rendering protected subtrees; redirects to /login if unauthenticated.",
      rationale: "Consumer contract remains stable. No breaking change to routing architecture."
    },
    {
      id: "API_SRV",
      title: "Auth Server (/api/auth/rotate)",
      tier: "External Backend",
      path: "POST /api/auth/rotate",
      diffStatus: "unchanged",
      badge: "= UNCHANGED",
      color: "border-[#E6E0D5] bg-[#F9F6F0] text-[#6B635A]",
      badgeColor: "bg-[#6B635A] text-white",
      desc: "Authoritative authentication server validating refresh tokens.",
      archRole: "Exchanges valid refresh token for fresh JWT access token and rolling refresh token.",
      rationale: "Standard OAuth2/JWT token rotation contract."
    }
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E6E0D5] rounded-2xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-[#F1ECE4] bg-white gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#C35832] text-white p-2.5 rounded-xl shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#242220] tracking-tight">
                  System Architecture & Diagrammatical Diff
                </h2>
                <span className="text-[11px] font-bold bg-[#F4F8F5] text-[#4F6D56] px-2 py-0.5 rounded border border-[#4F6D56]/20">
                  Visual Net Diff
                </span>
              </div>
              <p className="text-xs text-[#6B635A] mt-0.5">
                Compare baseline vs proposed topology and audit the exact diagrammatical changes introduced by PR #PROJ-402
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button 
              onClick={onClose}
              className="p-1.5 text-[#6B635A] hover:text-[#242220] rounded-lg hover:bg-[#F9F6F0] transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="px-6 py-2.5 bg-[#FFFDF9] border-b border-[#E6E0D5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-[#F9F6F0] p-1 rounded-xl border border-[#E6E0D5]">
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'diff'
                  ? 'bg-[#C35832] text-white shadow-xs'
                  : 'text-[#6B635A] hover:text-[#242220]'
              }`}
            >
              <span>🎨 Net Changes (Diff View)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                activeTab === 'diff' ? 'bg-white/20 text-white' : 'bg-[#E6E0D5] text-[#242220]'
              }`}>
                Recommended
              </span>
            </button>

            <button
              onClick={() => setActiveTab('proposed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'proposed'
                  ? 'bg-[#C35832] text-white shadow-xs'
                  : 'text-[#6B635A] hover:text-[#242220]'
              }`}
            >
              <span>🏛️ Proposed Architecture (After PR)</span>
            </button>

            <button
              onClick={() => setActiveTab('baseline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'baseline'
                  ? 'bg-[#C35832] text-white shadow-xs'
                  : 'text-[#6B635A] hover:text-[#242220]'
              }`}
            >
              <span>🕰️ Baseline Architecture (Before PR)</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-[#C35832] text-white shadow-xs'
                  : 'text-[#6B635A] hover:text-[#242220]'
              }`}
            >
              <span>📝 Mermaid Syntax Diff</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#6B635A]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F6D56]"></span> Added
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D08A29]"></span> Modified Flow
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A84725]"></span> Deprecated Flow
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6B635A]"></span> Baseline
            </span>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9F6F0]">
          {/* Net Change Summary Ribbon */}
          {activeTab === 'diff' && (
            <div className="bg-white border border-[#E6E0D5] rounded-xl p-4 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#F1ECE4]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#C35832]">
                      Architectural Net Impact
                    </span>
                    <span className="text-[10px] bg-[#F4F8F5] text-[#4F6D56] font-bold px-2 py-0.5 rounded border border-[#4F6D56]/20">
                      Non-Breaking Enhancements
                    </span>
                  </div>
                  <p className="text-xs text-[#242220] font-medium mt-1 leading-relaxed">
                    {netChanges?.summary || "Introduces an autonomous token rotation lifecycle with localStorage fallback, replacing hard 401 session terminations with self-healing request retries and proactive 14-minute background refreshes."}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  <div className="bg-[#F4F8F5] border border-[#4F6D56]/30 rounded-lg px-2.5 py-1 text-center">
                    <div className="text-xs font-extrabold text-[#4F6D56]">+1 Node</div>
                    <div className="text-[9px] text-[#6B635A]">Core Module</div>
                  </div>
                  <div className="bg-[#F4F8F5] border border-[#4F6D56]/30 rounded-lg px-2.5 py-1 text-center">
                    <div className="text-xs font-extrabold text-[#4F6D56]">+2 Edges</div>
                    <div className="text-[9px] text-[#6B635A]">New Flows</div>
                  </div>
                  <div className="bg-[#FFFDF9] border border-[#D08A29]/30 rounded-lg px-2.5 py-1 text-center">
                    <div className="text-xs font-extrabold text-[#D08A29]">~2 Nodes</div>
                    <div className="text-[9px] text-[#6B635A]">Modified Logic</div>
                  </div>
                  <div className="bg-[#FBEFEF] border border-[#C35832]/30 rounded-lg px-2.5 py-1 text-center">
                    <div className="text-xs font-extrabold text-[#C35832]">-1 Flow</div>
                    <div className="text-[9px] text-[#6B635A]">Hard Logout</div>
                  </div>
                </div>
              </div>

              {/* Quick Callout Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
                <div className="bg-[#F4F8F5] border border-[#4F6D56]/20 rounded-lg p-2.5 text-xs">
                  <div className="font-bold text-[#4F6D56] flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5" /> 1. New Core Engine
                  </div>
                  <p className="text-[11px] text-[#6B635A] mt-0.5 leading-snug">
                    <span className="font-mono font-semibold text-[#242220]">SessionManager.js</span> introduced to isolate AES key storage from React state.
                  </p>
                </div>
                <div className="bg-[#FFFDF9] border border-[#D08A29]/20 rounded-lg p-2.5 text-xs">
                  <div className="font-bold text-[#D08A29] flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> 2. 401 Interceptor Loop
                  </div>
                  <p className="text-[11px] text-[#6B635A] mt-0.5 leading-snug">
                    <span className="font-mono font-semibold text-[#242220]">ApiClient.js</span> guards failed requests with <code className="bg-white px-1 rounded">_retry</code> and queries renewal.
                  </p>
                </div>
                <div className="bg-[#F4F8F5] border border-[#4F6D56]/20 rounded-lg p-2.5 text-xs">
                  <div className="font-bold text-[#4F6D56] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> 3. 14-Min Proactive Refresh
                  </div>
                  <p className="text-[11px] text-[#6B635A] mt-0.5 leading-snug">
                    <span className="font-mono font-semibold text-[#242220]">SessionContext.jsx</span> polls before 15m token expiration with timer cleanup.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Diagram Canvas & Interactive Inspector */}
          {(activeTab === 'diff' || activeTab === 'proposed' || activeTab === 'baseline') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left/Center: Visual Topology Diagram */}
              <div className="lg:col-span-8 bg-white border border-[#E6E0D5] rounded-xl p-5 shadow-xs flex flex-col">
                <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#242220] uppercase tracking-wider">
                      {activeTab === 'diff' && "Interactive Net Diagrammatical Diff"}
                      {activeTab === 'proposed' && "Proposed Architecture Topology (After PR)"}
                      {activeTab === 'baseline' && "Baseline Architecture Topology (Before PR)"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B635A]">
                    Click any node to inspect architectural contract
                  </span>
                </div>

                {/* Flowchart Diagram Canvas */}
                {activeTab === 'diff' && (
                  <div className="space-y-4 py-2">
                    {/* Top Tier: External Auth Server */}
                    <div className="flex justify-center">
                      <div 
                        onClick={() => setSelectedNodeId("API_SRV")}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-center max-w-xs w-full shadow-2xs ${
                          selectedNodeId === 'API_SRV' ? 'ring-2 ring-[#C35832] scale-[1.02]' : ''
                        } border-[#E6E0D5] bg-[#F9F6F0]`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#6B635A] uppercase tracking-wider">
                          <span>External Service</span>
                          <span className="bg-[#E6E0D5] text-[#242220] px-1.5 py-0.2 rounded font-mono">= UNCHANGED</span>
                        </div>
                        <div className="font-bold text-xs text-[#242220] mt-0.5">Auth Server (/api/auth/rotate)</div>
                        <div className="text-[10px] text-[#6B635A] font-mono mt-0.5">Validates refresh tokens & returns JWT</div>
                      </div>
                    </div>

                    {/* Downward Connector to SessionManager */}
                    <div className="flex items-center justify-center -my-2 text-[#4F6D56]">
                      <div className="bg-[#F4F8F5] border border-[#4F6D56]/40 text-[#4F6D56] text-[10px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs font-bold">
                        <span>↑↓</span>
                        <span>[NEW FLOW] POST /api/auth/rotate token exchange</span>
                      </div>
                    </div>

                    {/* Center Tier 1: Core Engine (SessionManager & ApiClient) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* SessionManager (Added) */}
                      <div 
                        onClick={() => setSelectedNodeId("SM")}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative shadow-sm ${
                          selectedNodeId === 'SM' ? 'ring-3 ring-[#4F6D56] scale-[1.02]' : ''
                        } border-[#4F6D56] bg-[#F4F8F5]`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-[#4F6D56] tracking-wider">
                            Tier 1: Core Logic
                          </span>
                          <span className="text-[10px] font-extrabold bg-[#4F6D56] text-white px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                            + ADDED IN PR
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-[#242220]">
                          SessionManager.js
                        </div>
                        <div className="text-[11px] text-[#4F6D56] font-medium mt-1">
                          AES Crypto Engine & LocalStorage Fallback
                        </div>
                        <div className="text-[10px] text-[#6B635A] font-mono mt-1 bg-white/80 p-1.5 rounded border border-[#4F6D56]/20">
                          rotateSessionToken() • encrypt() • storageSync()
                        </div>
                      </div>

                      {/* ApiClient (Modified) */}
                      <div 
                        onClick={() => setSelectedNodeId("API")}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative shadow-sm ${
                          selectedNodeId === 'API' ? 'ring-3 ring-[#D08A29] scale-[1.02]' : ''
                        } border-[#D08A29] bg-[#FFFDF9]`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-[#D08A29] tracking-wider">
                            Tier 1: Core Logic
                          </span>
                          <span className="text-[10px] font-extrabold bg-[#D08A29] text-white px-2 py-0.5 rounded-full shadow-xs">
                            ~ MODIFIED FLOW
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-[#242220]">
                          ApiClient.js
                        </div>
                        <div className="text-[11px] text-[#D08A29] font-medium mt-1">
                          Axios 401 Interceptor with _retry Guard
                        </div>
                        <div className="text-[10px] text-[#6B635A] font-mono mt-1 bg-white/80 p-1.5 rounded border border-[#D08A29]/20">
                          response.use(err =&gt; retry with new token)
                        </div>
                      </div>
                    </div>

                    {/* Bidirectional Core Renewal Connector */}
                    <div className="flex items-center justify-center -my-1 text-[#D08A29]">
                      <div className="bg-[#FFFDF9] border border-[#D08A29]/40 text-[#D08A29] text-[10px] font-mono px-3 py-0.5 rounded-full flex items-center gap-1 shadow-2xs font-bold">
                        <span>←→</span>
                        <span>[MODIFIED] On 401: ApiClient pauses & invokes SessionManager.rotateSessionToken()</span>
                      </div>
                    </div>

                    {/* Tier 2: Consumer React Context & Protected Route */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* SessionProvider (Modified) */}
                      <div 
                        onClick={() => setSelectedNodeId("SC")}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative shadow-sm ${
                          selectedNodeId === 'SC' ? 'ring-3 ring-[#D08A29] scale-[1.02]' : ''
                        } border-[#D08A29] bg-[#FFFDF9]`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-[#D08A29] tracking-wider">
                            Tier 2: Consumer
                          </span>
                          <span className="text-[10px] font-extrabold bg-[#D08A29] text-white px-2 py-0.5 rounded-full shadow-xs">
                            ~ MODIFIED FLOW
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-[#242220]">
                          SessionContext.jsx
                        </div>
                        <div className="text-[11px] text-[#D08A29] font-medium mt-1">
                          Proactive 14-Min Rotation Poller
                        </div>
                        <div className="text-[10px] text-[#6B635A] font-mono mt-1 bg-white/80 p-1.5 rounded border border-[#D08A29]/20">
                          setInterval(rotateSessionToken, 14m)
                        </div>
                      </div>

                      {/* ProtectedRoute (Unchanged) */}
                      <div 
                        onClick={() => setSelectedNodeId("PR")}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative shadow-xs ${
                          selectedNodeId === 'PR' ? 'ring-3 ring-[#6B635A] scale-[1.02]' : ''
                        } border-[#E6E0D5] bg-[#F9F6F0]`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold text-[#6B635A] tracking-wider">
                            Tier 2: Consumer
                          </span>
                          <span className="text-[10px] font-bold bg-[#E6E0D5] text-[#242220] px-2 py-0.5 rounded-full">
                            = UNCHANGED
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-[#242220]">
                          ProtectedRoute.jsx
                        </div>
                        <div className="text-[11px] text-[#6B635A] font-medium mt-1">
                          Route Guard & Authentication Gateway
                        </div>
                        <div className="text-[10px] text-[#6B635A] font-mono mt-1 bg-white p-1.5 rounded border border-[#E6E0D5]">
                          useContext(SessionContext) =&gt; {`{ user }`}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Deprecated/Eliminated Flow Callout */}
                    <div className="bg-[#FBEFEF] border border-[#C35832]/30 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <MinusCircle className="w-4 h-4 text-[#C35832] flex-shrink-0" />
                        <span className="text-[#C35832] font-semibold">
                          <strong className="font-bold">Eliminated Fragile Flow:</strong> Hard logout redirect to <code className="bg-white px-1 rounded font-mono">/login</code> on transient 401s has been replaced by self-healing token retry!
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C35832] bg-white px-2 py-0.5 rounded border border-[#C35832]/20">
                        DEPRECATED
                      </span>
                    </div>
                  </div>
                )}

                {/* Proposed Architecture Canvas (Clean View) */}
                {activeTab === 'proposed' && (
                  <div className="space-y-4 py-2">
                    <div className="p-3 bg-[#F4F8F5] border border-[#4F6D56]/20 rounded-xl text-xs text-[#4F6D56]">
                      💡 Complete production architecture proposed by PR #PROJ-402 with autonomous token renewal and proactive session preservation.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {nodes.filter(n => n.id !== 'API_SRV').map((node) => (
                        <div 
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            selectedNodeId === node.id ? 'ring-2 ring-[#C35832] shadow-sm' : ''
                          } ${node.color}`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                            <span>{node.tier}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${node.badgeColor}`}>
                              {node.diffStatus === 'added' ? 'New' : node.diffStatus === 'modified' ? 'Modified' : 'Stable'}
                            </span>
                          </div>
                          <div className="text-sm font-extrabold text-[#242220]">{node.title}</div>
                          <div className="text-[11px] text-[#6B635A] font-mono mt-0.5">{node.path}</div>
                          <p className="text-xs text-[#242220] mt-1">{node.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Baseline Architecture Canvas (Legacy View) */}
                {activeTab === 'baseline' && (
                  <div className="space-y-4 py-2">
                    <div className="p-3 bg-[#FFFDF9] border border-[#D08A29]/20 rounded-xl text-xs text-[#D08A29]">
                      ⚠️ <strong>Baseline System Topology (Before PR):</strong> Lacked a central SessionManager. Tokens were read statically from storage, and any 401 response killed the user session immediately.
                    </div>

                    <div className="space-y-3">
                      <div className="p-3.5 bg-white border border-[#E6E0D5] rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-[#242220]">1. ApiClient (Legacy)</div>
                          <div className="text-[11px] text-[#6B635A]">Executed HTTP requests. On 401 error: unconditionally rejected promise and wiped session.</div>
                        </div>
                        <span className="text-[10px] text-[#C35832] bg-[#FBEFEF] px-2 py-0.5 rounded font-bold">Hard Kill on 401</span>
                      </div>

                      <div className="flex justify-center text-[#6B635A] text-xs">↓ Directly bound without retry guard</div>

                      <div className="p-3.5 bg-white border border-[#E6E0D5] rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-[#242220]">2. /login Eviction Branch (Legacy)</div>
                          <div className="text-[11px] text-[#6B635A]">Forced page reload and full user re-authentication on every network token expiration.</div>
                        </div>
                        <span className="text-[10px] text-[#C35832] bg-[#FBEFEF] px-2 py-0.5 rounded font-bold">Session Eviction</span>
                      </div>

                      <div className="flex justify-center text-[#6B635A] text-xs">↓</div>

                      <div className="p-3.5 bg-white border border-[#E6E0D5] rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-[#242220]">3. ProtectedRoute & Context (Legacy)</div>
                          <div className="text-[11px] text-[#6B635A]">Read raw string from localStorage.getItem('token') with zero encryption or rotation.</div>
                        </div>
                        <span className="text-[10px] text-[#6B635A] bg-[#F1ECE4] px-2 py-0.5 rounded font-bold">Static Token</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Component Contract & Net Impact Inspector */}
              <div className="lg:col-span-4 bg-white border border-[#E6E0D5] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3">
                    <span className="text-xs font-bold text-[#6B635A] uppercase tracking-wider">
                      Node Details
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selectedNode.badgeColor}`}>
                      {selectedNode.badge}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-base font-bold text-[#242220]">
                      {selectedNode.title}
                    </h3>
                    <div className="text-[11px] font-mono text-[#C35832] bg-[#FBEFEF] px-2 py-0.5 rounded inline-block mt-1">
                      {selectedNode.path}
                    </div>
                  </div>

                  <div className="space-y-3 mt-4 text-xs">
                    <div>
                      <div className="font-bold text-[#6B635A] uppercase text-[10px] tracking-wider">
                        Architectural Role:
                      </div>
                      <p className="text-[#242220] mt-0.5 leading-relaxed">
                        {selectedNode.archRole}
                      </p>
                    </div>

                    <div>
                      <div className="font-bold text-[#6B635A] uppercase text-[10px] tracking-wider">
                        Design Rationale:
                      </div>
                      <p className="text-[#242220] mt-0.5 leading-relaxed">
                        {selectedNode.rationale}
                      </p>
                    </div>

                    <div className="bg-[#F9F6F0] border border-[#E6E0D5] rounded-lg p-3">
                      <div className="text-[10px] font-bold text-[#6B635A] uppercase tracking-wider mb-1">
                        Impact on Codebase:
                      </div>
                      <p className="text-[11px] text-[#242220] leading-snug">
                        {selectedNode.diffStatus === 'added' && "New standalone service introduced. Clean single responsibility pattern."}
                        {selectedNode.diffStatus === 'modified' && "Idempotency guaranteed via _retry guard to eliminate infinite loops."}
                        {selectedNode.diffStatus === 'unchanged' && "Stable upstream API consumer contract remains intact."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F1ECE4]">
                  {selectedNode.path.startsWith('src/') ? (
                    <button
                      onClick={() => {
                        if (onSelectNodeFile) {
                          onSelectNodeFile(selectedNode.path);
                          onClose();
                        }
                      }}
                      className="w-full py-2.5 bg-[#C35832] hover:bg-[#A84725] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Focus File Diff in Editor</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="text-center text-xs text-[#6B635A] py-2">
                      External endpoint contract
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mermaid Syntax Diff Tab */}
          {activeTab === 'code' && (
            <div className="bg-white border border-[#E6E0D5] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#242220]">
                    Mermaid Diagram Source Code
                  </h3>
                  <p className="text-xs text-[#6B635A] mt-0.5">
                    Copy and paste directly into GitHub PR descriptions, ARCHITECTURE.md, or Notion documentation.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(diffMermaid || proposedMermaid)}
                  className="px-3 py-1.5 bg-[#F9F6F0] hover:bg-[#E6E0D5] text-[#242220] text-xs font-bold rounded-lg border border-[#E6E0D5] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-[#4F6D56]" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied!" : "Copy Mermaid Diff"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-[#4F6D56] mb-1.5 flex items-center gap-1">
                    <span>Proposed Architecture (After PR)</span>
                  </div>
                  <pre className="bg-[#242220] text-[#E6E0D5] p-4 rounded-xl text-xs font-mono leading-relaxed overflow-x-auto max-h-[360px]">
                    {proposedMermaid}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-bold text-[#C35832] mb-1.5 flex items-center gap-1">
                    <span>Baseline Architecture (Before PR)</span>
                  </div>
                  <pre className="bg-[#242220] text-[#E6E0D5] p-4 rounded-xl text-xs font-mono leading-relaxed overflow-x-auto max-h-[360px]">
                    {baselineMermaid}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Itemized Net Architectural Changes List */}
          <div className="bg-white border border-[#E6E0D5] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-2.5">
              <span className="text-xs font-bold text-[#242220] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#4F6D56]" />
                <span>Itemized Net Architectural Changes ({netChanges?.changes?.length || 5} Total)</span>
              </span>
              <span className="text-xs text-[#6B635A]">
                Derived from AST dependency comparison
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(netChanges?.changes || []).map((ch) => (
                <div 
                  key={ch.id} 
                  onClick={() => {
                    if (ch.nodeId) setSelectedNodeId(ch.nodeId);
                  }}
                  className="p-3 rounded-lg border border-[#E6E0D5] hover:border-[#C35832]/40 bg-[#FFFDF9] hover:bg-white transition-all cursor-pointer text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#242220]">{ch.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${ch.badgeColor}`}>
                      {ch.badge}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-[#6B635A] truncate">
                    {ch.target}
                  </div>
                  <p className="text-[11px] text-[#6B635A] leading-snug">
                    {ch.description}
                  </p>
                  <div className="text-[10px] text-[#C35832] font-semibold flex items-center gap-1 pt-1 border-t border-[#F1ECE4]">
                    <span>Impact:</span> {ch.diagrammaticImpact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 border-t border-[#F1ECE4] bg-white flex items-center justify-between">
          <div className="text-xs text-[#6B635A]">
            💡 <span className="font-semibold">Reviewer Insight:</span> The proposed architecture adheres to OAuth2 sliding session security principles.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#242220] hover:bg-[#3D3A36] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close Diagram
          </button>
        </div>
      </div>
    </div>
  );
}
