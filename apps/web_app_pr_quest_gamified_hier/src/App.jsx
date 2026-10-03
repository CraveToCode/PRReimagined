import React, { useState, useEffect } from 'react';
import {
  initialJiraTicket,
  initialFiles,
  initialReferences,
  defaultArchitecture
} from './mockData';
import QuestHeader from './components/QuestHeader';
import SpecNav from './components/SpecNav';
import HierarchicalDiffViewer from './components/HierarchicalDiffViewer';
import BlastRadiusPanel from './components/BlastRadiusPanel';
import ArchitectureModal from './components/ArchitectureModal';
import { Award, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('pr_quest_level');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem('pr_quest_xp');
    return saved ? parseInt(saved, 10) : 100;
  });

  const [jiraTicket, setJiraTicket] = useState(() => {
    const saved = localStorage.getItem('pr_quest_jira');
    return saved ? JSON.parse(saved) : initialJiraTicket;
  });

  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('pr_quest_files');
    return saved ? JSON.parse(saved) : initialFiles;
  });

  const [references, setReferences] = useState(() => {
    const saved = localStorage.getItem('pr_quest_references');
    return saved ? JSON.parse(saved) : initialReferences;
  });

  const [architectureText, setArchitectureText] = useState(() => {
    const saved = localStorage.getItem('pr_quest_architecture');
    return saved ? saved : defaultArchitecture;
  });

  const [selectedSpec, setSelectedSpec] = useState('ALL');
  const [activeFileId, setActiveFileId] = useState(() => {
    const saved = localStorage.getItem('pr_quest_active_file_id');
    return saved || (initialFiles[0]?.id || null);
  });
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isVerdictOpen, setIsVerdictOpen] = useState(false);
  const [questLogs, setQuestLogs] = useState([]);

  useEffect(() => {
    localStorage.setItem('pr_quest_level', level);
  }, [level]);

  useEffect(() => {
    localStorage.setItem('pr_quest_xp', xp);
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('pr_quest_jira', JSON.stringify(jiraTicket));
  }, [jiraTicket]);

  useEffect(() => {
    localStorage.setItem('pr_quest_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('pr_quest_references', JSON.stringify(references));
  }, [references]);

  useEffect(() => {
    localStorage.setItem('pr_quest_architecture', architectureText);
  }, [architectureText]);

  useEffect(() => {
    if (activeFileId) {
      localStorage.setItem('pr_quest_active_file_id', activeFileId);
    }
  }, [activeFileId]);

  // Automatic Level Up based on XP
  useEffect(() => {
    let targetLevel = 1;
    if (xp >= 500) targetLevel = 4;
    else if (xp >= 300) targetLevel = 3;
    else if (xp >= 150) targetLevel = 2;

    if (targetLevel !== level) {
      setLevel(targetLevel);
      setQuestLogs(prev => [
        { id: Date.now(), text: `🎉 LEVEL UP! Reached Level ${targetLevel}!`, timestamp: new Date().toLocaleTimeString() },
        ...prev
      ].slice(0, 5));
    }
  }, [xp, level]);

  const handleAddXp = (amount, reason) => {
    setXp(prev => prev + amount);
    setQuestLogs(prev => [
      { id: Date.now(), text: `+${amount} XP: ${reason}`, timestamp: new Date().toLocaleTimeString() },
      ...prev
    ].slice(0, 5));
  };

  const handleUpdateFileStatus = (fileId, status) => {
    if (status === 'reset') {
      setSelectedSpec('ALL');
      return;
    }
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status } : f));
  };

  const handleAddComment = (fileId, comment) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return { ...f, comments: [...f.comments, comment] };
      }
      return f;
    }));
  };

  const handleSelectFileByPath = (path) => {
    const found = files.find(f => f.path === path);
    if (found) {
      setActiveFileId(found.id);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset your review quest progress?")) {
      setLevel(1);
      setXp(100);
      setJiraTicket(initialJiraTicket);
      setFiles(initialFiles);
      setReferences(initialReferences);
      setArchitectureText(defaultArchitecture);
      setSelectedSpec('ALL');
      setActiveFileId(initialFiles[0]?.id || null);
      setQuestLogs([]);
      localStorage.clear();
    }
  };

  const activeFile = files.find(f => f.id === activeFileId);
  const reviewedCount = files.filter(f => f.status !== 'pending').length;

  const approvedFiles = files.filter(f => f.status === 'approved');
  const flaggedFiles = files.filter(f => f.status === 'flagged');
  const pendingFiles = files.filter(f => f.status === 'pending');

  return (
    <div className="min-h-screen bg-[#F9F6F0] flex flex-col">
      {/* Header */}
      <QuestHeader 
        level={level} 
        setLevel={setLevel} 
        xp={xp} 
        totalFiles={files.length} 
        reviewedCount={reviewedCount} 
        onReset={handleReset}
        onOpenVerdict={() => setIsVerdictOpen(true)}
        onOpenArch={() => setIsArchOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Mission Control & Spec Navigator */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <SpecNav 
            jiraTicket={jiraTicket} 
            setJiraTicket={setJiraTicket} 
            selectedSpec={selectedSpec} 
            setSelectedSpec={setSelectedSpec} 
            onAddXp={handleAddXp}
          />

          {/* Quest Log / XP Feed */}
          <div className="bg-white border border-[#E6E0D5] rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-[#242220] uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D08A29]" /> Quest Log Feed
            </h3>
            {questLogs.length === 0 ? (
              <p className="text-[11px] text-[#6B635A]">Perform review actions to earn XP and level up!</p>
            ) : (
              <div className="space-y-1.5">
                {questLogs.map(log => (
                  <div key={log.id} className="text-[11px] text-[#4F6D56] bg-[#F4F8F5] px-2 py-1 rounded border border-[#4F6D56]/10 flex justify-between">
                    <span>{log.text}</span>
                    <span className="text-[9px] text-[#6B635A]">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Center Panel: Hierarchical Diff Workspace */}
        <section className="lg:col-span-6">
          <HierarchicalDiffViewer 
            files={files} 
            selectedSpec={selectedSpec} 
            activeFileId={activeFileId} 
            setActiveFileId={setActiveFileId} 
            onUpdateFileStatus={handleUpdateFileStatus} 
            onAddComment={handleAddComment} 
            onAddXp={handleAddXp}
          />
        </section>

        {/* Right Panel: Blast Radius & Reference Graph */}
        <section className="lg:col-span-3">
          <BlastRadiusPanel 
            activeFile={activeFile} 
            references={references} 
            onSelectFileByPath={handleSelectFileByPath} 
          />
        </section>
      </main>

      {/* Architecture Modal */}
      <ArchitectureModal 
        isOpen={isArchOpen} 
        onClose={() => setIsArchOpen(false)} 
        architectureText={architectureText} 
        onSave={setArchitectureText}
        onAddXp={handleAddXp}
      />

      {/* Final Verdict Modal */}
      {isVerdictOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E6E0D5] rounded-xl max-w-lg w-full shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#D08A29]" />
                <h2 className="text-base font-bold text-[#242220]">Submit Final Review Verdict</h2>
              </div>
              <button 
                onClick={() => setIsVerdictOpen(false)}
                className="text-[#6B635A] hover:text-[#242220]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#F4F8F5] border border-[#4F6D56]/20 rounded-lg p-3">
                  <div className="text-lg font-bold text-[#4F6D56]">{approvedFiles.length}</div>
                  <div className="text-[10px] text-[#6B635A] uppercase font-bold">Approved</div>
                </div>
                <div className="bg-[#FBEFEF] border border-[#C35832]/20 rounded-lg p-3">
                  <div className="text-lg font-bold text-[#C35832]">{flaggedFiles.length}</div>
                  <div className="text-[10px] text-[#6B635A] uppercase font-bold">Flagged</div>
                </div>
                <div className="bg-[#FFFDF9] border border-[#D08A29]/20 rounded-lg p-3">
                  <div className="text-lg font-bold text-[#D08A29]">{pendingFiles.length}</div>
                  <div className="text-[10px] text-[#6B635A] uppercase font-bold">Pending</div>
                </div>
              </div>

              {pendingFiles.length > 0 ? (
                <div className="bg-[#FFFDF9] border border-[#D08A29]/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D08A29] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#6B635A] leading-relaxed">
                    You still have <span className="font-bold text-[#242220]">{pendingFiles.length} pending files</span> to review. We recommend reviewing all files before submitting your final verdict.
                  </p>
                </div>
              ) : (
                <div className="bg-[#F4F8F5] border border-[#4F6D56]/20 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4F6D56] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#6B635A] leading-relaxed">
                    Excellent! All files have been reviewed. You are ready to submit your final verdict.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#6B635A] mb-1">
                  Review Summary & Feedback for Agent
                </label>
                <textarea
                  rows="4"
                  className="w-full bg-[#F9F6F0] border border-[#E6E0D5] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#C35832]"
                  placeholder="Provide constructive feedback on architectural alignment, test coverage, and code quality..."
                  defaultValue={`Review completed for ${jiraTicket.id}. Core session management logic looks solid, but please address the fallback storage mechanism in SessionManager.js to ensure production readiness.`}
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#F1ECE4] flex justify-end gap-2">
              <button
                onClick={() => setIsVerdictOpen(false)}
                className="px-4 py-2 bg-white border border-[#E6E0D5] text-xs font-medium rounded-lg hover:bg-[#F9F6F0]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`🎉 Review submitted successfully! You earned a bonus +100 XP!`);
                  handleAddXp(100, "Submitted Final Review Verdict");
                  setIsVerdictOpen(false);
                }}
                className="px-4 py-2 bg-[#C35832] hover:bg-[#A84725] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                Submit Verdict (+100 XP)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}