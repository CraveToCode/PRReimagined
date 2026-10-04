import React, { useState, useEffect } from 'react';
import {
  initialJiraTicket,
  initialFiles,
  initialReferences,
  defaultArchitecture,
  initialArchitectureMermaid,
  baselineArchitectureMermaid,
  proposedArchitectureMermaid,
  diffArchitectureMermaid,
  netArchitecturalChanges,
  architectureStandards as initialStandards,
  symbolCatalog as initialSymbolCatalog,
  initialTestSuites
} from './mockData';
import QuestHeader from './components/QuestHeader';
import DynamicLeftPanel from './components/DynamicLeftPanel';
import HierarchicalDiffViewer from './components/HierarchicalDiffViewer';
import FunctionInspectorPanel from './components/FunctionInspectorPanel';
import TestReviewWorkspace from './components/TestReviewWorkspace';
import ArchitectureModal from './components/ArchitectureModal';
import ArchitectureDiagramModal from './components/ArchitectureDiagramModal';
import { Award, CheckCircle, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';

export default function App() {
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('pr_quest_level');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem('pr_quest_xp');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [awardedActions, setAwardedActions] = useState(() => {
    const saved = localStorage.getItem('pr_quest_awarded_actions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pr_quest_awarded_actions', JSON.stringify(awardedActions));
  }, [awardedActions]);

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

  const [standards, setStandards] = useState(() => {
    const saved = localStorage.getItem('pr_quest_standards');
    return saved ? JSON.parse(saved) : initialStandards;
  });

  useEffect(() => {
    localStorage.setItem('pr_quest_standards', JSON.stringify(standards));
  }, [standards]);

  const [activeSymbolKey, setActiveSymbolKey] = useState("rotateSessionToken");

  const [testSuites, setTestSuites] = useState(() => {
    const saved = localStorage.getItem('pr_quest_tests');
    return saved ? JSON.parse(saved) : initialTestSuites;
  });

  useEffect(() => {
    localStorage.setItem('pr_quest_tests', JSON.stringify(testSuites));
  }, [testSuites]);

  const [selectedSpec, setSelectedSpec] = useState('ALL');
  const [activeFileId, setActiveFileId] = useState(() => {
    const saved = localStorage.getItem('pr_quest_active_file_id');
    return saved || (initialFiles[0]?.id || null);
  });
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
  const [isVerdictOpen, setIsVerdictOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
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

  const [unlockedLevel, setUnlockedLevel] = useState(() => {
    const saved = localStorage.getItem('pr_quest_unlocked_level');
    return saved ? parseInt(saved, 10) : 1;
  });

  const levelMissions = {
    1: {
      title: "Level 1: Spec & Intent Alignment",
      action: "Cross-check JIRA acceptance criteria against code changes.",
      tip: "Check AC items on the left as you verify (+25 XP each)."
    },
    2: {
      title: "Level 2: Core Architecture Audit",
      action: "Audit Tier 1 core logic files and standard practices.",
      tip: "Inspect the Excalidraw architecture diagram and review core diffs."
    },
    3: {
      title: "Level 3: Blast Radius & Downstream Verification",
      action: "Examine downstream consumers to ensure call-sites remain unbroken.",
      tip: "Click function signatures in the diff to load implementation side-by-side."
    },
    4: {
      title: "Level 4: Test Suite & Final Verdict",
      action: "Verify test coverage against production logic and submit final review.",
      tip: "Approve tests and submit final verdict (+100 XP)."
    }
  };

  useEffect(() => {
    localStorage.setItem('pr_quest_level', level);
  }, [level]);

  useEffect(() => {
    localStorage.setItem('pr_quest_unlocked_level', unlockedLevel);
  }, [unlockedLevel]);

  // Milestone objective calculations
  const completedAcCount = jiraTicket.criteria.filter(ac => ac.completed).length;
  const totalAcCount = jiraTicket.criteria.length;
  const isLevel1Complete = totalAcCount > 0 && completedAcCount === totalAcCount;

  const tier1Files = files.filter(f => f.tier.includes("Tier 1"));
  const tier1ReviewedCount = tier1Files.filter(f => f.status !== 'pending').length;
  const isLevel2Complete = tier1Files.length > 0 && tier1ReviewedCount === tier1Files.length;

  const tier2Files = files.filter(f => f.tier.includes("Tier 2"));
  const tier2ReviewedCount = tier2Files.filter(f => f.status !== 'pending').length;
  const isLevel3Complete = tier2Files.length > 0 && tier2ReviewedCount === tier2Files.length;

  const tier3Files = files.filter(f => f.tier.includes("Tier 3"));
  const tier3ReviewedCount = tier3Files.filter(f => f.status !== 'pending').length;
  const isVerdictSubmitted = awardedActions.includes('final-verdict-submitted');
  const isLevel4Complete = tier3Files.length > 0 && tier3ReviewedCount === tier3Files.length && isVerdictSubmitted;

  // Comprehensive Review Progress calculation across all 4 stages:
  const l1Prog = totalAcCount > 0 ? (completedAcCount / totalAcCount) * 25 : 0;
  const l2Prog = tier1Files.length > 0 ? (tier1ReviewedCount / tier1Files.length) * 25 : 0;
  const l3Prog = tier2Files.length > 0 ? (tier2ReviewedCount / tier2Files.length) * 25 : 0;
  const l4TestProg = tier3Files.length > 0 ? (tier3ReviewedCount / tier3Files.length) * 15 : 0;
  const l4VerdictProg = isVerdictSubmitted ? 10 : 0;
  const totalProgressPercent = Math.min(100, Math.round(l1Prog + l2Prog + l3Prog + l4TestProg + l4VerdictProg));

  // Sequential Level Unlocking: unlocking happens at milestone completion, but active tab/level NEVER auto-jumps abruptly
  useEffect(() => {
    let eligibleUnlocked = 1;
    if (isLevel1Complete) eligibleUnlocked = 2;
    if (isLevel1Complete && isLevel2Complete) eligibleUnlocked = 3;
    if (isLevel1Complete && isLevel2Complete && isLevel3Complete) eligibleUnlocked = 4;

    if (eligibleUnlocked > unlockedLevel) {
      setUnlockedLevel(eligibleUnlocked);
      handleAddXp(50, `Unlocked Level ${eligibleUnlocked}!`, `unlock-level-${eligibleUnlocked}`);
      setQuestLogs(prev => [
        { id: Date.now(), text: `🎉 LEVEL UNLOCKED! Level ${eligibleUnlocked} is now available!`, timestamp: new Date().toLocaleTimeString() },
        ...prev
      ].slice(0, 5));
    }
  }, [isLevel1Complete, isLevel2Complete, isLevel3Complete, unlockedLevel]);

  const handleAddXp = (amount, reason, actionId = null) => {
    if (actionId) {
      if (awardedActions.includes(actionId)) {
        return false; // Prevent repeated XP farming
      }
      setAwardedActions(prev => [...prev, actionId]);
    }
    setXp(prev => prev + amount);
    setQuestLogs(prev => [
      { id: Date.now() + Math.random(), text: `+${amount} XP: ${reason}`, timestamp: new Date().toLocaleTimeString() },
      ...prev
    ].slice(0, 5));
    return true;
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

  const handleToggleStandard = (id) => {
    setStandards(prev => prev.map(s => {
      if (s.id === id) {
        const nextVal = !s.completed;
        if (nextVal) {
          handleAddXp(25, `Verified Architecture Standard: ${s.id}`, `verify-std-${s.id}`);
        }
        return { ...s, completed: nextVal };
      }
      return s;
    }));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset your review quest progress?")) {
      setLevel(1);
      setUnlockedLevel(1);
      setXp(0);
      setAwardedActions([]);
      setJiraTicket(initialJiraTicket);
      setFiles(initialFiles);
      setReferences(initialReferences);
      setArchitectureText(defaultArchitecture);
      setStandards(initialStandards);
      setTestSuites(initialTestSuites);
      setActiveSymbolKey("rotateSessionToken");
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
        unlockedLevel={unlockedLevel}
        xp={xp} 
        totalFiles={files.length} 
        reviewedCount={reviewedCount} 
        progressPercent={totalProgressPercent}
        onReset={handleReset}
        onOpenVerdict={() => setIsVerdictOpen(true)}
        onOpenArch={() => setIsDiagramModalOpen(true)}
        onOpenProgress={() => setIsProgressOpen(true)}
      />

      {/* Active Mission & Transition Banner */}
      <div className="max-w-7xl w-full mx-auto px-4 lg:px-6 pt-4">
        <div className="bg-white border-l-4 border-[#C35832] border border-[#E6E0D5] rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">
              {level === 1 && (isLevel1Complete ? '🌟' : '🎯')}
              {level === 2 && (isLevel2Complete ? '🌟' : '🏛️')}
              {level === 3 && (isLevel3Complete ? '🌟' : '💥')}
              {level === 4 && (isLevel4Complete ? '🏆' : '🧪')}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#C35832] uppercase tracking-wider">
                  {levelMissions[level]?.title || `Level ${level} Mission`}
                </span>
                <span className="text-[10px] bg-[#F1ECE4] text-[#6B635A] px-2 py-0.5 rounded font-bold">
                  Stage {level}/4
                </span>
                {level === 1 && isLevel1Complete && (
                  <span className="text-[10px] bg-[#F4F8F5] text-[#4F6D56] border border-[#4F6D56]/30 px-2 py-0.5 rounded font-bold">
                    ✓ Level 1 Complete
                  </span>
                )}
                {level === 2 && isLevel2Complete && (
                  <span className="text-[10px] bg-[#F4F8F5] text-[#4F6D56] border border-[#4F6D56]/30 px-2 py-0.5 rounded font-bold">
                    ✓ Level 2 Complete
                  </span>
                )}
                {level === 3 && isLevel3Complete && (
                  <span className="text-[10px] bg-[#F4F8F5] text-[#4F6D56] border border-[#4F6D56]/30 px-2 py-0.5 rounded font-bold">
                    ✓ Level 3 Complete
                  </span>
                )}
                {level === 4 && isLevel4Complete && (
                  <span className="text-[10px] bg-[#F4F8F5] text-[#4F6D56] border border-[#4F6D56]/30 px-2 py-0.5 rounded font-bold">
                    ✓ Review Quest Completed
                  </span>
                )}
              </div>
              <p className="text-xs text-[#242220] font-medium mt-1">
                {levelMissions[level]?.action}
              </p>
              <p className="text-[11px] text-[#6B635A] mt-0.5">
                💡 <span className="font-semibold">Milestone Goal:</span> {
                  level === 1 ? `Verify all Acceptance Criteria (${completedAcCount}/${totalAcCount} checked)` :
                  level === 2 ? `Audit Tier 1 Core Logic files (${tier1ReviewedCount}/${tier1Files.length} reviewed)` :
                  level === 3 ? `Verify Downstream Consumers (${tier2ReviewedCount}/${tier2Files.length} reviewed)` :
                  `Review Tests (${tier3ReviewedCount}/${tier3Files.length}) & Submit Final Verdict`
                }
              </p>
            </div>
          </div>

          {/* Interactive Transition Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center flex-shrink-0">
            {/* Level 1 Complete CTA */}
            {level === 1 && isLevel1Complete && (
              <button
                onClick={() => {
                  setUnlockedLevel(prev => Math.max(prev, 2));
                  setLevel(2);
                }}
                className="px-3.5 py-2 bg-[#4F6D56] hover:bg-[#3D5442] text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 animate-pulse cursor-pointer"
              >
                <span>Proceed to Level 2: Core Architecture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Level 2 Complete CTA */}
            {level === 2 && isLevel2Complete && (
              <button
                onClick={() => {
                  setUnlockedLevel(prev => Math.max(prev, 3));
                  setLevel(3);
                }}
                className="px-3.5 py-2 bg-[#4F6D56] hover:bg-[#3D5442] text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 animate-pulse cursor-pointer"
              >
                <span>Proceed to Level 3: Blast Radius</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Level 3 Complete CTA */}
            {level === 3 && isLevel3Complete && (
              <button
                onClick={() => {
                  setUnlockedLevel(prev => Math.max(prev, 4));
                  setLevel(4);
                }}
                className="px-3.5 py-2 bg-[#4F6D56] hover:bg-[#3D5442] text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 animate-pulse cursor-pointer"
              >
                <span>Proceed to Level 4: Tests & Verdict</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Level 4 Submit CTA */}
            {level === 4 && (
              <button
                onClick={() => setIsVerdictOpen(true)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 ${
                  isVerdictSubmitted
                    ? 'bg-[#4F6D56] text-white'
                    : 'bg-[#C35832] hover:bg-[#A84725] text-white'
                }`}
              >
                <span>{isVerdictSubmitted ? '✓ Review Verdict Submitted' : '🏆 Submit Final Review Verdict'}</span>
              </button>
            )}

            <span className="text-[10px] bg-[#F1ECE4] text-[#6B635A] px-2.5 py-1.5 rounded font-bold border border-[#E6E0D5]">
              Max Unlocked: Level {unlockedLevel}/4
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Dynamically adapts per level */}
      <main className="flex-1 max-w-7xl xl:max-w-[1440px] w-full mx-auto p-4 lg:p-6">
        {level === 4 ? (
          /* Level 4 Specialized Workspace: Roomy Full-Width Test Matrix + Side-by-Side Verification */
          <div className="w-full">
            <TestReviewWorkspace 
              testSuites={testSuites}
              onOpenVerdict={() => setIsVerdictOpen(true)}
              isVerdictSubmitted={isVerdictSubmitted}
              onAddXp={handleAddXp}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Panel: Level-specific Objective Control (Sticky alongside diff viewer) */}
            <section className="lg:col-span-3 flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto pr-0.5">
              <DynamicLeftPanel 
                level={level}
                jiraTicket={jiraTicket} 
                setJiraTicket={setJiraTicket} 
                selectedSpec={selectedSpec} 
                setSelectedSpec={setSelectedSpec} 
                architectureStandards={standards}
                onToggleStandard={handleToggleStandard}
                mermaidCode={initialArchitectureMermaid}
                symbolCatalog={initialSymbolCatalog}
                activeSymbol={activeSymbolKey}
                onSelectSymbol={setActiveSymbolKey}
                onSelectFileByPath={handleSelectFileByPath}
                onAddXp={handleAddXp}
                onOpenArchModal={() => setIsDiagramModalOpen(true)}
                isLevelComplete={
                  level === 1 ? isLevel1Complete :
                  level === 2 ? isLevel2Complete :
                  level === 3 ? isLevel3Complete :
                  isLevel4Complete
                }
              />

              {/* Quest Log / XP Feed */}
              <div className="bg-white border border-[#E6E0D5] rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-[#242220] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#D08A29]" /> Quest Log Feed
                </h3>
                {questLogs.length === 0 ? (
                  <p className="text-[11px] text-[#6B635A]">Perform review actions to earn XP and level up!</p>
                ) : (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
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

            {level === 3 ? (
              /* Level 3 Blast Radius Workspace: Diff Center + Floating Sticky Function Inspector Right */
              <>
                <section className="lg:col-span-5">
                  <HierarchicalDiffViewer 
                    files={files} 
                    selectedSpec={selectedSpec} 
                    activeFileId={activeFileId} 
                    setActiveFileId={setActiveFileId} 
                    onUpdateFileStatus={handleUpdateFileStatus} 
                    onAddComment={handleAddComment} 
                    onAddXp={handleAddXp}
                    level={level}
                    onInspectSymbol={(sym) => setActiveSymbolKey(sym)}
                  />
                </section>

                <section className="lg:col-span-4">
                  <FunctionInspectorPanel 
                    activeSymbolKey={activeSymbolKey}
                    symbolCatalog={initialSymbolCatalog}
                    onSelectSymbol={setActiveSymbolKey}
                    onSelectFileByPath={handleSelectFileByPath}
                  />
                </section>
              </>
            ) : (
              /* Level 1 & 2 Workspace: Wide, Distraction-Free Diff Viewer */
              <section className="lg:col-span-9">
                <HierarchicalDiffViewer 
                  files={files} 
                  selectedSpec={selectedSpec} 
                  activeFileId={activeFileId} 
                  setActiveFileId={setActiveFileId} 
                  onUpdateFileStatus={handleUpdateFileStatus} 
                  onAddComment={handleAddComment} 
                  onAddXp={handleAddXp}
                  level={level}
                  onInspectSymbol={(sym) => setActiveSymbolKey(sym)}
                />
              </section>
            )}
          </div>
        )}
      </main>

      {/* Visual Architecture Diagram & Net Diff Modal */}
      <ArchitectureDiagramModal 
        isOpen={isDiagramModalOpen}
        onClose={() => setIsDiagramModalOpen(false)}
        onSelectNodeFile={handleSelectFileByPath}
        netChanges={netArchitecturalChanges}
        baselineMermaid={baselineArchitectureMermaid}
        proposedMermaid={proposedArchitectureMermaid}
        diffMermaid={diffArchitectureMermaid}
        onAddXp={handleAddXp}
      />

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
        <div 
          onClick={() => setIsVerdictOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#E6E0D5] rounded-xl max-w-lg w-full shadow-2xl p-6"
          >
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
                  const awarded = handleAddXp(100, "Submitted Final Review Verdict", "final-verdict-submitted");
                  if (awarded) {
                    alert(`🎉 Review submitted successfully! You earned a bonus +100 XP!`);
                  } else {
                    alert(`✓ Review verdict updated and recorded!`);
                  }
                  setIsVerdictOpen(false);
                }}
                className="px-4 py-2 bg-[#C35832] hover:bg-[#A84725] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                {awardedActions.includes("final-verdict-submitted") ? "Submit Verdict (Recorded)" : "Submit Verdict (+100 XP)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Progress Breakdown Modal */}
      {isProgressOpen && (
        <div 
          onClick={() => setIsProgressOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#E6E0D5] rounded-xl max-w-lg w-full shadow-2xl p-6"
          >
            <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#4F6D56]" />
                <h2 className="text-base font-bold text-[#242220]">Review Progress & Milestones</h2>
              </div>
              <button 
                onClick={() => setIsProgressOpen(false)}
                className="text-[#6B635A] hover:text-[#242220] p-1 rounded hover:bg-[#F9F6F0]"
              >
                ✕
              </button>
            </div>

            {/* Overall Progress Bar */}
            <div className="bg-[#F9F6F0] border border-[#E6E0D5] rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B635A]">
                  Total Review Completion
                </span>
                <span className="text-base font-extrabold text-[#242220]">
                  {totalProgressPercent}%
                </span>
              </div>
              <div className="w-full bg-[#E6E0D5] h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-[#4F6D56] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${totalProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#6B635A] mt-1.5 font-medium">
                <span>L1: {Math.round(l1Prog)}%</span>
                <span>L2: {Math.round(l2Prog)}%</span>
                <span>L3: {Math.round(l3Prog)}%</span>
                <span>L4: {Math.round(l4TestProg + l4VerdictProg)}%</span>
              </div>
            </div>

            {/* Breakdown per level */}
            <div className="space-y-2.5">
              {/* Level 1 Item */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                isLevel1Complete ? 'bg-[#F4F8F5] border-[#4F6D56]/30' : 'bg-white border-[#E6E0D5]'
              }`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#242220]">Level 1: Spec & Intent</span>
                    {isLevel1Complete && <span className="text-[10px] bg-[#4F6D56] text-white px-1.5 py-0.2 rounded font-bold">Done ✓</span>}
                  </div>
                  <div className="text-[11px] text-[#6B635A] mt-0.5">
                    {completedAcCount}/{totalAcCount} Acceptance Criteria verified
                  </div>
                </div>
                <button
                  onClick={() => { setLevel(1); setIsProgressOpen(false); }}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-[#F9F6F0] hover:bg-[#E6E0D5] text-[#242220] transition-colors"
                >
                  {level === 1 ? "Active" : "Jump to L1"}
                </button>
              </div>

              {/* Level 2 Item */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                isLevel2Complete ? 'bg-[#F4F8F5] border-[#4F6D56]/30' : 'bg-white border-[#E6E0D5]'
              }`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#242220]">Level 2: Core Architecture</span>
                    {isLevel2Complete && <span className="text-[10px] bg-[#4F6D56] text-white px-1.5 py-0.2 rounded font-bold">Done ✓</span>}
                  </div>
                  <div className="text-[11px] text-[#6B635A] mt-0.5">
                    {tier1ReviewedCount}/{tier1Files.length} Tier 1 files reviewed • {standards.filter(s => s.completed).length}/{standards.length} Standards audited
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (unlockedLevel >= 2) { setLevel(2); setIsProgressOpen(false); }
                  }}
                  disabled={unlockedLevel < 2}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    unlockedLevel < 2 
                      ? 'bg-[#F1ECE4] text-[#6B635A] cursor-not-allowed opacity-50'
                      : 'bg-[#F9F6F0] hover:bg-[#E6E0D5] text-[#242220]'
                  }`}
                >
                  {level === 2 ? "Active" : unlockedLevel < 2 ? "Locked" : "Jump to L2"}
                </button>
              </div>

              {/* Level 3 Item */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                isLevel3Complete ? 'bg-[#F4F8F5] border-[#4F6D56]/30' : 'bg-white border-[#E6E0D5]'
              }`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#242220]">Level 3: Blast Radius</span>
                    {isLevel3Complete && <span className="text-[10px] bg-[#4F6D56] text-white px-1.5 py-0.2 rounded font-bold">Done ✓</span>}
                  </div>
                  <div className="text-[11px] text-[#6B635A] mt-0.5">
                    {tier2ReviewedCount}/{tier2Files.length} Downstream consumer files verified
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (unlockedLevel >= 3) { setLevel(3); setIsProgressOpen(false); }
                  }}
                  disabled={unlockedLevel < 3}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    unlockedLevel < 3 
                      ? 'bg-[#F1ECE4] text-[#6B635A] cursor-not-allowed opacity-50'
                      : 'bg-[#F9F6F0] hover:bg-[#E6E0D5] text-[#242220]'
                  }`}
                >
                  {level === 3 ? "Active" : unlockedLevel < 3 ? "Locked" : "Jump to L3"}
                </button>
              </div>

              {/* Level 4 Item */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                isLevel4Complete ? 'bg-[#F4F8F5] border-[#4F6D56]/30' : 'bg-white border-[#E6E0D5]'
              }`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#242220]">Level 4: Tests & Final Verdict</span>
                    {isLevel4Complete && <span className="text-[10px] bg-[#4F6D56] text-white px-1.5 py-0.2 rounded font-bold">Done ✓</span>}
                  </div>
                  <div className="text-[11px] text-[#6B635A] mt-0.5">
                    {tier3ReviewedCount}/{tier3Files.length} Tests verified • Verdict: {isVerdictSubmitted ? "Submitted ✓" : "Pending"}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (unlockedLevel >= 4) { setLevel(4); setIsProgressOpen(false); }
                  }}
                  disabled={unlockedLevel < 4}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    unlockedLevel < 4 
                      ? 'bg-[#F1ECE4] text-[#6B635A] cursor-not-allowed opacity-50'
                      : 'bg-[#F9F6F0] hover:bg-[#E6E0D5] text-[#242220]'
                  }`}
                >
                  {level === 4 ? "Active" : unlockedLevel < 4 ? "Locked" : "Jump to L4"}
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#F1ECE4] flex justify-between items-center">
              <span className="text-xs text-[#6B635A]">
                {reviewedCount}/{files.length} Files Reviewed
              </span>
              <button
                onClick={() => setIsProgressOpen(false)}
                className="px-4 py-2 bg-[#C35832] text-white text-xs font-bold rounded-lg hover:bg-[#A84725] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}