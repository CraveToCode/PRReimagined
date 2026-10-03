import React, { useState, useEffect } from 'react';
import { mockPRs } from './data/mockData';
import Dashboard from './components/Dashboard';
import JiraSpecPanel from './components/JiraSpecPanel';
import DiffViewer from './components/DiffViewer';
import BlindspotsDrawer from './components/BlindspotsDrawer';

export default function App() {
  const [selectedPrId, setSelectedPrId] = useState('pr-1');
  const [prs, setPrs] = useState(mockPRs);
  const [annotations, setAnnotations] = useState({});

  // Load annotations from localStorage on mount or PR change
  useEffect(() => {
    const saved = localStorage.getItem(`annotations-${selectedPrId}`);
    if (saved) {
      setAnnotations(JSON.parse(saved));
    } else {
      setAnnotations({});
    }
  }, [selectedPrId]);

  const currentPr = prs.find(p => p.id === selectedPrId) || prs[0];

  const handleAnnotate = (itemId, status) => {
    const updated = {
      ...annotations,
      [itemId]: { status, timestamp: new Date().toISOString() }
    };
    setAnnotations(updated);
    localStorage.setItem(`annotations-${selectedPrId}`, JSON.stringify(updated));
  };

  const handleAddCustomBlindspot = (newBlindspot) => {
    const updatedPrs = prs.map(pr => {
      if (pr.id === selectedPrId) {
        return {
          ...pr,
          blindspots: [newBlindspot, ...pr.blindspots]
        };
      }
      return pr;
    });
    setPrs(updatedPrs);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all review annotations for this PR?")) {
      setAnnotations({});
      localStorage.removeItem(`annotations-${selectedPrId}`);
    }
  };

  const handleExport = () => {
    const report = {
      prId: currentPr.id,
      prTitle: currentPr.title,
      exportedAt: new Date().toISOString(),
      annotations: annotations
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-report-${currentPr.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Top Navigation & PR Selector */}
      <header className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Agent AI Proactive Review Co-Pilot</h1>
            <p className="text-xs text-slate-400">Active ambient intelligence for code reviews</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Select Pull Request:</span>
          <select
            value={selectedPrId}
            onChange={(e) => setSelectedPrId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            {prs.map(pr => (
              <option key={pr.id} value={pr.id}>
                {pr.jiraId} - {pr.title}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Dashboard Summary */}
      <Dashboard
        pr={currentPr}
        annotations={annotations}
        onReset={handleReset}
        onExport={handleExport}
      />

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: JIRA Spec Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <JiraSpecPanel pr={currentPr} />
        </div>

        {/* Middle Column: Diff Viewer (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <DiffViewer
            diffs={currentPr.diffs}
            annotations={annotations}
            onAnnotate={handleAnnotate}
          />
        </div>

        {/* Right Column: Ambient Blindspots Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <BlindspotsDrawer
            blindspots={currentPr.blindspots}
            annotations={annotations}
            onAnnotate={handleAnnotate}
            onAddCustomBlindspot={handleAddCustomBlindspot}
          />
        </div>
      </div>
    </div>
  );
}