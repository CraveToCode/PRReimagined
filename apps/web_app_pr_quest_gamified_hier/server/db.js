import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'pr_quest.db');

// Built-in reviewer personas for instant 1-click access
export const PRESET_USERS = [
  {
    id: 'alex_staff',
    username: 'alex',
    password_hash: 'demo123',
    name: 'Alex Chen',
    role: 'Staff Infrastructure Engineer',
    avatar: '👨‍💻'
  },
  {
    id: 'sarah_sec',
    username: 'sarah',
    password_hash: 'demo123',
    name: 'Sarah Lin',
    role: 'AppSec Architect',
    avatar: '👩‍💻'
  },
  {
    id: 'marcus_qa',
    username: 'marcus',
    password_hash: 'demo123',
    name: 'Marcus Brody',
    role: 'QA & Reliability Lead',
    avatar: '🧑‍🔬'
  }
];

class DatabaseManager {
  constructor() {
    this.sqlite = null;
    this.useMemoryFallback = false;
    this.fallbackStore = {
      users: {},
      review_queries: {},
      user_progress: {}
    };
    this.init();
  }

  init() {
    try {
      // Dynamic import / require of node:sqlite
      const { DatabaseSync } = awaitImportNodeSqlite();
      this.sqlite = new DatabaseSync(DB_PATH);
      this.initTables();
      this.seedInitialData();
      console.log(`[DB] SQLite initialized successfully at: ${DB_PATH}`);
    } catch (err) {
      console.warn(`[DB] Native SQLite fallback active (${err.message}). Using persistent JSON storage.`);
      this.useMemoryFallback = true;
      this.initJsonFallback();
    }
  }

  initTables() {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Code Reviewer',
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS review_queries (
        query_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        state_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query_id TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        unlocked_level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        awarded_actions_json TEXT DEFAULT '[]',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, query_id)
      );
    `);
  }

  seedInitialData() {
    // Seed Preset Users
    for (const u of PRESET_USERS) {
      const existing = this.getUserById(u.id);
      if (!existing) {
        const stmt = this.sqlite.prepare(`
          INSERT INTO users (id, username, password_hash, name, role, avatar)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(u.id, u.username, u.password_hash, u.name, u.role, u.avatar);
      }
    }

    // Seed PR-101 if not existing
    const existingPr101 = this.getQueryState('PR-101');
    if (!existingPr101) {
      const pr101State = createInitialPr101State();
      this.saveQueryState('PR-101', 'PR #101: Session Token Rotation & Salt Validation', pr101State);
      
      // Seed Alex Chen's initial user progress on PR-101
      this.saveUserProgress('alex_staff', 'PR-101', {
        level: 2,
        unlockedLevel: 2,
        xp: 150,
        awardedActions: ['ac-jira-1', 'ac-jira-2', 'unlock-level-2']
      });
    }

    // Seed PR-102: Distributed Redis Token Bucket Rate Limiter
    const existingPr102 = this.getQueryState('PR-102');
    if (!existingPr102) {
      const pr102State = createInitialPr102State();
      this.saveQueryState('PR-102', 'PR #102: Distributed Redis Token Bucket Rate Limiter', pr102State);
    }
  }

  // --- Fallback JSON store for zero-dependency portability ---
  initJsonFallback() {
    this.fallbackFile = path.join(DATA_DIR, 'pr_quest_store.json');
    if (fs.existsSync(this.fallbackFile)) {
      try {
        const raw = fs.readFileSync(this.fallbackFile, 'utf8');
        this.fallbackStore = JSON.parse(raw);
      } catch (e) {
        console.error('[DB Fallback] Failed reading store file, resetting.', e);
      }
    }

    // Seed preset users
    for (const u of PRESET_USERS) {
      if (!this.fallbackStore.users[u.id]) {
        this.fallbackStore.users[u.id] = { ...u, created_at: new Date().toISOString() };
      }
    }

    if (!this.fallbackStore.review_queries['PR-101']) {
      this.fallbackStore.review_queries['PR-101'] = {
        query_id: 'PR-101',
        title: 'PR #101: Session Token Rotation & Salt Validation',
        state_json: JSON.stringify(createInitialPr101State()),
        updated_at: new Date().toISOString()
      };
    }

    if (!this.fallbackStore.review_queries['PR-102']) {
      this.fallbackStore.review_queries['PR-102'] = {
        query_id: 'PR-102',
        title: 'PR #102: Distributed Redis Token Bucket Rate Limiter',
        state_json: JSON.stringify(createInitialPr102State()),
        updated_at: new Date().toISOString()
      };
    }

    this.persistFallback();
  }

  persistFallback() {
    if (this.useMemoryFallback && this.fallbackFile) {
      fs.writeFileSync(this.fallbackFile, JSON.stringify(this.fallbackStore, null, 2), 'utf8');
    }
  }

  // --- User Operations ---
  getUserById(id) {
    if (this.useMemoryFallback) {
      return this.fallbackStore.users[id] || null;
    }
    const stmt = this.sqlite.prepare(`SELECT * FROM users WHERE id = ?`);
    return stmt.get(id) || null;
  }

  getUserByUsername(username) {
    if (this.useMemoryFallback) {
      return Object.values(this.fallbackStore.users).find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    }
    const stmt = this.sqlite.prepare(`SELECT * FROM users WHERE LOWER(username) = LOWER(?)`);
    return stmt.get(username) || null;
  }

  createUser(id, username, password, name, role = 'Code Reviewer', avatar = '👤') {
    if (this.useMemoryFallback) {
      const user = { id, username, password_hash: password, name, role, avatar, created_at: new Date().toISOString() };
      this.fallbackStore.users[id] = user;
      this.persistFallback();
      return user;
    }
    const stmt = this.sqlite.prepare(`
      INSERT INTO users (id, username, password_hash, name, role, avatar)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, username, password, name, role, avatar);
    return this.getUserById(id);
  }

  // --- Review Queries Operations ---
  listQueries() {
    if (this.useMemoryFallback) {
      return Object.values(this.fallbackStore.review_queries).map(q => {
        let state = {};
        try { state = JSON.parse(q.state_json); } catch (_) {}
        const totalFiles = state.files ? state.files.length : 0;
        const reviewedFiles = state.files ? state.files.filter(f => f.status !== 'pending').length : 0;
        const flagsCount = state.files ? state.files.filter(f => f.status === 'flagged').length : 0;
        const verdictsCount = state.verdicts ? state.verdicts.length : 0;
        return {
          query_id: q.query_id,
          title: q.title,
          updated_at: q.updated_at,
          totalFiles,
          reviewedFiles,
          flagsCount,
          verdictsCount
        };
      }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    const rows = this.sqlite.prepare(`
      SELECT query_id, title, state_json, updated_at
      FROM review_queries
      ORDER BY updated_at DESC
    `).all();

    return rows.map(r => {
      let state = {};
      try { state = JSON.parse(r.state_json); } catch (_) {}
      const totalFiles = state.files ? state.files.length : 0;
      const reviewedFiles = state.files ? state.files.filter(f => f.status !== 'pending').length : 0;
      const flagsCount = state.files ? state.files.filter(f => f.status === 'flagged').length : 0;
      const verdictsCount = state.verdicts ? state.verdicts.length : 0;
      return {
        query_id: r.query_id,
        title: r.title,
        updated_at: r.updated_at,
        totalFiles,
        reviewedFiles,
        flagsCount,
        verdictsCount
      };
    });
  }

  getQueryState(queryId) {
    if (this.useMemoryFallback) {
      const q = this.fallbackStore.review_queries[queryId];
      if (!q) return null;
      try {
        return {
          query_id: q.query_id,
          title: q.title,
          state: JSON.parse(q.state_json),
          updated_at: q.updated_at
        };
      } catch (_) {
        return null;
      }
    }

    const row = this.sqlite.prepare(`
      SELECT query_id, title, state_json, updated_at
      FROM review_queries
      WHERE query_id = ?
    `).get(queryId);

    if (!row) return null;
    try {
      return {
        query_id: row.query_id,
        title: row.title,
        state: JSON.parse(row.state_json),
        updated_at: row.updated_at
      };
    } catch (_) {
      return null;
    }
  }

  saveQueryState(queryId, title, stateObj) {
    const jsonStr = JSON.stringify(stateObj);
    const now = new Date().toISOString();

    if (this.useMemoryFallback) {
      this.fallbackStore.review_queries[queryId] = {
        query_id: queryId,
        title: title || `Query ${queryId}`,
        state_json: jsonStr,
        updated_at: now
      };
      this.persistFallback();
      return true;
    }

    const stmt = this.sqlite.prepare(`
      INSERT INTO review_queries (query_id, title, state_json, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(query_id) DO UPDATE SET
        title = excluded.title,
        state_json = excluded.state_json,
        updated_at = excluded.updated_at
    `);
    stmt.run(queryId, title || `Query ${queryId}`, jsonStr, now);
    return true;
  }

  // --- Individual User Progress Operations ---
  getUserProgress(userId, queryId) {
    const key = `${userId}:${queryId}`;
    if (this.useMemoryFallback) {
      const p = this.fallbackStore.user_progress[key];
      if (!p) return null;
      return {
        ...p,
        awardedActions: JSON.parse(p.awarded_actions_json || '[]')
      };
    }

    const row = this.sqlite.prepare(`
      SELECT user_id, query_id, level, unlocked_level, xp, awarded_actions_json, updated_at
      FROM user_progress
      WHERE user_id = ? AND query_id = ?
    `).get(userId, queryId);

    if (!row) return null;
    return {
      userId: row.user_id,
      queryId: row.query_id,
      level: row.level,
      unlockedLevel: row.unlocked_level,
      xp: row.xp,
      awardedActions: JSON.parse(row.awarded_actions_json || '[]'),
      updatedAt: row.updated_at
    };
  }

  saveUserProgress(userId, queryId, progress) {
    const key = `${userId}:${queryId}`;
    const level = progress.level || 1;
    const unlockedLevel = progress.unlockedLevel || 1;
    const xp = progress.xp || 0;
    const awardedJson = JSON.stringify(progress.awardedActions || []);
    const now = new Date().toISOString();

    if (this.useMemoryFallback) {
      this.fallbackStore.user_progress[key] = {
        id: key,
        user_id: userId,
        query_id: queryId,
        level,
        unlocked_level: unlockedLevel,
        xp,
        awarded_actions_json: awardedJson,
        updated_at: now
      };
      this.persistFallback();
      return true;
    }

    const stmt = this.sqlite.prepare(`
      INSERT INTO user_progress (id, user_id, query_id, level, unlocked_level, xp, awarded_actions_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        level = excluded.level,
        unlocked_level = excluded.unlocked_level,
        xp = excluded.xp,
        awarded_actions_json = excluded.awarded_actions_json,
        updated_at = excluded.updated_at
    `);
    stmt.run(key, userId, queryId, level, unlockedLevel, xp, awardedJson, now);
    return true;
  }
}

// Helpers
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

function awaitImportNodeSqlite() {
  return require('node:sqlite');
}

function createInitialPr101State() {
  return {
    queryId: 'PR-101',
    title: 'PR #101: Session Token Rotation & Salt Validation',
    jiraTicket: {
      id: "SEC-4029",
      title: "Rotate Session Token & Enforce Ephemeral Salts",
      author: "Alex Chen (Staff Eng)",
      points: 8,
      status: "In Review",
      description: "Harden cryptographic token rotation by salting session keys on every refresh cycle to mitigate replay vectors.",
      criteria: [
        { id: "ac-1", text: "Tokens must expire after 15 minutes of inactivity", completed: true },
        { id: "ac-2", text: "Salt must be regenerated with CSPRNG on every rotation cycle", completed: true },
        { id: "ac-3", text: "Legacy SHA-1 signatures must be explicitly rejected", completed: false },
        { id: "ac-4", text: "Downstream session cache must be invalidated atomically", completed: false }
      ]
    },
    files: [
      {
        id: "f-1",
        tier: 1,
        path: "src/core/authService.ts",
        tierLabel: "Tier 1: Core",
        status: "flagged",
        description: "Primary cryptographic token rotation routine",
        reviewerStatuses: {
          alex_staff: { status: "flagged", timestamp: "15 mins ago" }
        },
        comments: [
          {
            id: "c-alex-1",
            authorId: "alex_staff",
            authorName: "Alex Chen",
            authorRole: "Staff Infrastructure Engineer",
            authorAvatar: "👨‍💻",
            type: "flag",
            text: "Critical: The rotateSessionToken() routine must validate that the salt meets minimum 256-bit entropy standards before writing to session state.",
            timestamp: "15 mins ago",
            resolved: false
          }
        ],
        diff: `@@ -40,7 +40,11 @@ export function rotateSessionToken(oldToken: string): TokenResult {
   if (!isValidToken(oldToken)) {
     throw new SecurityError('Invalid token format');
   }
+  // NEW: Generate cryptographically strong ephemeral salt
+  const salt = crypto.randomBytes(32).toString('hex');
+  const newToken = hashTokenWithSalt(oldToken, salt);
+  sessionStore.update(newToken, { salt, refreshedAt: Date.now() });
+  return { token: newToken, salt };
 }`
      },
      {
        id: "f-2",
        tier: 1,
        path: "src/core/sessionStore.ts",
        tierLabel: "Tier 1: Core",
        status: "approved",
        description: "In-memory cache mapping session tokens to active metadata",
        reviewerStatuses: {
          alex_staff: { status: "approved", timestamp: "12 mins ago" }
        },
        comments: [
          {
            id: "c-alex-2",
            authorId: "alex_staff",
            authorName: "Alex Chen",
            authorRole: "Staff Infrastructure Engineer",
            authorAvatar: "👨‍💻",
            type: "approval",
            text: "Atomic session write and TTL expiry look sound.",
            timestamp: "12 mins ago"
          }
        ],
        diff: `@@ -15,4 +15,9 @@ export class SessionStore {
   update(token: string, meta: SessionMeta): void {
+    // Atomically set with 15-minute TTL
+    this.cache.set(token, meta, 900);
   }
 }`
      },
      {
        id: "f-3",
        tier: 2,
        path: "src/api/authRouter.ts",
        tierLabel: "Tier 2: Consumer",
        status: "pending",
        description: "REST endpoint routing for token refresh and auth exchanges",
        reviewerStatuses: {},
        comments: [],
        diff: `@@ -28,5 +28,8 @@ router.post('/refresh', async (req, res) => {
   const { token } = req.body;
+  const rotated = authService.rotateSessionToken(token);
+  res.cookie('sess_token', rotated.token, { httpOnly: true, secure: true });
+  return res.json({ success: true });
 });`
      },
      {
        id: "f-4",
        tier: 2,
        path: "src/middleware/authMiddleware.ts",
        tierLabel: "Tier 2: Consumer",
        status: "pending",
        description: "Request inspection middleware verifying JWT and session freshness",
        reviewerStatuses: {},
        comments: [],
        diff: `@@ -18,3 +18,6 @@ export function verifySession(req, res, next) {
   const token = req.cookies['sess_token'];
+  if (!sessionStore.has(token)) {
+    return res.status(401).json({ error: 'Session expired' });
   }
   next();
 }`
      },
      {
        id: "f-5",
        tier: 3,
        path: "src/utils/cryptoHelper.ts",
        tierLabel: "Tier 3: Support",
        status: "pending",
        description: "Low-level cryptographic primitives and hash functions",
        reviewerStatuses: {},
        comments: [],
        diff: `@@ -5,2 +5,7 @@ export function hashTokenWithSalt(token: string, salt: string): string {
+  return crypto.createHmac('sha256', salt).update(token).digest('hex');
+}`
      }
    ],
    standards: [
      { id: "std-1", category: "Security", text: "All tokens must use HMAC-SHA256 or higher (no plain SHA-1)", completed: true },
      { id: "std-2", category: "Resilience", text: "Session updates must be atomic to prevent split-brain reads", completed: true },
      { id: "std-3", category: "Auditability", text: "Token rotations must emit structured audit logs with masked IDs", completed: false }
    ],
    auditedSymbols: ["rotateSessionToken"],
    testSuites: [
      { id: "test-1", name: "test_token_rotation_expiry()", path: "tests/authService.test.ts", coverage: "94%", status: "approved" },
      { id: "test-2", name: "test_replay_attack_rejected()", path: "tests/replayProtection.test.ts", coverage: "100%", status: "approved" },
      { id: "test-3", name: "test_downstream_cache_invalidation()", path: "tests/sessionStore.test.ts", coverage: "88%", status: "pending" }
    ],
    verdicts: [
      {
        userId: "alex_staff",
        userName: "Alex Chen",
        userRole: "Staff Infrastructure Engineer",
        userAvatar: "👨‍💻",
        verdict: "changes_requested",
        notes: "Requested changes on authService.ts: we must enforce 256-bit salt entropy validation before persisting tokens to avoid weak PRNG vulnerabilities.",
        timestamp: "10 mins ago"
      }
    ]
  };
}

function createInitialPr102State() {
  return {
    queryId: 'PR-102',
    title: 'PR #102: Distributed Redis Token Bucket Rate Limiter',
    jiraTicket: {
      id: "PERF-218",
      title: "Distributed Rate Limiter for Public API Endpoints",
      author: "Marcus Brody (QA)",
      points: 5,
      status: "In Review",
      description: "Implement a sliding token-bucket rate limiter backed by Redis Cluster to protect public APIs against DDoS spikes.",
      criteria: [
        { id: "ac-102-1", text: "Allow burst capacity of up to 50 requests/sec per client IP", completed: false },
        { id: "ac-102-2", text: "Return HTTP 429 with Retry-After header on threshold breach", completed: false },
        { id: "ac-102-3", text: "Gracefully fail open if Redis cluster ping exceeds 250ms", completed: false }
      ]
    },
    files: [
      {
        id: "f-102-1",
        tier: 1,
        path: "src/limiter/tokenBucket.ts",
        tierLabel: "Tier 1: Core",
        status: "pending",
        description: "Atomic Redis Lua script for token deduction and refill calculation",
        reviewerStatuses: {},
        comments: [],
        diff: `@@ -1,10 +1,15 @@
+export async function checkRateLimit(clientId: string, limit: number): Promise<boolean> {
+  const now = Date.now();
+  const key = \`ratelimit:\${clientId}\`;
+  const allowed = await redis.eval(TOKEN_BUCKET_LUA, 1, key, limit, now);
+  return Boolean(allowed);
+}`
      }
    ],
    standards: [
      { id: "std-102-1", category: "Performance", text: "Rate limit checks must execute in under 3ms P99", completed: false },
      { id: "std-102-2", category: "Resilience", text: "Must fail open if distributed cache is unreachable", completed: false }
    ],
    auditedSymbols: [],
    testSuites: [
      { id: "test-102-1", name: "test_burst_rate_exceeded()", path: "tests/limiter.test.ts", coverage: "91%", status: "pending" }
    ],
    verdicts: []
  };
}

export const db = new DatabaseManager();
