import React from 'react';
import { FileCode, Beaker, Link, AlertCircle } from 'lucide-react';

export default function FileList({
  files,
  selectedFileId,
  setSelectedFileId,
  testFirstMode,
  setHighlightedFunction
}) {
  const handleFileSelect = (id) => {
    setSelectedFileId(id);
    setHighlightedFunction(null);
  };

  // Sorting logic
  let orderedFiles = [];
  if (testFirstMode) {
    const addedIds = new Set();
    // 1. Get all test files
    const testFiles = files.filter(f => f.isTest);
    // 2. For each test file, find its paired implementation file
    testFiles.forEach(testFile => {
      if (!addedIds.has(testFile.id)) {
        orderedFiles.push({ ...testFile, displayGroup: 'test' });
        addedIds.add(testFile.id);
      }
      if (testFile.pairedWith) {
        const paired = files.find(f => f.id === testFile.pairedWith);
        if (paired && !addedIds.has(paired.id)) {
          orderedFiles.push({ ...paired, displayGroup: 'paired-implementation', parentTestId: testFile.id });
          addedIds.add(paired.id);
        }
      }
    });

    // 3. Find files that are not tests and not paired with any test
    const unpairedImplementations = files.filter(f => 
      !f.isTest && !addedIds.has(f.id)
    );
    unpairedImplementations.forEach(unpaired => {
      orderedFiles.push({ ...unpaired, displayGroup: 'unpaired-implementation' });
    });
  } else {
    // Standard alphabetical sorting
    orderedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {testFirstMode ? '📌 Test-First Hierarchy' : '📁 File Explorer'}
        </h2>
        <p className="text-[11px] text-slate-500 mt-1">
          {testFirstMode 
            ? 'Tests are pinned to the top, paired directly with their implementations.' 
            : 'Standard alphabetical file structure.'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {orderedFiles.map((file, index) => {
          const isSelected = file.id === selectedFileId;
          const isTest = file.isTest;
          
          // Determine indentation and styling based on group
          let indentClass = '';
          let borderClass = 'border-l-2 border-transparent';
          
          if (testFirstMode) {
            if (file.displayGroup === 'paired-implementation') {
              indentClass = 'ml-6';
              borderClass = isSelected 
                ? 'border-l-2 border-indigo-500 bg-indigo-950/20' 
                : 'border-l-2 border-slate-800 hover:bg-slate-800/30';
            } else if (file.displayGroup === 'test') {
              borderClass = isSelected 
                ? 'border-l-2 border-emerald-500 bg-emerald-950/20' 
                : 'border-l-2 border-transparent hover:bg-slate-800/50';
            } else {
              borderClass = isSelected 
                ? 'border-l-2 border-amber-500 bg-amber-950/20' 
                : 'border-l-2 border-transparent hover:bg-slate-800/50';
            }
          } else {
            borderClass = isSelected 
              ? 'border-l-2 border-indigo-500 bg-indigo-950/20' 
              : 'border-l-2 border-transparent hover:bg-slate-800/50';
          }

          return (
            <button
              key={`${file.id}-${index}`}
              onClick={() => handleFileSelect(file.id)}
              className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-all ${indentClass} ${borderClass} ${
                isSelected ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                {isTest ? (
                  <Beaker className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : file.displayGroup === 'paired-implementation' ? (
                  <Link className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                ) : (
                  <FileCode className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <div className="truncate">
                  <div className="text-xs font-mono truncate">{file.name}</div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">{file.path}</div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {isTest && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                    TEST
                  </span>
                )}
                {testFirstMode && file.displayGroup === 'unpaired-implementation' && (
                  <span 
                    className="bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center space-x-0.5"
                    title="This implementation file has no matching test suite!"
                  >
                    <AlertCircle className="w-2.5 h-2.5" />
                    <span>NO TEST</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}