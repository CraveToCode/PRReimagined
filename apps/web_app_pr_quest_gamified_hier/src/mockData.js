export const initialJiraTicket = {
  id: "PROJ-402",
  title: "Secure Token-Based Session Management & Rotation",
  description: "Implement secure JWT token storage, automatic rotation, and a React context provider to manage user sessions with idle timeout. Ensure high-risk API clients intercept expired tokens and renew them seamlessly.",
  criteria: [
    { id: "AC-1", text: "Implement secure JWT token storage and rotation in SessionManager", completed: false },
    { id: "AC-2", text: "Add automatic token refresh interceptor in ApiClient", completed: false },
    { id: "AC-3", text: "Create a persistent SessionProvider React context with idle timeout", completed: false },
    { id: "AC-4", text: "Write comprehensive unit tests for token expiration and renewal", completed: false }
  ]
};

export const initialFiles = [
  {
    id: "file-1",
    path: "src/services/SessionManager.js",
    tier: "Tier 1: Core Logic",
    importance: 95,
    specTag: "AC-1",
    status: "pending",
    comments: [
      { id: 1, line: 12, author: "AgenticBot", text: "Using localStorage for fallback, but secure cookies are preferred in production.", resolved: false }
    ],
    diffChunks: [
      {
        header: "@@ -1,15 +1,35 @@",
        lines: [
          { type: "normal", content: "export class SessionManager {" },
          { type: "normal", content: "  constructor() {" },
          { type: "delete", content: "    this.token = null;" },
          { type: "add", content: "    this.token = localStorage.getItem('session_token');" },
          { type: "add", content: "    this.refreshToken = localStorage.getItem('refresh_token');" },
          { type: "add", content: "    this.rotationTimer = null;" },
          { type: "normal", content: "  }" },
          { type: "normal", content: "" },
          { type: "add", content: "  async rotateSessionToken() {" },
          { type: "add", content: "    if (!this.refreshToken) throw new Error('No refresh token available');" },
          { type: "add", content: "    const response = await fetch('/api/auth/rotate', {" },
          { type: "add", content: "      method: 'POST'," },
          { type: "add", content: "      headers: { 'Content-Type': 'application/json' }," },
          { type: "add", content: "      body: JSON.stringify({ refresh_token: this.refreshToken })" },
          { type: "add", content: "    });" },
          { type: "add", content: "    const data = await response.json();" },
          { type: "add", content: "    this.token = data.accessToken;" },
          { type: "add", content: "    this.refreshToken = data.refreshToken;" },
          { type: "add", content: "    localStorage.setItem('session_token', this.token);" },
          { type: "add", content: "    localStorage.setItem('refresh_token', this.refreshToken);" },
          { type: "add", content: "    return this.token;" },
          { type: "add", content: "  }" }
        ]
      }
    ]
  },
  {
    id: "file-2",
    path: "src/api/ApiClient.js",
    tier: "Tier 1: Core Logic",
    importance: 85,
    specTag: "AC-2",
    status: "pending",
    comments: [],
    diffChunks: [
      {
        header: "@@ -22,10 +22,24 @@",
        lines: [
          { type: "normal", content: "apiClient.interceptors.response.use(" },
          { type: "normal", content: "  response => response," },
          { type: "delete", content: "  error => Promise.reject(error)" },
          { type: "add", content: "  async error => {" },
          { type: "add", content: "    const originalRequest = error.config;" },
          { type: "add", content: "    if (error.response.status === 401 && !originalRequest._retry) {" },
          { type: "add", content: "      originalRequest._retry = true;" },
          { type: "add", content: "      try {" },
          { type: "add", content: "        const newToken = await sessionManager.rotateSessionToken();" },
          { type: "add", content: "        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;" },
          { type: "add", content: "        return apiClient(originalRequest);" },
          { type: "add", content: "      } catch (refreshError) {" },
          { type: "add", content: "        window.location.href = '/login';" },
          { type: "add", content: "        return Promise.reject(refreshError);" },
          { type: "add", content: "      }" },
          { type: "add", content: "    }" },
          { type: "add", content: "    return Promise.reject(error);" },
          { type: "add", content: "  }" }
        ]
      }
    ]
  },
  {
    id: "file-3",
    path: "src/context/SessionContext.jsx",
    tier: "Tier 2: Consumer",
    importance: 70,
    specTag: "AC-3",
    status: "pending",
    comments: [],
    diffChunks: [
      {
        header: "@@ -1,12 +1,28 @@",
        lines: [
          { type: "add", content: "import React, { createContext, useContext, useEffect, useState } from 'react';" },
          { type: "add", content: "import { SessionManager } from '../services/SessionManager';" },
          { type: "add", content: "const SessionContext = createContext(null);" },
          { type: "add", content: "const sessionManager = new SessionManager();" },
          { type: "add", content: "export const SessionProvider = ({ children }) => {" },
          { type: "add", content: "  const [user, setUser] = useState(null);" },
          { type: "add", content: "  useEffect(() => {" },
          { type: "add", content: "    const interval = setInterval(() => {" },
          { type: "add", content: "      sessionManager.rotateSessionToken().catch(() => setUser(null));" },
          { type: "add", content: "    }, 14 * 60 * 1000); // 14 minutes" },
          { type: "add", content: "    return () => clearInterval(interval);" },
          { type: "add", content: "  }, []);" },
          { type: "add", content: "  return (" },
          { type: "add", content: "    <SessionContext.Provider value={{ user, sessionManager }}>" },
          { type: "add", content: "      {children}" },
          { type: "add", content: "    </SessionContext.Provider>" },
          { type: "add", content: "  );" },
          { type: "add", content: "};" }
        ]
      }
    ]
  },
  {
    id: "file-4",
    path: "src/components/ProtectedRoute.jsx",
    tier: "Tier 2: Consumer",
    importance: 50,
    specTag: "AC-3",
    status: "pending",
    comments: [],
    diffChunks: [
      {
        header: "@@ -5,5 +5,10 @@",
        lines: [
          { type: "normal", content: "export const ProtectedRoute = ({ children }) => {" },
          { type: "delete", content: "  const isAuthenticated = !!localStorage.getItem('token');" },
          { type: "add", content: "  const { user } = useContext(SessionContext);" },
          { type: "add", content: "  const isAuthenticated = !!user;" },
          { type: "normal", content: "  return isAuthenticated ? children : <Navigate to='/login' />;" },
          { type: "normal", content: "};" }
        ]
       }
    ]
  },
  {
    id: "file-5",
    path: "src/tests/SessionManager.test.js",
    tier: "Tier 3: Support",
    importance: 30,
    specTag: "AC-4",
    status: "pending",
    comments: [],
    diffChunks: [
      {
        header: "@@ -1,8 +1,18 @@",
        lines: [
          { type: "add", content: "import { SessionManager } from '../services/SessionManager';" },
          { type: "add", content: "describe('SessionManager Token Rotation', () => {" },
          { type: "add", content: "  it('should successfully rotate token and store in localStorage', async () => {" },
          { type: "add", content: "    const manager = new SessionManager();" },
          { type: "add", content: "    global.fetch = jest.fn().mockImplementation(() =>" },
          { type: "add", content: "      Promise.resolve({ json: () => ({ accessToken: 'new_at', refreshToken: 'new_rt' }) })" },
          { type: "add", content: "    );" },
          { type: "add", content: "    const token = await manager.rotateSessionToken();" },
          { type: "add", content: "    expect(token).toBe('new_at');" },
          { type: "add", content: "    expect(localStorage.getItem('session_token')).toBe('new_at');" },
          { type: "add", content: "  });" },
          { type: "add", content: "});" }
        ]
      }
    ]
  }
];

export const initialReferences = {
  "src/services/SessionManager.js": [
    { path: "src/api/ApiClient.js", risk: "High Impact", type: "Direct Consumer" },
    { path: "src/context/SessionContext.jsx", risk: "High Impact", type: "Direct Consumer" },
    { path: "src/tests/SessionManager.test.js", risk: "Test", type: "Verification" }
  ],
  "src/api/ApiClient.js": [
    { path: "src/context/SessionContext.jsx", risk: "High Impact", type: "Direct Consumer" }
  ],
  "src/context/SessionContext.jsx": [
    { path: "src/components/ProtectedRoute.jsx", risk: "Medium Impact", type: "Consumer" }
  ],
  "src/components/ProtectedRoute.jsx": [],
  "src/tests/SessionManager.test.js": []
};

export const defaultArchitecture = `
# Session & Authentication Architecture

## Overview
This system implements a secure, client-side token rotation mechanism to prevent session hijacking and minimize token lifespan.

## Components
1. **SessionManager (Core)**: Handles raw token storage (localStorage fallback) and communicates with \`/api/auth/rotate\` to fetch fresh access tokens.
2. **ApiClient (Network Interceptor)**: Intercepts outgoing requests. If a 401 Unauthorized error is received, it pauses requests, triggers \`SessionManager.rotateSessionToken()\`, and retries the failed request.
3. **SessionContext (State)**: React Context that wraps the application, providing user state and triggering periodic background rotation (every 14 minutes).
4. **ProtectedRoute (UI Guard)**: Restricts access to authenticated routes based on the SessionContext state.
`;

export const initialArchitectureMermaid = `graph TD
  SM["SessionManager (Tier 1 Core)<br/>Token Storage & Crypto Rotation"] -->|POST /api/auth/rotate| API_SRV["Auth Server"]
  API["ApiClient (Tier 1 Core)<br/>Axios 401 Error Interceptor"] -->|Invokes rotateSessionToken()| SM
  API -->|Retries with Bearer JWT| REST["Protected REST APIs"]
  SC["SessionProvider (Tier 2 Consumer)<br/>React Context & Idle Polling"] -->|Periodic 14-min refresh| SM
  PR["ProtectedRoute (Tier 2 Consumer)<br/>UI Route Navigation Guard"] -->|Subscribes to { user }| SC
  TEST["SessionManager.test.js (Tier 3)<br/>Unit Tests & Assertions"] -->|Verifies Token Rotation| SM

  classDef core fill:#FBEFEF,stroke:#C35832,stroke-width:2px,color:#242220;
  classDef consumer fill:#FFFDF9,stroke:#D08A29,stroke-width:2px,color:#242220;
  classDef support fill:#F4F8F5,stroke:#4F6D56,stroke-width:2px,color:#242220;
  class SM,API core;
  class SC,PR consumer;
  class TEST support;`;

export const architectureStandards = [
  {
    id: "STD-SEC-01",
    standardFile: "docs/standards/token-security.md",
    category: "Security & Storage",
    title: "Secure Storage Fallback Isolation",
    description: "Verify that localStorage is guarded and token access is abstracted inside SessionManager without leaking raw keys to window.",
    completed: false
  },
  {
    id: "STD-NET-02",
    standardFile: "docs/standards/api-resilience.md",
    category: "Network Resilience",
    title: "Infinite 401 Loop Prevention",
    description: "Verify that ApiClient sets an idempotent _retry guard flag on failed requests before attempting token rotation.",
    completed: false
  },
  {
    id: "STD-ISO-03",
    standardFile: "docs/standards/context-lifecycle.md",
    category: "Architecture Boundaries",
    title: "Context-to-Core Unidirectional Data Flow",
    description: "Ensure SessionContext subscribes to SessionManager state rather than duplicating token logic or mutating storage directly.",
    completed: false
  },
  {
    id: "STD-ERR-04",
    standardFile: "docs/standards/error-recovery.md",
    category: "Error Recovery",
    title: "Graceful Refresh Rejection & Redirection",
    description: "Confirm that unrecoverable refresh failures trigger user logout and redirection to /login instead of unhandled promise rejections.",
    completed: false
  }
];

export const symbolCatalog = {
  "rotateSessionToken": {
    name: "rotateSessionToken",
    signature: "async rotateSessionToken()",
    type: "Method",
    file: "src/services/SessionManager.js",
    tier: "Tier 1: Core Logic",
    isModified: true,
    modifiedCode: `async rotateSessionToken() {
  if (!this.refreshToken) throw new Error('No refresh token available');
  const response = await fetch('/api/auth/rotate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: this.refreshToken })
  });
  const data = await response.json();
  this.token = data.accessToken;
  this.refreshToken = data.refreshToken;
  localStorage.setItem('session_token', this.token);
  localStorage.setItem('refresh_token', this.refreshToken);
  return this.token;
}`,
    originalCode: `// Original codebase implementation (Before PR)
async rotateSessionToken() {
  // Legacy: Did not support refresh token rotation
  throw new Error('rotateSessionToken not implemented in legacy SessionManager');
}`,
    matches: [
      {
        id: "match-1",
        label: "Definition: SessionManager.js:36",
        role: "Primary Definition (Modified)",
        file: "src/services/SessionManager.js",
        line: 36,
        isDefinition: true
      },
      {
        id: "match-2",
        label: "Call-Site: ApiClient.js:74",
        role: "Consumer in Interceptor (Modified)",
        file: "src/api/ApiClient.js",
        line: 74,
        isDefinition: false
      },
      {
        id: "match-3",
        label: "Call-Site: SessionContext.jsx:108",
        role: "Consumer in React Interval (New)",
        file: "src/context/SessionContext.jsx",
        line: 108,
        isDefinition: false
      }
    ],
    callers: [
      { file: "src/api/ApiClient.js", line: 74, context: "const newToken = await sessionManager.rotateSessionToken();" },
      { file: "src/context/SessionContext.jsx", line: 108, context: "sessionManager.rotateSessionToken().catch(() => setUser(null));" },
      { file: "src/tests/SessionManager.test.js", line: 163, context: "const token = await manager.rotateSessionToken();" }
    ]
  },
  "apiClient.interceptors.response.use": {
    name: "response.use",
    signature: "apiClient.interceptors.response.use(onSuccess, onError)",
    type: "Interceptor",
    file: "src/api/ApiClient.js",
    tier: "Tier 1: Core Logic",
    isModified: true,
    modifiedCode: `apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await sessionManager.rotateSessionToken();
        originalRequest.headers['Authorization'] = \`Bearer \${newToken}\`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);`,
    originalCode: `apiClient.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);`,
    matches: [
      {
        id: "match-api-1",
        label: "Definition: ApiClient.js:66",
        role: "Axios Response Interceptor (Modified)",
        file: "src/api/ApiClient.js",
        line: 66,
        isDefinition: true
      }
    ],
    callers: [
      { file: "src/context/SessionContext.jsx", line: 12, context: "All API consumer calls pass through this interceptor" }
    ]
  },
  "SessionProvider": {
    name: "SessionProvider",
    signature: "export const SessionProvider = ({ children }) => { ... }",
    type: "React Component",
    file: "src/context/SessionContext.jsx",
    tier: "Tier 2: Consumer",
    isModified: true,
    modifiedCode: `export const SessionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const interval = setInterval(() => {
      sessionManager.rotateSessionToken().catch(() => setUser(null));
    }, 14 * 60 * 1000); // 14 minutes
    return () => clearInterval(interval);
  }, []);
  return (
    <SessionContext.Provider value={{ user, sessionManager }}>
      {children}
    </SessionContext.Provider>
  );
};`,
    originalCode: `// Original codebase: SessionProvider did not exist (new module in this PR)`,
    matches: [
      {
        id: "match-sp-1",
        label: "Definition: SessionContext.jsx:104",
        role: "Context Provider (New)",
        file: "src/context/SessionContext.jsx",
        line: 104,
        isDefinition: true
      },
      {
        id: "match-sp-2",
        label: "Usage in ProtectedRoute.jsx:136",
        role: "Consumer Hook (useContext)",
        file: "src/components/ProtectedRoute.jsx",
        line: 136,
        isDefinition: false
      }
    ],
    callers: [
      { file: "src/components/ProtectedRoute.jsx", line: 136, context: "const { user } = useContext(SessionContext);" }
    ]
  },
  "ProtectedRoute": {
    name: "ProtectedRoute",
    signature: "export const ProtectedRoute = ({ children }) => { ... }",
    type: "React Component",
    file: "src/components/ProtectedRoute.jsx",
    tier: "Tier 2: Consumer",
    isModified: true,
    modifiedCode: `export const ProtectedRoute = ({ children }) => {
  const { user } = useContext(SessionContext);
  const isAuthenticated = !!user;
  return isAuthenticated ? children : <Navigate to='/login' />;
};`,
    originalCode: `export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to='/login' />;
};`,
    matches: [
      {
        id: "match-pr-1",
        label: "Definition: ProtectedRoute.jsx:134",
        role: "Route Guard (Modified)",
        file: "src/components/ProtectedRoute.jsx",
        line: 134,
        isDefinition: true
      }
    ],
    callers: [
      { file: "src/App.jsx", line: 200, context: "Wrapped around authenticated router branches" }
    ]
  }
};

export const initialTestSuites = [
  {
    id: "test-1",
    suiteName: "SessionManager Token Rotation",
    testName: "should successfully rotate token and store in localStorage",
    file: "src/tests/SessionManager.test.js",
    targetSymbol: "rotateSessionToken",
    targetFile: "src/services/SessionManager.js",
    targetLines: "36-49",
    status: "pass",
    executionMs: 14,
    assertionsCount: 2,
    code: `it('should successfully rotate token and store in localStorage', async () => {
  const manager = new SessionManager();
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      json: () => ({ accessToken: 'new_at', refreshToken: 'new_rt' })
    })
  );
  const token = await manager.rotateSessionToken();
  expect(token).toBe('new_at');
  expect(localStorage.getItem('session_token')).toBe('new_at');
});`,
    testedFunctionCode: `// Target Function: SessionManager.rotateSessionToken()
async rotateSessionToken() {
  if (!this.refreshToken) throw new Error('No refresh token available');
  const response = await fetch('/api/auth/rotate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: this.refreshToken })
  });
  const data = await response.json();
  this.token = data.accessToken;
  this.refreshToken = data.refreshToken;
  localStorage.setItem('session_token', this.token);
  localStorage.setItem('refresh_token', this.refreshToken);
  return this.token;
}`,
    notes: "Verified: Assertions match the updated storage keys ('session_token'). Mocked fetch resolves valid payload."
  },
  {
    id: "test-2",
    suiteName: "ApiClient Interceptor",
    testName: "should retry original request with new token on 401 response",
    file: "src/tests/ApiClient.test.js",
    targetSymbol: "apiClient.interceptors.response.use",
    targetFile: "src/api/ApiClient.js",
    targetLines: "66-84",
    status: "pass",
    executionMs: 22,
    assertionsCount: 3,
    code: `it('should retry original request with new token on 401 response', async () => {
  const mockError = { response: { status: 401 }, config: { headers: {} } };
  jest.spyOn(sessionManager, 'rotateSessionToken').mockResolvedValue('fresh_token_123');
  
  const result = await onResponseError(mockError);
  expect(mockError.config._retry).toBe(true);
  expect(mockError.config.headers['Authorization']).toBe('Bearer fresh_token_123');
});`,
    testedFunctionCode: `// Target Function: ApiClient 401 Interceptor
async error => {
  const originalRequest = error.config;
  if (error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    try {
      const newToken = await sessionManager.rotateSessionToken();
      originalRequest.headers['Authorization'] = \`Bearer \${newToken}\`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
  return Promise.reject(error);
}`,
    notes: "Verified: Guard flag _retry is properly asserted to prevent infinite recursive loop."
  },
  {
    id: "test-3",
    suiteName: "SessionManager Error Handling",
    testName: "should throw descriptive error when refresh token is missing",
    file: "src/tests/SessionManager.test.js",
    targetSymbol: "rotateSessionToken",
    targetFile: "src/services/SessionManager.js",
    targetLines: "37",
    status: "warning",
    executionMs: 0,
    assertionsCount: 0,
    code: `// ⚠️ POTENTIAL GAP IDENTIFIED BY AGENTIC REVIEWER:
// PR currently lacks negative unit test for empty refresh token:
it.todo('should throw Error("No refresh token available") if refreshToken is empty');`,
    testedFunctionCode: `// Line 37 in SessionManager.js:
if (!this.refreshToken) throw new Error('No refresh token available');`,
    notes: "Reviewer Flag: Missing unit test covering line 37 edge case. Recommended to add before approving."
  },
  {
    id: "test-4",
    suiteName: "SessionContext Lifecycle",
    testName: "should clear rotation interval timer on unmount",
    file: "src/tests/SessionContext.test.js",
    targetSymbol: "SessionProvider",
    targetFile: "src/context/SessionContext.jsx",
    targetLines: "106-111",
    status: "pass",
    executionMs: 18,
    assertionsCount: 1,
    code: `it('should clear rotation interval timer on unmount', () => {
  jest.useFakeTimers();
  const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
  const { unmount } = render(<SessionProvider><div>App</div></SessionProvider>);
  unmount();
  expect(clearIntervalSpy).toHaveBeenCalled();
});`,
    testedFunctionCode: `// Target Function: SessionContext useEffect cleanup
useEffect(() => {
  const interval = setInterval(() => {
    sessionManager.rotateSessionToken().catch(() => setUser(null));
  }, 14 * 60 * 1000); // 14 minutes
  return () => clearInterval(interval);
}, []);`,
    notes: "Verified: Memory leak prevention is properly tested."
  }
];