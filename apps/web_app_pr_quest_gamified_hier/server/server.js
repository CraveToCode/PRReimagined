import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, PRESET_USERS } from './db.js';
import { parseRepoInput, listOpenPullRequests, fetchPullRequestWorkspace } from './github.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List open PRs for a public GitHub repository
app.post('/api/github/open-prs', async (req, res) => {
  try {
    const repoInput = req.body?.repoUrl || req.body?.repo || '';
    const parsed = parseRepoInput(repoInput);
    if (!parsed) {
      return res.status(400).json({
        error: 'Invalid repository URL. Use https://github.com/owner/repo or owner/repo'
      });
    }

    const pullRequests = await listOpenPullRequests(parsed.owner, parsed.repo);
    res.json({
      success: true,
      owner: parsed.owner,
      repo: parsed.repo,
      repoUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
      count: pullRequests.length,
      pullRequests
    });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({
      error: err.message || 'Failed to fetch open pull requests',
      rateLimitRemaining: err.rateLimitRemaining ?? null
    });
  }
});

// Fetch a single open PR as a review workspace payload (files + diffs)
app.get('/api/github/pr/:owner/:repo/:number', async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const prNumber = Number(number);
    if (!owner || !repo || !Number.isFinite(prNumber) || prNumber <= 0) {
      return res.status(400).json({ error: 'owner, repo, and a valid PR number are required' });
    }

    const workspace = await fetchPullRequestWorkspace(owner, repo, prNumber);
    res.json({ success: true, ...workspace });
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({
      error: err.message || 'Failed to fetch pull request',
      rateLimitRemaining: err.rateLimitRemaining ?? null
    });
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

// Add comment or flag to a file
app.post('/api/comments', (req, res) => {
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

  res.json({
    success: true,
    comment: newComment,
    file: targetFile,
    comments: targetFile.comments
  });
});

// Submit / Update individual reviewer verdict
app.post('/api/verdict', (req, res) => {
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

  res.json({
    success: true,
    verdicts: state.verdicts,
    submittedVerdict: verdictEntry
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
