/**
 * GitHub public API helpers for fetching open PRs and PR file diffs.
 */

const GITHUB_API = 'https://api.github.com';

/**
 * Parse owner/repo from common GitHub URL shapes or "owner/repo".
 * @param {string} input
 * @returns {{ owner: string, repo: string } | null}
 */
export function parseRepoInput(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim().replace(/\/+$/, '');

  // owner/repo
  const short = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/);
  if (short && !trimmed.includes('://') && !trimmed.includes('github.com')) {
    return { owner: short[1], repo: short[2] };
  }

  try {
    const withProtocol = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!url.hostname.includes('github.com')) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, '')
    };
  } catch (_) {
    return null;
  }
}

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'PR-Quest-Hackathon'
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function githubFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: githubHeaders() });
  const remaining = res.headers.get('x-ratelimit-remaining');
  if (!res.ok) {
    let message = `GitHub API error (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch (_) {}
    const err = new Error(message);
    err.status = res.status;
    err.rateLimitRemaining = remaining;
    throw err;
  }
  return res.json();
}

/**
 * List open pull requests for a public repo (paginates up to 100).
 */
export async function listOpenPullRequests(owner, repo) {
  const pulls = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=100&sort=updated&direction=desc`
  );

  return pulls.map((pr) => ({
    number: pr.number,
    title: pr.title,
    body: pr.body || '',
    htmlUrl: pr.html_url,
    user: pr.user?.login || 'unknown',
    avatarUrl: pr.user?.avatar_url || null,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    draft: Boolean(pr.draft),
    labels: (pr.labels || []).map((l) => l.name),
    base: pr.base?.ref || 'main',
    head: pr.head?.ref || '',
    additions: pr.additions ?? null,
    deletions: pr.deletions ?? null,
    changedFiles: pr.changed_files ?? null,
    queryId: `GH-${owner}/${repo}#${pr.number}`,
    owner,
    repo
  }));
}

/**
 * Parse a unified diff patch into app diffChunks format.
 */
export function parsePatchToChunks(patch) {
  if (!patch || typeof patch !== 'string') {
    return [{
      header: '@@ (binary or empty diff) @@',
      lines: [{ type: 'normal', content: '(No textual diff available for this file)' }]
    }];
  }

  const chunks = [];
  let current = null;

  for (const rawLine of patch.split('\n')) {
    if (rawLine.startsWith('@@')) {
      if (current) chunks.push(current);
      current = { header: rawLine, lines: [] };
      continue;
    }
    if (!current) {
      current = { header: '@@ patch @@', lines: [] };
    }
    if (rawLine.startsWith('+') && !rawLine.startsWith('+++')) {
      current.lines.push({ type: 'add', content: rawLine.slice(1) });
    } else if (rawLine.startsWith('-') && !rawLine.startsWith('---')) {
      current.lines.push({ type: 'delete', content: rawLine.slice(1) });
    } else if (rawLine.startsWith('\\')) {
      // "\ No newline at end of file"
      continue;
    } else {
      const content = rawLine.startsWith(' ') ? rawLine.slice(1) : rawLine;
      current.lines.push({ type: 'normal', content });
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [{
    header: '@@ patch @@',
    lines: [{ type: 'normal', content: '(Empty patch)' }]
  }];
}

function inferTier(filename, additions = 0, deletions = 0) {
  const lower = filename.toLowerCase();
  if (lower.includes('test') || lower.includes('spec') || lower.includes('__tests__')) {
    return 'Tier 3: Tests';
  }
  if (
    lower.includes('component') ||
    lower.includes('page') ||
    lower.includes('view') ||
    lower.includes('ui/') ||
    lower.endsWith('.css') ||
    lower.endsWith('.scss')
  ) {
    return 'Tier 2: Consumer';
  }
  const churn = (additions || 0) + (deletions || 0);
  if (churn >= 40 || lower.includes('service') || lower.includes('core') || lower.includes('auth')) {
    return 'Tier 1: Core Logic';
  }
  return 'Tier 2: Consumer';
}

function inferImportance(filename, additions = 0, deletions = 0) {
  const churn = (additions || 0) + (deletions || 0);
  let score = 50 + Math.min(40, Math.floor(churn / 2));
  const lower = filename.toLowerCase();
  if (lower.includes('auth') || lower.includes('security') || lower.includes('session')) score += 10;
  if (lower.includes('test') || lower.includes('spec')) score -= 15;
  return Math.max(20, Math.min(98, score));
}

/**
 * Fetch PR metadata + changed files with parsed diffs for the review workspace.
 */
export async function fetchPullRequestWorkspace(owner, repo, number) {
  const [pr, files] = await Promise.all([
    githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${number}`),
    githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${number}/files?per_page=100`)
  ]);

  const mappedFiles = files.map((f, idx) => ({
    id: `gh-${number}-file-${idx + 1}`,
    path: f.filename,
    tier: inferTier(f.filename, f.additions, f.deletions),
    importance: inferImportance(f.filename, f.additions, f.deletions),
    specTag: 'ALL',
    status: 'pending',
    comments: [],
    status_github: f.status,
    additions: f.additions,
    deletions: f.deletions,
    diffChunks: parsePatchToChunks(f.patch)
  }));

  const bodyPreview = (pr.body || '').trim();
  const criteriaFromBody = bodyPreview
    ? bodyPreview
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^[-*]\s+\[[ xX]\]/.test(l) || /^[-*]\s+/.test(l))
        .slice(0, 8)
        .map((l, i) => ({
          id: `AC-${i + 1}`,
          text: l.replace(/^[-*]\s+(\[[ xX]\]\s*)?/, ''),
          completed: /\[[xX]\]/.test(l)
        }))
    : [];

  if (criteriaFromBody.length === 0) {
    criteriaFromBody.push(
      { id: 'AC-1', text: `Review intent: ${pr.title}`, completed: false },
      { id: 'AC-2', text: 'Validate changed files for correctness and regressions', completed: false },
      { id: 'AC-3', text: 'Confirm tests / coverage for the touched paths', completed: false }
    );
  }

  return {
    queryId: `GH-${owner}/${repo}#${pr.number}`,
    title: `PR #${pr.number}: ${pr.title}`,
    owner,
    repo,
    number: pr.number,
    htmlUrl: pr.html_url,
    user: pr.user?.login || 'unknown',
    jiraTicket: {
      id: `${owner}/${repo}#${pr.number}`,
      title: pr.title,
      description: bodyPreview || `Open pull request #${pr.number} from ${pr.user?.login || 'unknown'} against ${pr.base?.ref || 'main'}.`,
      criteria: criteriaFromBody
    },
    files: mappedFiles,
    meta: {
      draft: Boolean(pr.draft),
      base: pr.base?.ref,
      head: pr.head?.ref,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files
    }
  };
}
