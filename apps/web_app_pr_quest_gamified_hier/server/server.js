import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db, PRESET_USERS } from './db.js';
import {
  parseRepoInput,
  parseGithubQueryId,
  listOpenPullRequests,
  fetchPullRequestWorkspace,
  buildOAuthAuthorizeUrl,
  exchangeOAuthCode,
  getAuthenticatedUser,
  listUserRepos,
  postPullRequestComment,
  submitPullRequestReview
} from './github.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

/** Lightweight .env loader (no dotenv dependency). */
function loadEnvFile() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (_) {}
}
loadEnvFile();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5174';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_OAUTH_CALLBACK =
  process.env.GITHUB_OAUTH_CALLBACK || `http://localhost:${PORT}/api/github/oauth/callback`;

/** In-memory OAuth state → userId (hackathon-local; expires after use). */
const oauthStates = new Map();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function resolveUserId(req) {
  const authHeader = req.headers.authorization;
  return (
    req.headers['x-user-id'] ||
    req.query.userId ||
    req.body?.userId ||
    (authHeader ? authHeader.replace(/^Bearer\s+/i, '').split('_')[1] : null) ||
    null
  );
}

function getLinkedToken(userId) {
  if (!userId) return null;
  const link = db.getGithubLink(userId);
  return link?.accessToken || null;
}

function publicGithubStatus(link) {
  if (!link) return { linked: false, login: null, avatarUrl: null };
  return { linked: true, login: link.login, avatarUrl: link.avatarUrl || null };
}

async function maybeWritebackComment(queryId, userId, comment, filePath) {
  const parsed = parseGithubQueryId(queryId);
  if (!parsed) return { attempted: false, synced: false, reason: 'not_github_query' };

  // File-level Approve is local progress only — do not post to the GitHub PR.
  // Final Submit Review Verdict uses /api/verdict → review writeback instead.
  if ((comment.type || 'note') === 'approval') {
    return { attempted: false, synced: false, reason: 'local_file_approval' };
  }

  const token = getLinkedToken(userId);
  if (!token) return { attempted: false, synced: false, reason: 'github_not_linked' };

  try {
    const queryRecord = db.getQueryState(queryId);
    const headSha =
      queryRecord?.state?.meta?.headSha ||
      queryRecord?.state?.githubMeta?.headSha ||
      null;
    const line = comment.line ?? comment.startLine ?? null;
    const path = comment.path || filePath || null;
    const result = await postPullRequestComment({
      owner: parsed.owner,
      repo: parsed.repo,
      number: parsed.number,
      body: `[${comment.type || 'note'}] ${comment.text}`,
      path,
      line,
      side: comment.side || 'RIGHT',
      commitId: headSha,
      accessToken: token
    });
    return { attempted: true, synced: true, ...result };
  } catch (err) {
    console.warn('[github] comment writeback failed:', err.message);
    return { attempted: true, synced: false, error: err.message };
  }
}

async function maybeWritebackVerdict(queryId, userId, verdictEntry) {
  const parsed = parseGithubQueryId(queryId);
  if (!parsed) return { attempted: false, synced: false, reason: 'not_github_query' };
  const token = getLinkedToken(userId);
  if (!token) return { attempted: false, synced: false, reason: 'github_not_linked' };

  try {
    const result = await submitPullRequestReview({
      owner: parsed.owner,
      repo: parsed.repo,
      number: parsed.number,
      verdict: verdictEntry.verdict,
      notes: verdictEntry.notes,
      accessToken: token
    });
    return { attempted: true, synced: true, ...result };
  } catch (err) {
    console.warn('[github] review writeback failed:', err.message);
    return { attempted: true, synced: false, error: err.message };
  }
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- GitHub OAuth ---
app.get('/api/github/oauth/start', (req, res) => {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Sign in to the app before linking GitHub' });
  }
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'
    });
  }

  const state = crypto.randomBytes(24).toString('hex');
  oauthStates.set(state, { userId, createdAt: Date.now() });
  // Drop stale states (>15 min)
  for (const [key, value] of oauthStates.entries()) {
    if (Date.now() - value.createdAt > 15 * 60 * 1000) oauthStates.delete(key);
  }

  const url = buildOAuthAuthorizeUrl({
    clientId: GITHUB_CLIENT_ID,
    redirectUri: GITHUB_OAUTH_CALLBACK,
    state,
    scope: 'read:user repo'
  });
  return res.redirect(url);
});

app.get('/api/github/oauth/callback', async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;
  const frontendFail = `${FRONTEND_ORIGIN}/?github=error`;
  const frontendOk = `${FRONTEND_ORIGIN}/?github=linked`;

  if (error) {
    return res.redirect(`${frontendFail}&message=${encodeURIComponent(errorDescription || error)}`);
  }

  const pending = state ? oauthStates.get(String(state)) : null;
  if (!pending) {
    return res.redirect(`${frontendFail}&message=${encodeURIComponent('Invalid or expired OAuth state')}`);
  }
  oauthStates.delete(String(state));

  if (!code) {
    return res.redirect(`${frontendFail}&message=${encodeURIComponent('Missing OAuth code')}`);
  }

  try {
    const { accessToken } = await exchangeOAuthCode({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      code: String(code),
      redirectUri: GITHUB_OAUTH_CALLBACK
    });
    const ghUser = await getAuthenticatedUser(accessToken);
    db.upsertGithubLink(pending.userId, {
      githubUserId: ghUser.githubUserId,
      login: ghUser.login,
      accessToken,
      avatarUrl: ghUser.avatarUrl
    });
    return res.redirect(frontendOk);
  } catch (err) {
    console.error('[github] OAuth callback failed:', err.message);
    return res.redirect(`${frontendFail}&message=${encodeURIComponent(err.message || 'OAuth failed')}`);
  }
});

app.get('/api/github/status', (req, res) => {
  const userId = resolveUserId(req);
  const oauthConfigured = Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);
  if (!userId) {
    return res.json({
      linked: false,
      login: null,
      avatarUrl: null,
      configured: true, // PAT linking always available
      oauthConfigured,
      patLinking: true
    });
  }
  const link = db.getGithubLink(userId);
  return res.json({
    ...publicGithubStatus(link),
    configured: true,
    oauthConfigured,
    patLinking: true
  });
});

/** Link GitHub via personal access token (per app user; token never returned). */
app.post('/api/github/link-token', async (req, res) => {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Sign in required' });
  }

  const raw = req.body?.token || req.body?.accessToken || '';
  const accessToken = String(raw).trim();
  if (!accessToken) {
    return res.status(400).json({ error: 'A GitHub personal access token is required' });
  }
  if (accessToken.length < 20) {
    return res.status(400).json({ error: 'Token looks too short. Paste a full GitHub PAT.' });
  }

  try {
    const ghUser = await getAuthenticatedUser(accessToken);
    db.upsertGithubLink(userId, {
      githubUserId: ghUser.githubUserId,
      login: ghUser.login,
      accessToken,
      avatarUrl: ghUser.avatarUrl
    });
    return res.json({
      success: true,
      linked: true,
      login: ghUser.login,
      avatarUrl: ghUser.avatarUrl || null,
      method: 'pat'
    });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 401;
    return res.status(status).json({
      error: err.message || 'Invalid GitHub token'
    });
  }
});

app.post('/api/github/unlink', (req, res) => {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Sign in required' });
  }
  db.deleteGithubLink(userId);
  return res.json({ success: true, linked: false });
});

// List repos for the linked GitHub user
app.get('/api/github/repos', async (req, res) => {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Sign in required' });
  }
  const token = getLinkedToken(userId);
  if (!token) {
    return res.status(401).json({ error: 'GitHub account not linked' });
  }
  try {
    const repos = await listUserRepos(token);
    res.json({ success: true, count: repos.length, repos });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({ error: err.message || 'Failed to list repositories' });
  }
});

// List open PRs — uses linked token when available (private repos); else public/unauth
app.post('/api/github/open-prs', async (req, res) => {
  try {
    const repoInput = req.body?.repoUrl || req.body?.repo || '';
    const parsed = parseRepoInput(repoInput);
    if (!parsed) {
      return res.status(400).json({
        error: 'Invalid repository URL. Use https://github.com/owner/repo or owner/repo'
      });
    }

    const userId = resolveUserId(req);
    const accessToken = getLinkedToken(userId);
    const pullRequests = await listOpenPullRequests(parsed.owner, parsed.repo, accessToken);
    res.json({
      success: true,
      owner: parsed.owner,
      repo: parsed.repo,
      repoUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
      count: pullRequests.length,
      pullRequests,
      authenticated: Boolean(accessToken)
    });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({
      error: err.message || 'Failed to fetch open pull requests',
      rateLimitRemaining: err.rateLimitRemaining ?? null
    });
  }
});

// Fetch a single PR as a review workspace (linked token preferred)
app.get('/api/github/pr/:owner/:repo/:number', async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const prNumber = Number(number);
    if (!owner || !repo || !Number.isFinite(prNumber) || prNumber <= 0) {
      return res.status(400).json({ error: 'owner, repo, and a valid PR number are required' });
    }

    const userId = resolveUserId(req);
    const accessToken = getLinkedToken(userId);
    const workspace = await fetchPullRequestWorkspace(owner, repo, prNumber, accessToken);
    res.json({ success: true, ...workspace, authenticated: Boolean(accessToken) });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({
      error: err.message || 'Failed to fetch pull request',
      rateLimitRemaining: err.rateLimitRemaining ?? null
    });
  }
});

// Explicit writeback endpoints
app.post('/api/github/comment', async (req, res) => {
  const userId = resolveUserId(req);
  if (!userId) return res.status(401).json({ error: 'Sign in required' });
  const token = getLinkedToken(userId);
  if (!token) return res.status(401).json({ error: 'GitHub account not linked' });

  const { queryId, owner, repo, number, body, path: filePath, line, side, commitId } = req.body || {};
  const parsed = queryId ? parseGithubQueryId(queryId) : null;
  const target = {
    owner: owner || parsed?.owner,
    repo: repo || parsed?.repo,
    number: Number(number || parsed?.number)
  };
  if (!target.owner || !target.repo || !Number.isFinite(target.number) || !body) {
    return res.status(400).json({ error: 'owner/repo/number (or queryId) and body are required' });
  }

  try {
    let headSha = commitId || null;
    if (!headSha && queryId) {
      const st = db.getQueryState(queryId)?.state;
      headSha = st?.meta?.headSha || st?.githubMeta?.headSha || null;
    }
    const result = await postPullRequestComment({
      ...target,
      body,
      path: filePath,
      line,
      side,
      commitId: headSha,
      accessToken: token
    });
    res.json({ success: true, ...result });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({ error: err.message || 'Failed to post GitHub comment' });
  }
});

app.post('/api/github/review', async (req, res) => {
  const userId = resolveUserId(req);
  if (!userId) return res.status(401).json({ error: 'Sign in required' });
  const token = getLinkedToken(userId);
  if (!token) return res.status(401).json({ error: 'GitHub account not linked' });

  const { queryId, owner, repo, number, verdict, notes } = req.body || {};
  const parsed = queryId ? parseGithubQueryId(queryId) : null;
  const target = {
    owner: owner || parsed?.owner,
    repo: repo || parsed?.repo,
    number: Number(number || parsed?.number)
  };
  if (!target.owner || !target.repo || !Number.isFinite(target.number) || !verdict) {
    return res.status(400).json({ error: 'owner/repo/number (or queryId) and verdict are required' });
  }

  try {
    const result = await submitPullRequestReview({
      ...target,
      verdict,
      notes,
      accessToken: token
    });
    res.json({ success: true, ...result });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({ error: err.message || 'Failed to submit GitHub review' });
  }
});

// List Reviewer Personas (for instant 1-click login and demo)
app.get('/api/users/personas', (req, res) => {
  res.json(PRESET_USERS.map(({ password_hash, ...u }) => u));
});

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { personaId, username, password } = req.body;

  if (personaId) {
    const user = db.getUserById(personaId);
    if (!user) return res.status(404).json({ error: 'Persona not found' });
    const { password_hash, ...safeUser } = user;
    return res.json({ token: `token_${user.id}_${Date.now()}`, user: safeUser });
  }

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = db.getUserByUsername(username);
  if (!user || user.password_hash !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const { password_hash, ...safeUser } = user;
  return res.json({ token: `token_${user.id}_${Date.now()}`, user: safeUser });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, name, role, avatar } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, and name are required' });
  }

  const existing = db.getUserByUsername(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newUser = db.createUser(id, username, password, name, role || 'Code Reviewer', avatar || '👤');
  const { password_hash, ...safeUser } = newUser;
  return res.status(201).json({ token: `token_${newUser.id}_${Date.now()}`, user: safeUser });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = req.headers['x-user-id'] || (authHeader ? authHeader.replace('Bearer ', '').split('_')[1] : null);

  if (!userId) {
    // Default to first preset user (Alex Chen) if not explicitly authenticated
    const defaultUser = PRESET_USERS[0];
    const { password_hash, ...safeUser } = defaultUser;
    return res.json({ user: safeUser });
  }

  const user = db.getUserById(userId);
  if (!user) {
    const defaultUser = PRESET_USERS[0];
    const { password_hash, ...safeUser } = defaultUser;
    return res.json({ user: safeUser });
  }

  const { password_hash, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// List all review queries with progress metadata
app.get('/api/queries', (req, res) => {
  const queries = db.listQueries();
  res.json(queries);
});

// Get state for a specific review query
app.get('/api/state', (req, res) => {
  const queryId = req.query.query || 'PR-101';
  const userId = req.query.userId || req.headers['x-user-id'] || 'alex_staff';

  let queryRecord = db.getQueryState(queryId);

  // If new query not yet in DB, create initial placeholder
  // (Skip auto-seed for GitHub-imported queries — client supplies real PR data)
  if (!queryRecord) {
    if (String(queryId).startsWith('GH-')) {
      return res.status(404).json({ error: 'GitHub query not found', queryId });
    }
    const initialPr101 = db.getQueryState('PR-101');
    const newState = {
      ...(initialPr101 ? initialPr101.state : {}),
      queryId,
      title: `PR #${queryId}: Review Workspace`,
      verdicts: []
    };
    db.saveQueryState(queryId, `PR #${queryId}`, newState);
    queryRecord = db.getQueryState(queryId);
  }

  const userProgress = db.getUserProgress(userId, queryId) || {
    userId,
    queryId,
    level: 1,
    unlockedLevel: 1,
    xp: 0,
    awardedActions: []
  };

  res.json({
    queryId: queryRecord.query_id,
    title: queryRecord.title,
    state: queryRecord.state,
    userProgress,
    updatedAt: queryRecord.updated_at
  });
});

// Save review query state & user progress
app.post('/api/state', (req, res) => {
  const { queryId, title, state, userProgress, userId } = req.body;
  if (!queryId || !state) {
    return res.status(400).json({ error: 'queryId and state are required' });
  }

  db.saveQueryState(queryId, title, state);

  if (userId && userProgress) {
    db.saveUserProgress(userId, queryId, userProgress);
  }

  res.json({ success: true, updatedAt: new Date().toISOString() });
});

// Add comment or flag to a file (best-effort GitHub writeback for GH- queries)
app.post('/api/comments', async (req, res) => {
  const { queryId, fileId, comment } = req.body;
  if (!queryId || !fileId || !comment || !comment.text) {
    return res.status(400).json({ error: 'queryId, fileId, and comment text are required' });
  }

  const queryRecord = db.getQueryState(queryId);
  if (!queryRecord) {
    return res.status(404).json({ error: 'Query not found' });
  }

  const state = queryRecord.state;
  const targetFile = state.files.find(f => f.id === fileId);
  if (!targetFile) {
    return res.status(404).json({ error: 'File not found in query' });
  }

  const newComment = {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    authorId: comment.authorId || 'anonymous',
    authorName: comment.authorName || 'Reviewer',
    authorRole: comment.authorRole || 'Code Reviewer',
    authorAvatar: comment.authorAvatar || '👤',
    type: comment.type || 'note', // 'flag' | 'note' | 'approval'
    text: comment.text,
    path: comment.path || targetFile.path || null,
    line: comment.line ?? comment.startLine ?? null,
    side: comment.side || 'RIGHT',
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
    resolved: false
  };

  targetFile.comments = targetFile.comments || [];
  targetFile.comments.push(newComment);

  // If this is a flag, update file status and author reviewer status
  if (comment.type === 'flag') {
    targetFile.status = 'flagged';
    targetFile.reviewerStatuses = targetFile.reviewerStatuses || {};
    targetFile.reviewerStatuses[newComment.authorId] = {
      status: 'flagged',
      timestamp: 'Just now'
    };
  }

  db.saveQueryState(queryId, queryRecord.title, state);

  const syncUserId = comment.authorId || resolveUserId(req);
  const githubSync = await maybeWritebackComment(queryId, syncUserId, newComment, targetFile.path);
  if (githubSync.synced) {
    newComment.githubSync = githubSync;
    db.saveQueryState(queryId, queryRecord.title, state);
  }

  res.json({
    success: true,
    comment: newComment,
    file: targetFile,
    comments: targetFile.comments,
    githubSync
  });
});

// Submit / Update individual reviewer verdict (best-effort GitHub review writeback)
app.post('/api/verdict', async (req, res) => {
  const { queryId, verdict } = req.body;
  if (!queryId || !verdict || !verdict.userId || !verdict.verdict) {
    return res.status(400).json({ error: 'queryId and valid verdict payload are required' });
  }

  const queryRecord = db.getQueryState(queryId);
  if (!queryRecord) {
    return res.status(404).json({ error: 'Query not found' });
  }

  const state = queryRecord.state;
  state.verdicts = state.verdicts || [];

  const existingIdx = state.verdicts.findIndex(v => v.userId === verdict.userId);
  const verdictEntry = {
    userId: verdict.userId,
    userName: verdict.userName || 'Reviewer',
    userRole: verdict.userRole || 'Code Reviewer',
    userAvatar: verdict.userAvatar || '👤',
    verdict: verdict.verdict, // 'approved' | 'changes_requested' | 'comment'
    notes: verdict.notes || '',
    timestamp: 'Just now',
    updatedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    state.verdicts[existingIdx] = verdictEntry;
  } else {
    state.verdicts.push(verdictEntry);
  }

  db.saveQueryState(queryId, queryRecord.title, state);

  const githubSync = await maybeWritebackVerdict(queryId, verdict.userId, verdictEntry);
  if (githubSync.synced) {
    verdictEntry.githubSync = githubSync;
    if (existingIdx >= 0) {
      state.verdicts[existingIdx] = verdictEntry;
    } else {
      state.verdicts[state.verdicts.length - 1] = verdictEntry;
    }
    db.saveQueryState(queryId, queryRecord.title, state);
  }

  res.json({
    success: true,
    verdicts: state.verdicts,
    submittedVerdict: verdictEntry,
    githubSync
  });
});

// Serve frontend static build if exists
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Server] PR Quest API & Review Server running on http://localhost:${PORT}`);
});
