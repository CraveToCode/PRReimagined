import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  FileCode, 
  Check, 
  Play, 
  ShieldCheck, 
  Award,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function TestReviewWorkspace({
  testSuites,
  onOpenVerdict,
  isVerdictSubmitted,
  onAddXp
}) {
  const [activeTestId, setActiveTestId] = useState(testSuites[0]?.id || "test-1");
  const [testVerdicts, setTestVerdicts] = useState({});

  const activeTest = testSuites.find(t => t.id === activeTestId) || testSuites[0];

  const handleTestStatus = (testId, verdict) => {
    setTestVerdicts(prev => ({
      ...prev,
      [testId]: verdict
    }));
    onAddXp(20, `Verified test case: ${testId}`, `verify-test-${testId}`);
  };

  const passedCount = testSuites.filter(t => t.status === 'pass').length;
  const warningCount = testSuites.filter(t => t.status === 'warning').length;

  return (
    <div className="col-span-12 space-y-5">
      {/* Top Test Suite Matrix */}
      <div className="bg-white border border-[#E6E0D5] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F1ECE4] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#4F6D56] bg-[#F4F8F5] px-2 py-0.5 rounded border border-[#4F6D56]/20 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Level 4 Test Suite Matrix
              </span>
              <span className="text-xs text-[#6B635A]">
                ({testSuites.length} Test Cases)
              </span>
            </div>
            <h2 className="text-sm font-bold text-[#242220] mt-1">
              Select a test to cross-verify against its production implementation
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F4F8F5] text-[#4F6D56] border border-[#4F6D56]/20 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> {passedCount} Passing
            </span>
            {warningCount > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FFFDF9] text-[#D08A29] border border-[#D08A29]/20 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {warningCount} Test Gap
              </span>
            )}
          </div>
        </div>

        {/* Test Cards Horizontal Carousel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {testSuites.map((test) => {
            const isSelected = activeTest.id === test.id;
            const isVerified = testVerdicts[test.id] === 'approved';

            return (
              <button
                key={test.id}
                onClick={() => setActiveTestId(test.id)}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected 
                    ? 'bg-[#FFFDF9] border-[#C35832] ring-2 ring-[#C35832] shadow-sm'
                    : 'bg-[#F9F6F0] border-[#E6E0D5] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                    test.status === 'pass'
                      ? 'bg-[#F4F8F5] text-[#4F6D56] border-[#4F6D56]/20'
                      : 'bg-[#FBEFEF] text-[#C35832] border-[#C35832]/20'
                  }`}>
                    {test.status === 'pass' ? `✓ ${test.executionMs}ms` : '⚠️ Gap'}
                  </span>
                  {isVerified && (
                    <span className="text-[10px] text-[#4F6D56] font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Reviewed
                    </span>
                  )}
                </div>

                <div className="font-bold text-xs text-[#242220] leading-snug line-clamp-2">
                  {test.testName}
                </div>

                <div className="flex items-center gap-1 mt-2 text-[10px] text-[#6B635A] font-mono">
                  <span className="truncate">{test.targetSymbol}()</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Side-by-Side: Test Case (Left) vs Function Tested (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Test Case Implementation */}
        <div className="lg:col-span-6 bg-white border border-[#E6E0D5] rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="bg-[#FFFDF9] border-b border-[#E6E0D5] px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#6B635A] tracking-wider">
                Unit Test Case
              </div>
              <div className="text-xs font-bold text-[#242220] font-mono mt-0.5 truncate">
                {activeTest.file}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleTestStatus(activeTest.id, 'approved')}
                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                  testVerdicts[activeTest.id] === 'approved'
                    ? 'bg-[#4F6D56] text-white'
                    : 'bg-[#F4F8F5] text-[#4F6D56] hover:bg-[#4F6D56] hover:text-white border border-[#4F6D56]/20'
                }`}
              >
                <Check className="w-3.5 h-3.5" /> Approve Test (+20 XP)
              </button>
              <button
                onClick={() => handleTestStatus(activeTest.id, 'flagged')}
                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                  testVerdicts[activeTest.id] === 'flagged'
                    ? 'bg-[#C35832] text-white'
                    : 'bg-[#FBEFEF] text-[#C35832] hover:bg-[#C35832] hover:text-white border border-[#C35832]/20'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Flag Gap
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col space-y-3">
            <div className="text-xs font-bold text-[#242220]">
              {activeTest.suiteName} &gt; {activeTest.testName}
            </div>

            <pre className="bg-[#242220] text-[#E6E0D5] p-3.5 rounded-lg font-mono text-xs leading-relaxed overflow-x-auto flex-1 max-h-[380px]">
              {activeTest.code}
            </pre>

            <div className="bg-[#F9F6F0] border border-[#E6E0D5] rounded-lg p-3 text-xs text-[#6B635A]">
              <span className="font-bold text-[#242220]">Reviewer Insight:</span> {activeTest.notes}
            </div>
          </div>
        </div>

        {/* Right: Corresponding Function Under Test */}
        <div className="lg:col-span-6 bg-white border border-[#E6E0D5] rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="bg-[#F4F8F5] border-b border-[#4F6D56]/20 px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#4F6D56] tracking-wider">
                Production Implementation Under Test
              </div>
              <div className="text-xs font-bold text-[#242220] font-mono mt-0.5 truncate">
                {activeTest.targetFile} (Lines {activeTest.targetLines})
              </div>
            </div>
            <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#4F6D56]/30 font-bold text-[#4F6D56]">
              {activeTest.targetSymbol}()
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col space-y-3">
            <div className="text-xs font-bold text-[#242220] flex items-center justify-between">
              <span>Target Logic Executed by Test:</span>
              <span className="text-[11px] text-[#6B635A]">Compare assertions to return values</span>
            </div>

            <pre className="bg-white border border-[#E6E0D5] p-3.5 rounded-lg font-mono text-xs leading-relaxed text-[#242220] overflow-x-auto flex-1 max-h-[380px] shadow-inner">
              {activeTest.testedFunctionCode}
            </pre>

            <div className="bg-[#FFFDF9] border border-[#D08A29]/20 rounded-lg p-3 text-xs text-[#6B635A]">
              <span className="font-bold text-[#242220]">Verification Check:</span> Ensure that any exception branches in the target function are matched by an explicit test assertion on the left.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Final Verdict Card */}
      <div className="bg-white border-2 border-[#C35832] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D08A29]" />
            <h3 className="text-base font-bold text-[#242220]">Final Review Milestone Reached</h3>
          </div>
          <p className="text-xs text-[#6B635A] mt-1">
            All code tiers and test suites have been cross-verified. Compile approval statistics and generate the final sign-off report.
          </p>
        </div>

        <button
          onClick={onOpenVerdict}
          className="px-5 py-2.5 bg-[#C35832] hover:bg-[#A84725] text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 flex-shrink-0"
        >
          <span>{isVerdictSubmitted ? "View Review Report" : "Submit Final Review Verdict (+100 XP)"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
