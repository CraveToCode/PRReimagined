import React, { useState } from 'react';
import { Check, AlertTriangle, MessageSquare, Star, ChevronDown, ChevronUp, Search, Info, X } from 'lucide-react';

export default function HierarchicalDiffViewer({ 
  files, 
  selectedSpec, 
  activeFileId, 
  setActiveFileId, 
  onUpdateFileStatus, 
  onAddComment,
  onAddXp,
  level = 1,
  onInspectSymbol,
  onOpenInfo
}) {
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedFiles, setExpandedFiles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const detectSymbol = (content) => {
    if (content.includes("rotateSessionToken")) return "rotateSessionToken";
    if (content.includes("interceptors.response.use") || (content.includes("response.use") && content.includes("apiClient"))) return "apiClient.interceptors.response.use";
    if (content.includes("SessionProvider")) return "SessionProvider";
    if (content.includes("ProtectedRoute")) return "ProtectedRoute";
    return null;
  };

  const filteredFiles = (selectedSpec === 'ALL' 
    ? files 
    : files.filter(f => f.specTag === selectedSpec)
  ).filter(f => f.path.toLowerCase().includes(searchQuery.toLowerCase()));

  const sortedFiles = [...filteredFiles].sort((a, b) => b.importance - a.importance);

  const handleStatusChange = (fileId, status) => {
    onUpdateFileStatus(fileId, status);
    // Idempotent XP: only granted once per file reviewed
    onAddXp(40, `Reviewed ${fileId}: marked as ${status}`, `review-file-${fileId}`);
  };

  const handleAddCommentSubmit = (fileId, lineNum) => {
    const text = commentInputs[`${fileId}-${lineNum}`];
    if (!text || !text.trim()) return;

    onAddComment(fileId, {
      id: Date.now(),
      line: lineNum,
      author: "Reviewer (You)",
      text: text.trim(),
      resolved: false
    });

    setCommentInputs({
      ...commentInputs,
      [`${fileId}-${lineNum}`]: ''
    });
    onAddXp(15, `Added inline comment on line ${lineNum + 1}`, `comment-${fileId}-${lineNum}`);
  };

  const toggleExpand = (fileId) => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header & Search Bar */}
      <div className="bg-white border border-[#E6E0D5] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#6B635A] uppercase tracking-wider">
              📁 Diff Workspace ({sortedFiles.length} {sortedFiles.length === 1 ? 'file' : 'files'})
            </span>
            {selectedSpec !== 'ALL' && (
              <span className="text-[10px] font-bold bg-[#C35832]/10 text-[#C35832] px-2 py-0.5 rounded border border-[#C35832]/20 font-mono">
                Filtered: {selectedSpec}
              </span>
            )}
          </div>
          {onOpenInfo && (
            <button
              onClick={onOpenInfo}
              className="text-xs text-[#6B635A] hover:text-[#C35832] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Learn what Tiers and Review Levels mean"
            >
              <Info className="w-3.5 h-3.5 text-[#C35832]" />
              <span className="hidden sm:inline">Tier Guide</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#6B635A]" />
          <input
            type="text"
            placeholder="Search files by path..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F9F6F0] border border-[#E6E0D5] rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#C35832]"
          />
        </div>
      </div>

      {sortedFiles.length === 0 ? (
        <div className="bg-white border border-[#E6E0D5] rounded-xl p-8 text-center">
          <p className="text-sm text-[#6B635A]">No files match the selected JIRA Spec Filter ({selectedSpec}) or search query.</p>
          <button 
            onClick={() => { setSearchQuery(''); onUpdateFileStatus(null, 'reset'); }}
            className="mt-3 text-xs text-[#C35832] font-bold hover:underline"
          >
            Clear Filters & Search
          </button>
        </div>
      ) : (
        sortedFiles.map((file) => {
          const isActive = activeFileId === file.id;
          const isExpanded = expandedFiles[file.id] !== false;

          let tierBadgeColor = "bg-[#FBEFEF] text-[#C35832] border-[#C35832]/20";
          if (file.tier.includes("Tier 2")) {
            tierBadgeColor = "bg-[#FFFDF9] text-[#D08A29] border-[#D08A29]/20";
          } else if (file.tier.includes("Tier 3")) {
            tierBadgeColor = "bg-[#F4F8F5] text-[#4F6D56] border-[#4F6D56]/20";
          }

          return (
            <div 
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              className={`bg-white border rounded-xl overflow-hidden transition-all shadow-xs ${
                isActive ? 'ring-2 ring-[#C35832] border-transparent' : 'border-[#E6E0D5]'
              }`}
            >
              {/* File Header */}
              <div className="bg-[#FFFDF9] border-b border-[#E6E0D5] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleExpand(file.id); }}
                    className="text-[#6B635A] hover:text-[#242220]"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#242220] truncate">{file.path}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tierBadgeColor}`}>
                        {file.tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#6B635A] flex items-center gap-1">
                        <Star className="w-3 h-3 text-[#D08A29] fill-current" /> Importance: {file.importance}/100
                      </span>
                      <span className="text-[10px] bg-[#F1ECE4] text-[#6B635A] px-1.5 py-0.2 rounded font-mono">
                        Spec: {file.specTag}
                      </span>
                    </div>
                  </div>
                </div>

                {/* File Actions */}
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleStatusChange(file.id, 'approved')}
                    className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                      file.status === 'approved'
                        ? 'bg-[#4F6D56] text-white'
                        : 'bg-[#F4F8F5] text-[#4F6D56] hover:bg-[#4F6D56] hover:text-white border border-[#4F6D56]/20'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(file.id, 'flagged')}
                    className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                      file.status === 'flagged'
                        ? 'bg-[#C35832] text-white'
                        : 'bg-[#FBEFEF] text-[#C35832] hover:bg-[#C35832] hover:text-white border border-[#C35832]/20'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Flag
                  </button>
                </div>
              </div>

              {/* Diff Content */}
              {isExpanded && (
                <div className="overflow-x-auto font-mono text-xs">
                  {file.diffChunks.map((chunk, chunkIdx) => (
                    <div key={chunkIdx} className="border-b border-[#F1ECE4] last:border-0">
                      <div className="bg-[#F1ECE4]/50 text-[#6B635A] px-4 py-1 text-[11px] select-none">
                        {chunk.header}
                      </div>
                      <div className="divide-y divide-[#F1ECE4]/30">
                        {chunk.lines.map((line, lineIdx) => {
                          let lineBg = "bg-white";
                          let linePrefix = " ";
                          let prefixColor = "text-[#6B635A]";

                          if (line.type === 'add') {
                            lineBg = "bg-[#EBF3EC] border-l-4 border-[#4F6D56]";
                            linePrefix = "+";
                            prefixColor = "text-[#4F6D56] font-bold";
                          } else if (line.type === 'delete') {
                            lineBg = "bg-[#FBEFEF] border-l-4 border-[#C35832]";
                            linePrefix = "-";
                            prefixColor = "text-[#C35832] font-bold";
                          }

                          const lineComments = file.comments.filter(c => c.line === lineIdx);

                          return (
                            <div key={lineIdx} className="group">
                              <div className={`flex items-start px-4 py-1 hover:bg-[#F9F6F0] transition-colors ${lineBg}`}>
                                <span className="w-6 select-none text-right pr-2 text-[10px] text-[#6B635A]/60">
                                  {lineIdx + 1}
                                </span>
                                <span className={`w-4 select-none ${prefixColor} text-center mr-1`}>
                                  {linePrefix}
                                </span>
                                <pre className="flex-1 whitespace-pre-wrap break-all text-[#242220]">
                                  {line.content}
                                </pre>
                                {detectSymbol(line.content) && onInspectSymbol && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onInspectSymbol(detectSymbol(line.content));
                                    }}
                                    className="ml-2 px-1.5 py-0.5 rounded bg-[#FFFDF9] border border-[#C35832] text-[#C35832] text-[9px] font-bold font-mono hover:bg-[#C35832] hover:text-white transition-colors cursor-pointer flex items-center gap-1 shadow-2xs flex-shrink-0"
                                    title={`Inspect ${detectSymbol(line.content)} in Blast Radius Panel`}
                                  >
                                    🔍 {detectSymbol(line.content).split('.').pop()}()
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setCommentInputs(prev => ({
                                      ...prev,
                                      [`${file.id}-${lineIdx}`]: prev[`${file.id}-${lineIdx}`] !== undefined ? undefined : ''
                                    }));
                                  }}
                                  className="opacity-0 group-hover:opacity-100 ml-2 text-[#6B635A] hover:text-[#C35832] transition-opacity"
                                  title="Add inline comment"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Inline Comments List */}
                              {lineComments.map((comment) => (
                                <div key={comment.id} className="bg-[#FFFDF9] border-l-4 border-[#D08A29] ml-10 mr-4 my-1.5 p-2.5 rounded-r-md shadow-xs text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-[#242220]">{comment.author}</span>
                                    <span className="text-[10px] text-[#6B635A]">Line {lineIdx + 1}</span>
                                  </div>
                                  <p className="text-[#6B635A] leading-relaxed">{comment.text}</p>
                                </div>
                              ))}

                              {/* Comment Input Form */}
                              {commentInputs[`${file.id}-${lineIdx}`] !== undefined && (
                                <div className="bg-[#FFFDF9] border border-[#E6E0D5] ml-10 mr-4 my-2 p-2.5 rounded-lg shadow-inner">
                                  <textarea
                                    rows="2"
                                    placeholder="Write a constructive review comment..."
                                    value={commentInputs[`${file.id}-${lineIdx}`]}
                                    onChange={(e) => setCommentInputs({
                                      ...commentInputs,
                                      [`${file.id}-${lineIdx}`]: e.target.value
                                    })}
                                    className="w-full bg-white border border-[#E6E0D5] rounded p-2 text-xs focus:outline-none focus:border-[#C35832]"
                                  />
                                  <div className="flex justify-end gap-1.5 mt-2">
                                    <button
                                      onClick={() => setCommentInputs(prev => {
                                        const copy = { ...prev };
                                        delete copy[`${file.id}-${lineIdx}`];
                                        return copy;
                                      })}
                                      className="px-2.5 py-1 bg-white border border-[#E6E0D5] text-[11px] font-medium rounded hover:bg-[#F9F6F0]"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleAddCommentSubmit(file.id, lineIdx)}
                                      className="px-2.5 py-1 bg-[#C35832] text-white text-[11px] font-bold rounded hover:bg-[#A84725]"
                                    >
                                      Post Comment (+15 XP)
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))} 
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}