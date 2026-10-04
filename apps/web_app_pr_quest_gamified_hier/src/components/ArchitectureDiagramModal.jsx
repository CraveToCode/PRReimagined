import React, { useMemo, useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  MousePointer,
  BookOpen
} from 'lucide-react';
import { buildArchitectureDiagram } from '../utils/buildArchitectureDiagram';
import {
  baselineArchitectureMermaid,
  proposedArchitectureMermaid,
  diffArchitectureMermaid
} from '../mockData';

const DEMO_NODE_DETAILS = {
  SM: {
    name: "SessionManager.js",
    badge: "+ NEW CORE ENGINE",
    badgeColor: "bg-[#EBF7EE] text-[#2D6A4F] border-[#2D6A4F]/30",
    summary: "Handles AES token storage and calls /api/auth/rotate for refresh tokens.",
    path: "src/services/SessionManager.js"
  },
  API: {
    name: "ApiClient.js",
    badge: "~ MODIFIED 401 INTERCEPTOR",
    badgeColor: "bg-[#FFF8E7] text-[#B45309] border-[#B45309]/30",
    summary: "Catches 401s, sets idempotent _retry guard, and triggers rotateSessionToken().",
    path: "src/api/ApiClient.js"
  },
  SC: {
    name: "SessionContext.jsx",
    badge: "~ MODIFIED BACKGROUND TIMER",
    badgeColor: "bg-[#FFF8E7] text-[#B45309] border-[#B45309]/30",
    summary: "Proactive 14-min interval rotation timer cleaned up on unmount.",
    path: "src/context/SessionContext.jsx"
  },
  PR: {
    name: "ProtectedRoute.jsx",
    badge: "= UNCHANGED ROUTE GUARD",
    badgeColor: "bg-[#F3F4F6] text-[#4B5563] border-[#4B5563]/30",
    summary: "Reads user state from SessionContext to guard routes.",
    path: "src/components/ProtectedRoute.jsx"
  },
  AUTH: {
    name: "Auth Server (/api/auth/rotate)",
    badge: "= EXTERNAL API",
    badgeColor: "bg-[#F3F4F6] text-[#4B5563] border-[#4B5563]/30",
    summary: "Exchanges valid refresh token for fresh JWT access token.",
    path: null
  },
  REST: {
    name: "Protected REST APIs",
    badge: "= EXTERNAL TARGET",
    badgeColor: "bg-[#F3F4F6] text-[#4B5563] border-[#4B5563]/30",
    summary: "Receives replayed requests with Bearer authorization header.",
    path: null
  },
  KILL: {
    name: "Hard /login Kill (Old)",
    badge: "- DEPRECATED FLOW",
    badgeColor: "bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/30",
    summary: "Old destructive flow where any 401 instantly logged the user out.",
    path: null
  }
};

function edgeStroke(kind) {
  if (kind === 'added') return { stroke: '#2D6A4F', marker: 'url(#arrow-green)' };
  if (kind === 'removed') return { stroke: '#DC2626', marker: 'url(#arrow-red)' };
  if (kind === 'unchanged') return { stroke: '#6B7280', marker: 'url(#arrow-gray)' };
  return { stroke: '#D97706', marker: 'url(#arrow-amber)' };
}

function DynamicSketch({ nodes, edges, selectedNode, setSelectedNode }) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const maxBottom = nodes.reduce((m, n) => Math.max(m, (n.y || 0) + (n.h || 78)), 0);
  const height = Math.max(360, maxBottom + 48);

  return (
    <svg viewBox={`0 0 820 ${height}`} className="w-full h-auto drop-shadow-xs">
      <defs>
        <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#2D6A4F" />
        </marker>
        <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
        </marker>
        <marker id="arrow-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#6B7280" />
        </marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
        </marker>
      </defs>

      {edges.map((e, idx) => {
        const a = byId[e.from];
        const b = byId[e.to];
        if (!a || !b) return null;
        const x1 = a.x + a.w / 2;
        const y1 = a.y + a.h / 2;
        const x2 = b.x + b.w / 2;
        const y2 = b.y + b.h / 2;
        const style = edgeStroke(e.kind);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return (
          <g key={`e-${idx}`}>
            <path
              d={`M ${x1} ${y1} L ${x2} ${y2}`}
              stroke={style.stroke}
              strokeWidth="2"
              fill="none"
              markerEnd={style.marker}
              strokeDasharray={e.kind === 'removed' ? '5,5' : undefined}
            />
            <rect x={mx - 28} y={my - 9} width="56" height="16" rx="4" fill="#FFFFFF" stroke={style.stroke} strokeWidth="1" />
            <text x={mx} y={my + 3} textAnchor="middle" fontSize="9" fontWeight="bold" fill={style.stroke}>
              {e.label}
            </text>
          </g>
        );
      })}

      {nodes.map((n) => {
        const selected = selectedNode === n.id;
        return (
          <g key={n.id} onClick={() => setSelectedNode(n.id)} className="cursor-pointer">
            <rect x={n.x + 3} y={n.y + 3} width={n.w} height={n.h} rx="12" fill="#E6E0D5" opacity="0.55" />
            <rect
              x={n.x}
              y={n.y}
              width={n.w}
              height={n.h}
              rx="12"
              fill={n.fill}
              stroke={selected ? '#C35832' : n.stroke}
              strokeWidth={selected ? 3.5 : 2.5}
              strokeDasharray={n.kind === 'removed' ? '5,5' : undefined}
            />
            <rect x={n.x + n.w - 88} y={n.y + 8} width="78" height="16" rx="5" fill={n.stroke} />
            <text x={n.x + n.w - 49} y={n.y + 19} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF">
              {n.badge}
            </text>
            <text x={n.x + 14} y={n.y + 36} fontSize="13" fontWeight="800" fill="#242220">
              {n.name.length > 22 ? `${n.name.slice(0, 20)}…` : n.name}
            </text>
            <text x={n.x + 14} y={n.y + 54} fontSize="10" fontWeight="600" fill="#6B635A">
              {n.tier}
            </text>
            <text x={n.x + 14} y={n.y + 68} fontSize="9" fontStyle="italic" fill="#6B635A">
              {(n.summary || '').slice(0, 34)}
            </text>
          </g>
        );
      })}

      {nodes.length === 0 && (
        <text x="410" y="180" textAnchor="middle" fontSize="13" fill="#6B635A">
          No architecture nodes derived yet — open Repo Docs or load a PR with file changes.
        </text>
      )}
    </svg>
  );
}

function DemoSketch({ activeTab, selectedNode, setSelectedNode }) {
  // Keep the original hardcoded SessionManager sketch for local demo queries
  return (
    <svg viewBox="0 0 820 440" className="w-full h-auto drop-shadow-xs">
      <defs>
        <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#2D6A4F" />
        </marker>
        <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
        </marker>
        <marker id="arrow-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#6B7280" />
        </marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
        </marker>
      </defs>

      {(activeTab === 'sketch' || activeTab === 'proposed') && (
        <g>
          <path d="M 410 75 L 410 150" stroke="#2D6A4F" strokeWidth="2.5" markerEnd="url(#arrow-green)" fill="none" />
          <rect x="345" y="100" width="130" height="22" rx="6" fill="#EBF7EE" stroke="#2D6A4F" strokeWidth="1" />
          <text x="410" y="115" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1B4332">POST /api/auth/rotate</text>
        </g>
      )}
      {(activeTab === 'sketch' || activeTab === 'proposed') && (
        <g>
          <path d="M 230 195 C 270 195, 270 195, 305 195" stroke="#D97706" strokeWidth="2.5" markerEnd="url(#arrow-amber)" fill="none" />
          <rect x="235" y="165" width="70" height="20" rx="5" fill="#FFF8E7" stroke="#D97706" strokeWidth="1" />
          <text x="270" y="179" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400E">14m timer</text>
        </g>
      )}
      {(activeTab === 'sketch' || activeTab === 'proposed') && (
        <g>
          <path d="M 590 195 C 550 195, 550 195, 515 195" stroke="#D97706" strokeWidth="2.5" markerEnd="url(#arrow-amber)" fill="none" />
          <rect x="520" y="165" width="65" height="20" rx="5" fill="#FFF8E7" stroke="#D97706" strokeWidth="1" />
          <text x="552" y="179" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400E">401 retry</text>
        </g>
      )}
      <g>
        <path d="M 125 315 L 125 240" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrow-gray)" fill="none" />
        <rect x="75" y="265" width="100" height="20" rx="5" fill="#F3F4F6" stroke="#6B7280" strokeWidth="1" />
        <text x="125" y="279" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#374151">reads user context</text>
      </g>
      <g>
        <path d="M 695 240 L 695 315" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrow-gray)" fill="none" />
        <rect x="650" y="265" width="90" height="20" rx="5" fill="#F3F4F6" stroke="#6B7280" strokeWidth="1" />
        <text x="695" y="279" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#374151">Bearer JWT</text>
      </g>
      {(activeTab === 'sketch' || activeTab === 'baseline') && (
        <g>
          <path d="M 600 240 L 490 315" stroke="#DC2626" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrow-red)" fill="none" />
          <rect x="495" y="265" width="95" height="20" rx="5" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1" />
          <text x="542" y="279" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#991B1B">
            {activeTab === 'sketch' ? '❌ hard logout' : 'hard logout'}
          </text>
        </g>
      )}
      {activeTab === 'baseline' && (
        <g>
          <path d="M 230 195 L 590 195" stroke="#6B7280" strokeWidth="2" strokeDasharray="4,4" markerEnd="url(#arrow-gray)" fill="none" />
          <rect x="365" y="185" width="90" height="20" rx="5" fill="#F3F4F6" stroke="#6B7280" strokeWidth="1" />
          <text x="410" y="199" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#374151">static token</text>
        </g>
      )}

      <g onClick={() => setSelectedNode('AUTH')} className="cursor-pointer">
        <rect x="310" y="20" width="200" height="55" rx="10" fill="#FFFFFF" stroke={selectedNode === 'AUTH' ? '#C35832' : '#6B7280'} strokeWidth={selectedNode === 'AUTH' ? '3' : '2'} />
        <text x="410" y="44" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1F2937">Auth Server</text>
        <text x="410" y="60" textAnchor="middle" fontSize="10" fill="#6B7280">/api/auth/rotate</text>
      </g>

      {(activeTab === 'sketch' || activeTab === 'proposed') && (
        <g onClick={() => setSelectedNode('SM')} className="cursor-pointer">
          <rect x="314" y="154" width="192" height="82" rx="12" fill="#E6E0D5" opacity="0.6" />
          <rect x="310" y="150" width="200" height="85" rx="12" fill="#EBF7EE" stroke={selectedNode === 'SM' ? '#1B4332' : '#2D6A4F'} strokeWidth={selectedNode === 'SM' ? '3.5' : '2.5'} />
          <rect x="420" y="158" width="80" height="18" rx="5" fill="#2D6A4F" />
          <text x="460" y="171" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF">+ NEW NODE</text>
          <text x="325" y="180" fontSize="14" fontWeight="800" fill="#1B4332">SessionManager</text>
          <text x="325" y="198" fontSize="10.5" fontWeight="600" fill="#2D6A4F">AES Key Storage & Rotation</text>
          <text x="325" y="218" fontSize="9.5" fontStyle="italic" fill="#52796F">localStorage fallback cache</text>
        </g>
      )}

      <g onClick={() => setSelectedNode('SC')} className="cursor-pointer">
        <rect x="24" y="154" width="202" height="82" rx="12" fill="#E6E0D5" opacity="0.6" />
        <rect x="20" y="150" width="210" height="85" rx="12" fill={activeTab === 'baseline' ? '#FFFFFF' : '#FFF8E7'} stroke={selectedNode === 'SC' ? '#78350F' : activeTab === 'baseline' ? '#6B7280' : '#D97706'} strokeWidth={selectedNode === 'SC' ? '3.5' : '2.5'} />
        {activeTab !== 'baseline' && (
          <>
            <rect x="140" y="158" width="80" height="18" rx="5" fill="#D97706" />
            <text x="180" y="171" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF">~ MODIFIED</text>
          </>
        )}
        <text x="35" y="180" fontSize="14" fontWeight="800" fill="#78350F">SessionProvider</text>
        <text x="35" y="198" fontSize="10.5" fontWeight="600" fill="#92400E">React User Context</text>
        <text x="35" y="218" fontSize="9.5" fontStyle="italic" fill="#B45309">
          {activeTab === 'baseline' ? 'Passive localStorage read' : '14m proactive interval timer'}
        </text>
      </g>

      <g onClick={() => setSelectedNode('API')} className="cursor-pointer">
        <rect x="594" y="154" width="202" height="82" rx="12" fill="#E6E0D5" opacity="0.6" />
        <rect x="590" y="150" width="210" height="85" rx="12" fill={activeTab === 'baseline' ? '#FFFFFF' : '#FFF8E7'} stroke={selectedNode === 'API' ? '#78350F' : activeTab === 'baseline' ? '#6B7280' : '#D97706'} strokeWidth={selectedNode === 'API' ? '3.5' : '2.5'} />
        {activeTab !== 'baseline' && (
          <>
            <rect x="710" y="158" width="80" height="18" rx="5" fill="#D97706" />
            <text x="750" y="171" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFFFFF">~ MODIFIED</text>
          </>
        )}
        <text x="605" y="180" fontSize="14" fontWeight="800" fill="#78350F">ApiClient</text>
        <text x="605" y="198" fontSize="10.5" fontWeight="600" fill="#92400E">Axios HTTP Client</text>
        <text x="605" y="218" fontSize="9.5" fontStyle="italic" fill="#B45309">
          {activeTab === 'baseline' ? 'No retry logic' : '401 interceptor & _retry guard'}
        </text>
      </g>

      <g onClick={() => setSelectedNode('PR')} className="cursor-pointer">
        <rect x="25" y="320" width="200" height="60" rx="10" fill="#FFFFFF" stroke={selectedNode === 'PR' ? '#C35832' : '#6B7280'} strokeWidth={selectedNode === 'PR' ? '3' : '2'} />
        <text x="125" y="345" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1F2937">ProtectedRoute.jsx</text>
        <text x="125" y="362" textAnchor="middle" fontSize="10" fill="#6B7280">Route guard checking auth state</text>
      </g>

      <g onClick={() => setSelectedNode('REST')} className="cursor-pointer">
        <rect x="595" y="320" width="200" height="60" rx="10" fill="#FFFFFF" stroke={selectedNode === 'REST' ? '#C35832' : '#6B7280'} strokeWidth={selectedNode === 'REST' ? '3' : '2'} />
        <text x="695" y="345" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1F2937">Protected REST APIs</text>
        <text x="695" y="362" textAnchor="middle" fontSize="10" fill="#6B7280">Backend business endpoints</text>
      </g>

      {(activeTab === 'sketch' || activeTab === 'baseline') && (
        <g onClick={() => setSelectedNode('KILL')} className="cursor-pointer">
          <rect x="375" y="320" width="170" height="60" rx="10" fill="#FEE2E2" stroke="#DC2626" strokeWidth="2" strokeDasharray="5,5" />
          <text x="460" y="345" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#991B1B">
            {activeTab === 'sketch' ? '❌ /login Eviction' : '/login Eviction'}
          </text>
          <text x="460" y="362" textAnchor="middle" fontSize="9.5" fill="#DC2626">
            {activeTab === 'sketch' ? 'Deprecated hard logout' : 'Immediate session kill'}
          </text>
        </g>
      )}
    </svg>
  );
}

export default function ArchitectureDiagramModal({
  isOpen,
  onClose,
  onSelectNodeFile,
  files = [],
  architectureText = '',
  repoDocs = [],
  jiraTicket = null,
  currentQueryTitle = '',
  baselineMermaid = baselineArchitectureMermaid,
  proposedMermaid = proposedArchitectureMermaid,
  diffMermaid = diffArchitectureMermaid
}) {
  const [activeTab, setActiveTab] = useState('sketch');
  const [selectedNode, setSelectedNode] = useState(null);
  const [copied, setCopied] = useState(false);

  const diagram = useMemo(
    () => buildArchitectureDiagram({
      files,
      architectureText,
      repoDocs,
      title: currentQueryTitle || jiraTicket?.title || 'Architecture'
    }),
    [files, architectureText, repoDocs, currentQueryTitle, jiraTicket]
  );

  const isDynamic = diagram.mode === 'dynamic';

  if (!isOpen) return null;

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeNodeInfo = isDynamic
    ? (diagram.nodes.find((n) => n.id === selectedNode) || diagram.nodes[0] || {
        name: 'Select a node',
        badge: 'ARCH',
        badgeColor: 'bg-[#F1ECE4] text-[#6B635A] border-[#E6E0D5]',
        summary: diagram.sourceDoc
          ? `Derived from ${diagram.sourceDoc} + PR file changes`
          : 'Derived from PR file changes',
        path: null
      })
    : (DEMO_NODE_DETAILS[selectedNode] || DEMO_NODE_DETAILS.SM);

  const mermaidCode = isDynamic
    ? (diagram.mermaid || proposedMermaid)
    : (activeTab === 'baseline'
      ? baselineMermaid
      : (diffMermaid || proposedMermaid));

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FDFCFB] border border-[#E6E0D5] rounded-2xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E6E0D5] bg-white">
          <div className="flex items-center gap-3">
            <span className="text-xl">📐</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#242220] tracking-tight">
                  Architecture Diagram
                </h2>
                <span className="text-[10px] font-mono uppercase font-bold bg-[#EBF7EE] text-[#2D6A4F] px-2 py-0.5 rounded border border-[#2D6A4F]/20">
                  {isDynamic
                    ? (diagram.hasContextNodes ? 'Product Arch + Delta' : 'PR Delta Sketch')
                    : 'Excalidraw Sketch'}
                </span>
                {diagram.sourceDoc && (
                  <span className="text-[10px] font-mono font-bold bg-[#F9F6F0] text-[#6B635A] px-2 py-0.5 rounded border border-[#E6E0D5] flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {diagram.sourceDoc}
                    {diagram.changedInPr && (
                      <span className="text-[#D08A29]">· edited in PR</span>
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B635A]">
                {isDynamic
                  ? (diagram.hasContextNodes
                    ? 'Product architecture from docs, with this PR’s changed files highlighted'
                    : 'PR changed files (no product modules parsed from architecture docs)')
                  : 'Visual net diff: Green = Added, Amber = Modified, Red = Removed'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#F9F6F0] p-1 rounded-xl border border-[#E6E0D5]">
              <button
                onClick={() => setActiveTab('sketch')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sketch'
                    ? 'bg-[#C35832] text-white shadow-2xs'
                    : 'text-[#6B635A] hover:text-[#242220]'
                }`}
              >
                Excalidraw Diff
              </button>
              {!isDynamic && (
                <>
                  <button
                    onClick={() => setActiveTab('proposed')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'proposed'
                        ? 'bg-[#C35832] text-white shadow-2xs'
                        : 'text-[#6B635A] hover:text-[#242220]'
                    }`}
                  >
                    Proposed Flow
                  </button>
                  <button
                    onClick={() => setActiveTab('baseline')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'baseline'
                        ? 'bg-[#C35832] text-white shadow-2xs'
                        : 'text-[#6B635A] hover:text-[#242220]'
                    }`}
                  >
                    Baseline Flow
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-[#C35832] text-white shadow-2xs'
                    : 'text-[#6B635A] hover:text-[#242220]'
                }`}
              >
                Mermaid Code
              </button>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 text-[#6B635A] hover:text-[#242220] rounded-lg hover:bg-[#F9F6F0] transition-colors ml-2 cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#FDFCFB] flex flex-col justify-center items-center relative select-none">
          {activeTab !== 'code' ? (
            <div className="w-full max-w-4xl bg-white border-2 border-[#E6E0D5] rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div 
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage: `radial-gradient(#D5CEC5 1.2px, transparent 1.2px)`,
                  backgroundSize: '24px 24px'
                }}
              />

              <div className="relative z-10 flex items-center justify-between text-xs text-[#6B635A] pb-2 border-b border-[#F1ECE4] mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3 font-medium flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#EBF7EE] border border-[#2D6A4F]"></span>
                    <strong className="text-[#2D6A4F]">+ New</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#FFF8E7] border border-[#D97706]"></span>
                    <strong className="text-[#D97706]">~ Modified</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#FEE2E2] border border-dashed border-[#DC2626]"></span>
                    <strong className="text-[#DC2626]">- Removed</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#F3F4F6] border border-[#6B7280]"></span>
                    <span className="text-[#4B5563]">
                      {diagram.hasContextNodes ? '= Product modules (left)' : '= Unchanged'}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#6B635A]">
                  <MousePointer className="w-3 h-3" />
                  <span>Click any card to inspect & jump to code</span>
                </div>
              </div>

              {isDynamic && diagram.hasContextNodes && (
                <div className="relative z-10 mb-3 text-[11px] text-[#6B635A] bg-[#F9F6F0] border border-[#E6E0D5] rounded-lg px-3 py-1.5">
                  Left = product architecture modules inferred from docs · Right = files changed in this PR
                </div>
              )}

              {isDynamic && diagram.docComponents.length > 0 && (
                <div className="relative z-10 mb-3 flex flex-wrap gap-1.5">
                  {diagram.docComponents.slice(0, 8).map((name) => (
                    <span
                      key={name}
                      className="text-[10px] font-semibold bg-[#F9F6F0] text-[#6B635A] border border-[#E6E0D5] px-2 py-0.5 rounded"
                      title="Product module from architecture docs"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}

              <div className="relative z-10">
                {isDynamic ? (
                  <DynamicSketch
                    nodes={diagram.nodes}
                    edges={diagram.edges}
                    selectedNode={selectedNode || diagram.nodes[0]?.id}
                    setSelectedNode={setSelectedNode}
                  />
                ) : (
                  <DemoSketch
                    activeTab={activeTab}
                    selectedNode={selectedNode || 'SM'}
                    setSelectedNode={setSelectedNode}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl bg-white border border-[#E6E0D5] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-2">
                <span className="text-xs font-bold text-[#242220]">
                  Mermaid Diagram Syntax
                  {isDynamic && diagram.sourceDoc ? ` · from ${diagram.sourceDoc}` : ''}
                </span>
                <button
                  onClick={() => handleCopy(mermaidCode)}
                  className="px-3 py-1 bg-[#F9F6F0] hover:bg-[#E6E0D5] text-[#242220] text-xs font-bold rounded-lg border border-[#E6E0D5] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-[#4F6D56]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Syntax"}</span>
                </button>
              </div>
              <pre className="bg-[#1E1E1E] text-[#D4D4D4] p-4 rounded-xl text-xs font-mono leading-relaxed overflow-x-auto max-h-[360px]">
                {mermaidCode}
              </pre>
            </div>
          )}

          <div className="w-full max-w-4xl mt-3 bg-white border border-[#E6E0D5] rounded-xl px-4 py-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${activeNodeInfo.badgeColor}`}>
                {activeNodeInfo.badge}
              </span>
              <span className="text-xs font-extrabold text-[#242220] truncate">
                {activeNodeInfo.name}
              </span>
              <span className="text-xs text-[#6B635A] hidden md:inline truncate">
                • {activeNodeInfo.summary}
              </span>
            </div>

            {activeNodeInfo.path ? (
              <button
                onClick={() => {
                  if (onSelectNodeFile) {
                    onSelectNodeFile(activeNodeInfo.path);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-[#C35832] hover:bg-[#A84725] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-2xs self-end sm:self-center"
              >
                <span>Jump to File Diff</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[11px] text-[#6B635A] italic">
                {isDynamic
                  ? (activeNodeInfo.kind === 'unchanged' ? 'Product architecture module' : 'No linked file')
                  : 'External system'}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-2.5 border-t border-[#E6E0D5] bg-white flex items-center justify-between text-xs text-[#6B635A]">
          <span className="truncate">
            {currentQueryTitle || jiraTicket?.title || (isDynamic ? 'PR architecture from head docs' : 'PR #PROJ-402: Token Rotation & LocalStorage Fallback')}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#242220] hover:bg-[#3D3A36] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
