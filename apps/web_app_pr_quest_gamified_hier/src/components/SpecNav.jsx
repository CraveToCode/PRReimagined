import React, { useState } from 'react';
import { CheckSquare, Square, Plus, Award } from 'lucide-react';

export default function SpecNav({ 
  jiraTicket, 
  setJiraTicket, 
  selectedSpec, 
  setSelectedSpec, 
  onAddXp 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAcText, setNewAcText] = useState('');
  const [customTicketTitle, setCustomTicketTitle] = useState('');
  const [customTicketDesc, setCustomTicketDesc] = useState('');

  const toggleAc = (id) => {
    const updatedCriteria = jiraTicket.criteria.map(ac => {
      if (ac.id === id) {
        const nextState = !ac.completed;
        if (nextState) {
          onAddXp(25, `Completed Spec Check: ${ac.id}`, `verify-ac-${ac.id}`);
        }
        return { ...ac, completed: nextState };
      }
      return ac;
    });
    setJiraTicket({ ...jiraTicket, criteria: updatedCriteria });
  };

  const handleAddAc = (e) => {
    e.preventDefault();
    if (!newAcText.trim()) return;
    const nextId = `AC-${jiraTicket.criteria.length + 1}`;
    const updatedCriteria = [
      ...jiraTicket.criteria,
      { id: nextId, text: newAcText.trim(), completed: false }
    ];
    setJiraTicket({ ...jiraTicket, criteria: updatedCriteria });
    setNewAcText('');
    onAddXp(10, `Added Custom Acceptance Criterion ${nextId}`, `add-custom-ac-${nextId}`);
  };

  const handleImportTicket = (e) => {
    e.preventDefault();
    if (!customTicketTitle.trim()) return;
    setJiraTicket({
      id: `PROJ-${Math.floor(100 + Math.random() * 900)}`,
      title: customTicketTitle,
      description: customTicketDesc || "Custom imported user story description.",
      criteria: [
        { id: "AC-1", text: "Verify core business logic changes", completed: false },
        { id: "AC-2", text: "Verify consumer integration and state updates", completed: false },
        { id: "AC-3", text: "Verify test coverage and edge cases", completed: false }
      ]
    });
    setCustomTicketTitle('');
    setCustomTicketDesc('');
    setShowAddModal(false);
    onAddXp(50, "Imported Custom JIRA Story");
  };

  return (
    <div className="bg-white border border-[#E6E0D5] rounded-xl p-4 shadow-sm flex flex-col h-full">
      {/* JIRA Ticket Header */}
      <div className="border-b border-[#F1ECE4] pb-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#C35832] bg-[#FBEFEF] px-2 py-0.5 rounded border border-[#C35832]/20">
            {jiraTicket.id}
          </span>
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-xs text-[#C35832] hover:text-[#A84725] font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Import Story
          </button>
        </div>
        <h2 className="text-base font-bold text-[#242220] mt-2 leading-snug">
          {jiraTicket.title}
        </h2>
        <p className="text-xs text-[#6B635A] mt-1 line-clamp-3">
          {jiraTicket.description}
        </p>
      </div>

      {/* Spec Filter Pills */}
      <div className="mb-4">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635A] mb-2">
          🎯 Sliced Diff Filter
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedSpec('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedSpec === 'ALL'
                ? 'bg-[#C35832] text-white'
                : 'bg-[#F9F6F0] text-[#6B635A] hover:bg-[#E6E0D5]'
            }`}
          >
            All Diffs
          </button>
          {jiraTicket.criteria.map((ac) => (
            <button
              key={ac.id}
              onClick={() => setSelectedSpec(ac.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedSpec === ac.id
                  ? 'bg-[#C35832] text-white'
                  : 'bg-[#F9F6F0] text-[#6B635A] hover:bg-[#E6E0D5]'
            }`}
            >
              {ac.id}
            </button>
          ))}
        </div>
      </div>

      {/* Acceptance Criteria Checklist */}
      <div className="flex-1 overflow-y-auto min-h-[200px] pr-1">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635A]">
            ✅ Acceptance Criteria Checklist
          </label>
          <span className="text-[10px] text-[#4F6D56] font-bold">
            +25 XP each
          </span>
        </div>
        <div className="space-y-2">
          {jiraTicket.criteria.map((ac) => (
            <div 
              key={ac.id}
              className={`p-2.5 rounded-lg border transition-all flex items-start gap-2.5 ${
                ac.completed 
                  ? 'bg-[#F4F8F5] border-[#4F6D56]/30 text-[#4F6D56]' 
                  : 'bg-[#FFFDF9] border-[#E6E0D5] text-[#242220]'
              }`}
            >
              <button 
                onClick={() => toggleAc(ac.id)}
                className="mt-0.5 text-[#C35832] hover:scale-110 transition-transform flex-shrink-0"
              >
                {ac.completed ? (
                  <CheckSquare className="w-4 h-4 text-[#4F6D56]" />
                ) : ( 
                  <Square className="w-4 h-4 text-[#6B635A]" />
                )}
              </button>
              <div className="text-xs leading-relaxed">
                <span className="font-bold mr-1">{ac.id}:</span>
                <span className={ac.completed ? 'line-through opacity-75' : ''}>
                  {ac.text}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Add AC */}
        <form onSubmit={handleAddAc} className="mt-3 pt-3 border-t border-[#F1ECE4] flex gap-1.5">
          <input
            type="text"
            placeholder="Add custom AC..."
            value={newAcText}
            onChange={(e) => setNewAcText(e.target.value)}
            className="flex-1 bg-[#F9F6F0] border border-[#E6E0D5] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#C35832]"
          />
          <button 
            type="submit"
            className="bg-[#4F6D56] hover:bg-[#3D5442] text-white px-2.5 py-1 rounded text-xs font-bold transition-colors"
          >
            Add
          </button>
        </form>
      </div>

      {/* Mission Guidelines */}
      <div className="mt-4 bg-[#F9F6F0] border border-[#E6E0D5] rounded-lg p-3">
        <h4 className="text-xs font-bold text-[#242220] flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-[#D08A29]" /> Mission Guidelines
        </h4>
        <ul className="text-[11px] text-[#6B635A] mt-1.5 space-y-1 list-disc list-inside">
          <li>Filter diffs by AC to focus your review.</li>
          <li>Approve or Flag files in the center panel.</li>
          <li>Check Blast Radius on the right panel.</li>
          <li>Earn XP to level up and unlock the Final Verdict!</li>
        </ul>
      </div>

      {/* Import Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E6E0D5] rounded-xl p-5 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-[#242220] mb-3">Import JIRA Story</h3>
            <form onSubmit={handleImportTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#6B635A] mb-1">Story Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., PROJ-501: Implement OAuth2 Login"
                  value={customTicketTitle}
                  onChange={(e) => setCustomTicketTitle(e.target.value)}
                  className="w-full bg-[#F9F6F0] border border-[#E6E0D5] rounded p-2 text-xs focus:outline-none focus:border-[#C35832]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B635A] mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe the feature and requirements..."
                  value={customTicketDesc}
                  onChange={(e) => setCustomTicketDesc(e.target.value)}
                  className="w-full bg-[#F9F6F0] border border-[#E6E0D5] rounded p-2 text-xs focus:outline-none focus:border-[#C35832]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-white border border-[#E6E0D5] text-xs font-medium rounded hover:bg-[#F9F6F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#C35832] text-white text-xs font-bold rounded hover:bg-[#A84725]"
                >
                  Import & Reset ACs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}