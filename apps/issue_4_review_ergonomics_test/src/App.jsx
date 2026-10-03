import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileList from './components/FileList';
import DiffViewer from './components/DiffViewer';
import CoverageStats from './components/CoverageStats';
import TestRunner from './components/TestRunner';

const INITIAL_FILES = [
  {
    id: 'auth-service-test',
    name: 'authService.test.js',
    path: 'src/services/__tests__/authService.test.js',
    isTest: true,
    pairedWith: 'auth-service',
    content: `import { login, refreshToken } from '../authService';\n\ndescribe('authService', () => {\n  test('should login successfully with valid credentials', () => {\n    const user = login('admin', 'password123');\n    expect(user.token).toBeDefined();\n  });\n\n  test('should refresh token when expired', () => {\n    const newToken = refreshToken('expired_token');\n    expect(newToken).toBe('new_token_abc');\n  });\n});`,
    testCases: [
      { id: 'tc-1', name: "should login successfully with valid credentials", targets: "login", status: "passed" },
      { id: 'tc-2', name: "should refresh token when expired", targets: "refreshToken", status: "passed" }
    ]
  },
  {
    id: 'auth-service',
    name: 'authService.js',
    path: 'src/services/authService.js',
    isTest: false,
    pairedWith: 'auth-service-test',
    content: `export function login(username, password) {
  if (username === 'admin' && password === 'password123') {
    return { token: 'token_123', user: username };
  }
  throw new Error('Invalid credentials');
}

export function refreshToken(oldToken) {
  if (!oldToken) return null;
  return 'new_token_abc';
}

export function logout() {
  // TODO: Implement logout
  return true;
}`,
    functions: [
      { name: 'login', lineStart: 1, lineEnd: 6, covered: true },
      { name: 'refreshToken', lineStart: 8, lineEnd: 11, covered: true },
      { name: 'logout', lineStart: 13, lineEnd: 16, covered: false }
    ]
  },
  {
    id: 'user-profile-test',
    name: 'UserProfile.test.jsx',
    path: 'src/components/__tests__/UserProfile.test.jsx',
    isTest: true,
    pairedWith: 'user-profile',
    content: `import { render, screen } from '@testing-library/react';\nimport UserProfile from '../UserProfile';\n\ndescribe('UserProfile Component', () => {\n  test('renders user profile details', () => {\n    render(<UserProfile name="Alice" role="Developer" />);\n    expect(screen.getByText('Alice')).toBeInTheDocument();\n  });\n});`,
    testCases: [
      { id: 'tc-3', name: "renders user profile details", targets: "UserProfile", status: "passed" }
    ]
  },
  {
    id: 'user-profile',
    name: 'UserProfile.jsx',
    path: 'src/components/UserProfile.jsx',
    isTest: false,
    pairedWith: 'user-profile-test',
    content: `import React from 'react';

export default function UserProfile({ name, role }) {
  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold">{name}</h2>
      <p className="text-gray-600">{role}</p>
    </div>
  );
}

export function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('');
}`,
    functions: [
      { name: 'UserProfile', lineStart: 3, lineEnd: 10, covered: true },
      { name: 'getInitials', lineStart: 12, lineEnd: 14, covered: false }
    ]
  },
  {
    id: 'math-utils',
    name: 'math.js',
    path: 'src/utils/math.js',
    isTest: false,
    pairedWith: null,
    content: `export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}`,
    functions: [
      { name: 'add', lineStart: 1, lineEnd: 3, covered: false },
      { name: 'subtract', lineStart: 5, lineEnd: 7, covered: false },
      { name: 'multiply', lineStart: 9, lineEnd: 11, covered: false }
    ]
  }
];

export default function App() {
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('tdd_reviewer_files');
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });

  const [testFirstMode, setTestFirstMode] = useState(() => {
    const saved = localStorage.getItem('tdd_reviewer_test_first');
    return saved ? JSON.parse(saved) : true;
  });

  const [selectedFileId, setSelectedFileId] = useState('auth-service-test');
  const [highlightedFunction, setHighlightedFunction] = useState(null);
  const [activeTestCase, setActiveTestCase] = useState(null);
  const [testRunnerStatus, setTestRunnerStatus] = useState('idle');
  const [terminalLogs, setTerminalLogs] = useState([]);

  useEffect(() => {
    localStorage.setItem('tdd_reviewer_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('tdd_reviewer_test_first', JSON.stringify(testFirstMode));
  }, [testFirstMode]);

  const handleReset = () => {
    if (window.confirm('Reset to default mock files?')) {
      setFiles(INITIAL_FILES);
      setSelectedFileId('auth-service-test');
      setHighlightedFunction(null);
      setActiveTestCase(null);
      setTestRunnerStatus('idle');
      setTerminalLogs([]);
    }
  };

  const handleTestCaseClick = (testCase) => {
    setActiveTestCase(testCase);
    const currentFile = files.find(f => f.id === selectedFileId);
    if (currentFile && currentFile.isTest && currentFile.pairedWith) {
      const pairedFile = files.find(f => f.id === currentFile.pairedWith);
      if (pairedFile) {
        setSelectedFileId(pairedFile.id);
        setHighlightedFunction(testCase.targets);
      }
    }
  };

  const handleGenerateTest = (fileId, funcName) => {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    const updatedFiles = files.map((f, idx) => {
      if (idx === fileIndex) {
        const updatedFunctions = f.functions ? f.functions.map(fn => 
          fn.name === funcName ? { ...fn, covered: true } : fn
        ) : [];
        return { ...f, functions: updatedFunctions };
      }
      return f;
    });

    const targetFile = updatedFiles[fileIndex];
    let testFile = updatedFiles.find(f => f.id === targetFile.pairedWith);

    if (!testFile) {
      const testFileId = `${targetFile.id}-test`;
      const testFileName = targetFile.name.replace(/\.(js|jsx|ts|tsx)$/, '.test.$1');
      const testFilePath = targetFile.path.replace(/\/([^\/]+)$/, '/__tests__/$1').replace(/\.(js|jsx|ts|tsx)$/, '.test.$1');

      testFile = {
        id: testFileId,
        name: testFileName,
        path: testFilePath,
        isTest: true,
        pairedWith: targetFile.id,
        content: `import { ${funcName} } from '../${targetFile.name.replace(/\.[^/.]+$/, "")}';\n\ndescribe('${targetFile.name}', () => {\n  test('should verify ${funcName} behavior', () => {\n    // TODO: Add assertions\n  });\n});`,
        testCases: [
          { id: `tc-${Date.now()}`, name: `should verify ${funcName} behavior`, targets: funcName, status: "passed" }
        ]
      };

      updatedFiles[fileIndex] = { ...targetFile, pairedWith: testFileId };
      updatedFiles.push(testFile);
    } else {
      const testFileIndex = updatedFiles.findIndex(f => f.id === testFile.id);
      const updatedTestCases = [
        ...testFile.testCases,
        { id: `tc-${Date.now()}`, name: `should verify ${funcName} behavior`, targets: funcName, status: "passed" }
      ];
      const updatedContent = testFile.content + `\n\n  test('should verify ${funcName} behavior', () => {\n    // Auto-generated test case\n  });`;
      
      updatedFiles[testFileIndex] = {
        ...testFile,
        testCases: updatedTestCases,
        content: updatedContent
      };
      testFile = updatedFiles[testFileIndex];
    }

    setFiles(updatedFiles);
    setSelectedFileId(testFile.id);
  };

  const runTests = () => {
    setTestRunnerStatus('running');
    setTerminalLogs(['$ vitest run', 'Searching for test files...']);

    const testFiles = files.filter(f => f.isTest);
    let currentLogIndex = 0;

    const interval = setInterval(() => {
      if (currentLogIndex < testFiles.length) {
        const tf = testFiles[currentLogIndex];
        setTerminalLogs(prev => [
          ...prev,
          ` RUNS  ${tf.path}`,
          ` PASS  ${tf.path} (${tf.testCases.length} passed)`
        ]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        const totalTests = testFiles.reduce((acc, f) => acc + f.testCases.length, 0);
        setTerminalLogs(prev => [
          ...prev,
          `\nTest Suites: ${testFiles.length} passed, ${testFiles.length} total`,
          `Tests:       ${totalTests} passed, ${totalTests} total`,
          `Snapshots:   0 total`,
          `Time:        0.38s`,
          `\n✓ All tests passed successfully!`
        ]);
        setTestRunnerStatus('passed');
      }
    }, 600);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Header 
        testFirstMode={testFirstMode} 
        setTestFirstMode={setTestFirstMode} 
        onReset={handleReset}
        files={files}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: File List */}
        <div className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col">
          <FileList 
            files={files} 
            selectedFileId={selectedFileId} 
            setSelectedFileId={setSelectedFileId} 
            testFirstMode={testFirstMode}
            setHighlightedFunction={setHighlightedFunction}
          />
        </div>

        {/* Middle Panel: Code Diff Viewer */}
        <div className="flex-1 flex flex-col bg-slate-950 border-r border-slate-800">
          <DiffViewer 
            file={files.find(f => f.id === selectedFileId)} 
            highlightedFunction={highlightedFunction}
            setHighlightedFunction={setHighlightedFunction}
            activeTestCase={activeTestCase}
            onTestCaseClick={handleTestCaseClick}
            setSelectedFileId={setSelectedFileId}
          />
        </div>

        {/* Right Panel: TDD Assistant & Test Runner */}
        <div className="w-96 bg-slate-900 flex flex-col overflow-y-auto p-4 space-y-6">
          <CoverageStats 
            files={files} 
            onGenerateTest={handleGenerateTest}
            setSelectedFileId={setSelectedFileId}
            setHighlightedFunction={setHighlightedFunction}
          />
          <TestRunner 
            status={testRunnerStatus} 
            logs={terminalLogs} 
            onRun={runTests} 
            onClear={() => setTerminalLogs([])}
          />
        </div>
      </div>
    </div>
  );
}