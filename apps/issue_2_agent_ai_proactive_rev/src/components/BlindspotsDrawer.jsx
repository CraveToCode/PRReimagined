import React, { useState } from 'react';

export default function BlindspotsDrawer({
  blindspots,
  annotations,
  onAnnotate,
  onAddCustomBlindspot
}) {
  const [customMessage, setCustomMessage] = useState('');
  const [customSeverity, setCustomSeverity] = useState('medium');
  const [customCategory, setCustomCategory] = useState('Manual Review');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!customMessage.trim()) return;
    onAddCustomBlindspot({
      id: `custom-${Date.now()}`,
      severity: customSeverity,
      category: customCategory,
      message: customMessage,
      context: "Manually added by reviewer during active inspection."
    });
    setCustomMessage('');
    setShowCustomForm(false);
  };

  // Calculate statistics
  const total = blindspots.length;
  const addressed = blindspots.filter(bs => annotations[bs.id]?.status && annotations[bs.id]?.status !== 'pending').length;
  const progressPercent = total > 0 ? Math.round((addressed / total) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <span>⚠️ Blindspots & Gaps</span>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded border border-amber-500/20">
              Ambient AI
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Discrepancies between JIRA spec and actual diff
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5 bg-slate-950 p-3 rounded-lg border border-slate-800/60">
        <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
          <span>Addressed Alerts</span>
          <span>{addressed} / {total} ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-brand-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Blindspots List */}
      <div className="space-y-4 flex-1 overflow-y-auto max-h-[450px] pr-1">
        {blindspots.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No active blindspots detected for this PR.
          </div>
        ) : (
          blindspots.map((bs) => {
            const annotation = annotations[bs.id] || { status: 'pending' };
            
            let severityColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            if (bs.severity === 'high') severityColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            if (bs.severity === 'low') severityColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

            return (
              <div 
                key={bs.id} 
                className={`p-4 rounded-lg border transition-all ${
                  annotation.status === 'agreed' ? 'bg-emerald-950/10 border-emerald-800/40 opacity-80' :
                  annotation.status === 'flagged' ? 'bg-rose-950/10 border-rose-800/40' :
                  annotation.status === 'dismissed' ? 'bg-slate-900/40 border-slate-800/40 opacity-50' :
                  'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${severityColor}`}>
                    {bs.severity.toUpperCase()} SEVERITY
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {bs.category}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-200 leading-relaxed mb-2">
                  {bs.message}
                </p>
                
                {bs.context && (
                  <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800/40 font-mono mb-3">
                    {bs.context}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-900/60">
                  <span className="text-[10px] text-slate-400">
                    {annotation.status !== 'pending' ? `Marked as ${annotation.status}` : 'Review action:'}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onAnnotate(bs.id, 'agreed')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                        annotation.status === 'agreed'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                      }`}
                    >
                      Agree
                    </button>
                    <button
                      onClick={() => onAnnotate(bs.id, 'flagged')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                        annotation.status === 'flagged'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                      }`}
                    >
                      Flag Bug
                    </button>
                    <button
                      onClick={() => onAnnotate(bs.id, 'dismissed')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                        annotation.status === 'dismissed'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-700'
                      }`}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Blindspot Form Toggle */}
      <div className="mt-4 pt-4 border-t border-slate-800/60">
        {!showCustomForm ? (
          <button
            onClick={() => setShowCustomForm(true)}
            className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
          >
            <span>➕</span> <span>Add Custom Review Alert</span>
          </button>
        ) : (
          <form onSubmit={handleAdd} className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">New Review Alert</span>
              <button 
                type="button" 
                onClick={() => setShowCustomForm(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>
            
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g., Missing validation for negative amounts in payment handler..."
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 h-16 resize-none"
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Severity</label>
                <select
                  value={customSeverity}
                  onChange={(e) => setCustomSeverity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="Manual Review">Manual Review</option>
                  <option value="Security Risk">Security Risk</option>
                  <option value="Performance">Performance</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-semibold transition-all"
            >
              Add Alert
            </button>
          </form>
        )}
      </div>
    </div>
  );
}