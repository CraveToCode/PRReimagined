import React, { useState, useEffect } from 'react';
import { INITIAL_FILES } from './data/mockFiles';
import { Header } from './components/Header';
import { FileList } from './components/FileList';
import { QuestWorkspace } from './components/QuestWorkspace';
import { Sparkles, HelpCircle } from 'lucide-react';

export function App() {
  // Load saved state or default to initial files
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('blast_radius_files_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse localStorage', e);
      }
    }
    return INITIAL_FILES;
  });

  const [selectedFileId, setSelectedFileId] = useState(() => files[0]?.id || null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Persist files state
  useEffect(() => {
    localStorage.setItem('blast_radius_files_v1', JSON.stringify(files));
  }, [files]);

  // Calculate total XP and User XP
  // Each file has +xpReward, plus each consumer gives +50 XP when verified
  const totalPossibleXp = files.reduce((acc, f) => {
    return acc + f.xpReward + (f.consumers.length * 50);
  }, 0);

  const currentXp = files.reduce((acc, f) => {
    const fileBonus = f.consumers.every(c => c.verified) ? f.xpReward : 0;
    const consumerBonus = f.consumers.filter(c => c.verified).length * 50;
    return acc + fileBonus + consumerBonus;
  }, 0);

  const level = Math.floor(currentXp / 300) + 1;

  // Toggle verification handler
  const handleToggleVerify = (consumerId) => {
    setFiles(prevFiles => {
      return prevFiles.map(file => {
        const updatedConsumers = file.consumers.map(c => {
          if (c.id === consumerId) {
            return { ...c, verified: !c.verified };
          }
          return c;
        });
        return { ...file, consumers: updatedConsumers };
      });
    });

    // Trigger subtle celebratory effect
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all verification quests and XP progress?')) {
      setFiles(INITIAL_FILES);
      setSelectedFileId(INITIAL_FILES[0]?.id || null);
    }
  };

  const selectedFile = files.find(f => f.id === selectedFileId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Header
        xp={currentXp}
        totalXp={totalPossibleXp}
        level={level}
        onReset={handleReset}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: File List */}
        <div className="lg:col-span-4 sticky top-24">
          <FileList
            files={files}
            selectedFileId={selectedFileId}
            onSelectFile={setSelectedFileId}
          />

          {/* Quick Info Box */}
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <HelpCircle className="w-4 h-4" /> What is a Blast Radius Quest?
            </div>
            <p>
              Instead of passive file lists, each modified file presents concrete verification tasks. Inspect side-by-side call-site diffs and verify interface contracts to earn XP and prevent regressions.
            </p>
          </div>
        </div>

        {/* Right Column: Quest Workspace / Split Pane */}
        <div className="lg:col-span-8">
          <QuestWorkspace
            file={selectedFile}
            onToggleVerify={handleToggleVerify}
          />
        </div>
      </main>

      {/* Floating Celebration Toast */}
      {showCelebration && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400/40 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <div>
            <div className="text-xs font-bold">Quest Verified!</div>
            <div className="text-xs text-indigo-200">+50 XP added to your incubator profile.</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
