// PR Quest API Client with dual-mode SQLite backend sync and resilient offline cache

const API_BASE = '/api';

// Fallback preset users if backend is starting or offline
export const PRESET_USERS = [
  {
    id: 'alex_staff',
    username: 'alex',
    name: 'Alex Chen',
    role: 'Staff Infrastructure Engineer',
    avatar: '👨‍💻'
  },
  {
    id: 'sarah_sec',
    username: 'sarah',
    name: 'Sarah Lin',
    role: 'AppSec Architect',
    avatar: '👩‍💻'
  },
  {
    id: 'marcus_qa',
    username: 'marcus',
    name: 'Marcus Brody',
    role: 'QA & Reliability Lead',
    avatar: '🧑‍🔬'
  }
];

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('pr_quest_token') || null;
    this.currentUser = this.getInitialUser();
    this.isOnline = true;
  }

  getInitialUser() {
    try {
      const saved = localStorage.getItem('pr_quest_user');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return PRESET_USERS[0]; // Default: Alex Chen (Staff Eng)
  }

  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem('pr_quest_user', JSON.stringify(user));
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('pr_quest_token', token);
    } else {
      localStorage.removeItem('pr_quest_token');
    }
  }

  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      this.isOnline = res.ok;
      return res.ok;
    } catch (_) {
      this.isOnline = false;
      return false;
    }
  }

  async getPersonas() {
    try {
      const res = await fetch(`${API_BASE}/users/personas`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
    return PRESET_USERS;
  }

  async login({ personaId, username, password }) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId, username, password })
      });
      if (res.ok) {
        const data = await res.json();
        this.setToken(data.token);
        this.setCurrentUser(data.user);
        return { success: true, user: data.user };
      }
      const err = await res.json();
      return { success: false, error: err.error || 'Login failed' };
    } catch (e) {
      // Local fallback for 1-click persona switch
      if (personaId) {
        const found = PRESET_USERS.find(p => p.id === personaId);
        if (found) {
          this.setCurrentUser(found);
          return { success: true, user: found };
        }
      }
      return { success: false, error: 'Server unreachable. Running in local mode.' };
    }
  }

  async register({ username, password, name, role, avatar }) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, role, avatar })
      });
      if (res.ok) {
        const data = await res.json();
        this.setToken(data.token);
        this.setCurrentUser(data.user);
        return { success: true, user: data.user };
      }
      const err = await res.json();
      return { success: false, error: err.error || 'Registration failed' };
    } catch (_) {
      const localUser = {
        id: `user_${Date.now()}`,
        username,
        name,
        role: role || 'Code Reviewer',
        avatar: avatar || '👤'
      };
      this.setCurrentUser(localUser);
      return { success: true, user: localUser };
    }
  }

  logout() {
    this.setToken(null);
    this.setCurrentUser(PRESET_USERS[0]);
  }

  authHeaders(extra = {}) {
    const userId = this.currentUser?.id || 'alex_staff';
    const headers = {
      'x-user-id': userId,
      ...extra
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  /** Start GitHub OAuth in the browser (full-page redirect). */
  startGithubOAuth() {
    const userId = this.currentUser?.id || 'alex_staff';
    window.location.href = `${API_BASE}/github/oauth/start?userId=${encodeURIComponent(userId)}`;
  }

  async getGithubStatus() {
    try {
      const res = await fetch(`${API_BASE}/github/status`, {
        headers: this.authHeaders(),
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) return { linked: false, login: null, avatarUrl: null, configured: false };
      return await res.json();
    } catch (_) {
      return { linked: false, login: null, avatarUrl: null, configured: false };
    }
  }

  async unlinkGithub() {
    try {
      const res = await fetch(`${API_BASE}/github/unlink`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ userId: this.currentUser?.id })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to unlink GitHub' };
      }
      return { success: true, linked: false };
    } catch (_) {
      return { success: false, error: 'Server unreachable' };
    }
  }

  /** Link GitHub by pasting a personal access token (stored server-side only). */
  async linkGithubWithToken(token) {
    try {
      const res = await fetch(`${API_BASE}/github/link-token`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          userId: this.currentUser?.id,
          token: String(token || '').trim()
        }),
        signal: AbortSignal.timeout(10000)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to link GitHub token' };
      }
      return {
        success: true,
        linked: true,
        login: data.login,
        avatarUrl: data.avatarUrl || null
      };
    } catch (_) {
      return { success: false, error: 'Server unreachable' };
    }
  }

  async listGithubRepos() {
    try {
      const res = await fetch(`${API_BASE}/github/repos`, {
        headers: this.authHeaders(),
        signal: AbortSignal.timeout(15000)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to list repositories', repos: [] };
      }
      return { success: true, repos: data.repos || [], count: data.count || 0 };
    } catch (_) {
      return { success: false, error: 'Server unreachable', repos: [] };
    }
  }

  async listQueries() {
    try {
      const res = await fetch(`${API_BASE}/queries`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('pr_quest_queries_cache', JSON.stringify(data));
        return data;
      }
    } catch (_) {}

    // Fallback to cached queries or defaults
    const cached = localStorage.getItem('pr_quest_queries_cache');
    if (cached) {
      try { return JSON.parse(cached); } catch (_) {}
    }
    return [
      {
        query_id: 'PR-101',
        title: 'PR #101: Session Token Rotation & Salt Validation',
        updated_at: new Date().toISOString(),
        totalFiles: 5,
        reviewedFiles: 2,
        flagsCount: 1,
        verdictsCount: 1
      },
      {
        query_id: 'PR-102',
        title: 'PR #102: Distributed Redis Token Bucket Rate Limiter',
        updated_at: new Date().toISOString(),
        totalFiles: 1,
        reviewedFiles: 0,
        flagsCount: 0,
        verdictsCount: 0
      }
    ];
  }

  async getQueryState(queryId) {
    const userId = this.currentUser?.id || 'alex_staff';
    try {
      const res = await fetch(`${API_BASE}/state?query=${encodeURIComponent(queryId)}&userId=${encodeURIComponent(userId)}`, {
        headers: { 'x-user-id': userId },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        // Cache locally
        localStorage.setItem(`pr_quest_query_${queryId}`, JSON.stringify(data));
        return { success: true, data, isOnline: true };
      }
    } catch (_) {}

    // Fallback: check local storage cache
    const cached = localStorage.getItem(`pr_quest_query_${queryId}`);
    if (cached) {
      try {
        return { success: true, data: JSON.parse(cached), isOnline: false };
      } catch (_) {}
    }

    return { success: false, error: 'Query not found', isOnline: false };
  }

  async saveQueryState(queryId, title, state, userProgress) {
    const userId = this.currentUser?.id || 'alex_staff';
    // Always update local cache immediately
    const cachePayload = { queryId, title, state, userProgress, updatedAt: new Date().toISOString() };
    localStorage.setItem(`pr_quest_query_${queryId}`, JSON.stringify(cachePayload));

    try {
      const res = await fetch(`${API_BASE}/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ queryId, title, state, userProgress, userId })
      });
      if (res.ok) {
        return { success: true, isOnline: true };
      }
    } catch (_) {}

    return { success: true, isOnline: false };
  }

  async addComment(queryId, fileId, commentPayload) {
    const userId = this.currentUser?.id || 'alex_staff';
    const enrichedComment = {
      authorId: userId,
      authorName: this.currentUser?.name || 'Reviewer',
      authorRole: this.currentUser?.role || 'Code Reviewer',
      authorAvatar: this.currentUser?.avatar || '👤',
      ...commentPayload
    };

    try {
      const res = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ queryId, fileId, comment: enrichedComment })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          comment: data.comment,
          githubSync: data.githubSync || null,
          isOnline: true
        };
      }
    } catch (_) {}

    // Offline fallback: construct comment locally
    const localComment = {
      id: `c_local_${Date.now()}`,
      ...enrichedComment,
      timestamp: 'Just now',
      resolved: false
    };
    return { success: true, comment: localComment, githubSync: null, isOnline: false };
  }

  async submitVerdict(queryId, verdictPayload) {
    const userId = this.currentUser?.id || 'alex_staff';
    const payload = {
      userId,
      userName: this.currentUser?.name || 'Reviewer',
      userRole: this.currentUser?.role || 'Code Reviewer',
      userAvatar: this.currentUser?.avatar || '👤',
      ...verdictPayload
    };

    try {
      const res = await fetch(`${API_BASE}/verdict`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ queryId, verdict: payload })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          verdicts: data.verdicts,
          githubSync: data.githubSync || null,
          isOnline: true
        };
      }
    } catch (_) {}

    return { success: true, verdict: payload, githubSync: null, isOnline: false };
  }

  /**
   * Fetch open PRs for a repo URL (or owner/repo). Uses linked GitHub token when available.
   */
  async fetchOpenPullRequests(repoUrl) {
    try {
      const res = await fetch(`${API_BASE}/github/open-prs`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ repoUrl }),
        signal: AbortSignal.timeout(15000)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const hint = (res.status >= 500 && !data.error)
          ? 'API server not running. Start it with: npm run server'
          : (data.error || `Failed to load PRs (${res.status})`);
        return { success: false, error: hint };
      }
      return {
        success: true,
        owner: data.owner,
        repo: data.repo,
        repoUrl: data.repoUrl,
        count: data.count,
        pullRequests: data.pullRequests || [],
        authenticated: Boolean(data.authenticated)
      };
    } catch (_) {
      return { success: false, error: 'Server unreachable. Start the API server with: npm run server' };
    }
  }

  /**
   * Load a GitHub PR (files + diffs) into a review workspace payload.
   */
  async fetchGitHubPullRequest(owner, repo, number) {
    try {
      const res = await fetch(
        `${API_BASE}/github/pr/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(number)}`,
        {
          headers: this.authHeaders(),
          signal: AbortSignal.timeout(20000)
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const hint = (res.status >= 500 && !data.error)
          ? 'API server not running. Start it with: npm run server'
          : (data.error || `Failed to load PR #${number}`);
        return { success: false, error: hint };
      }
      return { success: true, ...data };
    } catch (_) {
      return { success: false, error: 'Server unreachable. Start the API server with: npm run server' };
    }
  }
}

export const api = new ApiClient();
