import React, { useState } from 'react';
import { GitPullRequest, Plus, Search, Check, X, ShieldAlert, Award, Clock } from 'lucide-react';

export default function QuerySelectorModal({
  isOpen,
  onClose,
  currentQueryId,
  queries = [],
  onSelectQuery,
  onCreateQuery
}) {
  const [newQueryId, setNewQueryId] = useState('');
  const [newQueryTitle, setNewQueryTitle] = useState('');
  const [filterText, setFilterText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const filteredQueries = queries.filter(q => 
    q.query_id.toLowerCase().includes(filterText.toLowerCase()) ||
    (q.title && q.title.toLowerCase().includes(filterText.toLowerCase()))
  );

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newQueryId.trim()) return;
    const cleanId = newQueryId.trim().toUpperCase();
    const cleanTitle = newQueryTitle.trim() || `PR #${cleanId}: Feature Review`;
    onCreateQuery(cleanId, cleanTitle);
    setNewQueryId('');
    setNewQueryTitle('');
    setIsCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-[#E6E0D5] max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#F9F6F0] border-b border-[#E6E0D5] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#4F6D56] text-white rounded-xl shadow-xs">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#242220]">Review Queries & Pull Requests</h3>
              <p className="text-xs text-[#6B635A]">Maintain independent review state per query</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#6B635A] hover:text-[#242220] p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-[#E6E0D5] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B635A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Search PR query by name or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F9F6F0] border border-[#E6E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C35832]"
            />
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-3 py-1.5 bg-[#C35832] hover:bg-[#A84725] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreating ? 'Cancel' : 'New Query'}</span>
          </button>
        </div>

        {/* Create Query Inline Box */}
        {isCreating && (
          <form onSubmit={handleCreate} className="p-4 bg-[#FFF8F6] border-b border-[#F7D8D0] space-y-2.5 animate-in fade-in">
            <div className="text-xs font-bold text-[#C35832]">Start New Review Session Target</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={newQueryId}
                onChange={e => setNewQueryId(e.target.value)}
                placeholder="Query ID (e.g. PR-204)"
                className="text-xs p-2 bg-white border border-[#E6E0D5] rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#C35832]"
              />
              <input
                type="text"
                value={newQueryTitle}
                onChange={e => setNewQueryTitle(e.target.value)}
                placeholder="Title / Description (optional)"
                className="text-xs p-2 bg-white border border-[#E6E0D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C35832]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1 text-xs text-[#6B635A] hover:bg-black/5 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newQueryId.trim()}
                className="px-4 py-1 text-xs font-bold bg-[#C35832] hover:bg-[#A84725] text-white rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Create & Open
              </button>
            </div>
          </form>
        )}

        {/* Query List */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          {filteredQueries.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#6B635A]">
              No queries match your search. Click <strong>+ New Query</strong> to create one.
            </div>
          ) : (
            filteredQueries.map(q => {
              const isSelected = q.query_id === currentQueryId;
              return (
                <button
                  key={q.query_id}
                  onClick={() => {
                    onSelectQuery(q.query_id);
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFFDF9] border-[#D08A29] shadow-xs ring-1 ring-[#D08A29]'
                      : 'bg-white border-[#E6E0D5] hover:bg-[#F9F6F0]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-[#C35832]">
                          {q.query_id}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] bg-[#D08A29] text-white px-1.5 py-0.2 rounded font-bold">
                            Active Query
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-[#242220] mt-0.5">
                        {q.title || `Query ${q.query_id}`}
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-[#D08A29] shrink-0" />}
                  </div>

                  <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-[#F1ECE4] text-[11px] text-[#6B635A]">
                    <span>📁 {q.reviewedFiles || 0}/{q.totalFiles || 0} Files</span>
                    {q.flagsCount > 0 && (
                      <span className="text-[#C35832] font-semibold flex items-center gap-0.5">
                        <ShieldAlert className="w-3 h-3" />
                        {q.flagsCount} {q.flagsCount === 1 ? 'flag' : 'flags'}
                      </span>
                    )}
                    {q.verdictsCount > 0 && (
                      <span className="text-[#4F6D56] font-semibold flex items-center gap-0.5">
                        <Award className="w-3 h-3" />
                        {q.verdictsCount} {q.verdictsCount === 1 ? 'verdict' : 'verdicts'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F9F6F0] border-t border-[#E6E0D5] p-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-white border border-[#E6E0D5] text-[#242220] hover:bg-[#FFFDF9] rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
