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