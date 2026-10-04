/**
 * GitHub public API helpers for fetching open PRs, PR file diffs,
 * and PR-head repository context docs (ARCHITECTURE / CONTEXT / PRODUCT).
 */

const GITHUB_API = 'https://api.github.com';
const MAX_CRITERIA = 8;
const MAX_STANDARDS = 8;

/** Candidate paths per logical role, ordered by preference. */
const DOC_CANDIDATES = {
  architecture: [
    'ARCHITECTURE.md',
    'architecture.md',
    'Architecture.md',
    'docs/ARCHITECTURE.md',
    'docs/architecture.md',
    'docs/Architecture.md'
  ],
  context: [
    'CONTEXT.md',
    'context.md',
    'Context.md',
    'docs/CONTEXT.md',
    'docs/context.md',
    'docs/Context.md'
  ],
  product: [
    'PRODUCT.md',
    'product.md',
    'Product.md',
    'docs/PRODUCT.md',
    'docs/product.md',
    'docs/Product.md'
  ]
};

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

async function githubFetchOptional(path) {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: githubHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    let message = `GitHub API error (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch (_) {}
    const err = new Error(message);
    err.status = res.status;
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

function decodeContentFile(fileJson) {
  if (!fileJson || fileJson.type !== 'file' || !fileJson.content) return null;
  try {
    const raw = Buffer.from(fileJson.content.replace(/\n/g, ''), 'base64').toString('utf8');
    return raw;
  } catch (_) {
    return null;
  }
}

/**
 * Fetch first existing candidate for a role at a given commit SHA.
 */
async function fetchDocForRole(owner, repo, role, candidates, refSha, changedPathSet) {
  for (const path of candidates) {
    const data = await githubFetchOptional(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(refSha)}`
    );
    if (!data) continue;
    const content = decodeContentFile(data);
    if (!content || !content.trim()) continue;
    return {
      role,
      path: data.path || path,
      content: content.trim(),
      changedInPr: changedPathSet.has((data.path || path).toLowerCase())
    };
  }
  return null;
}

/**
 * Discover ARCHITECTURE / CONTEXT / PRODUCT docs at PR head.
 * README.md is used only as a secondary architecture fallback.
 */
export async function fetchRepoDocsAtHead(owner, repo, headSha, changedFiles = []) {
  const changedPathSet = new Set(
    (changedFiles || []).map((f) => String(f.filename || f.path || '').toLowerCase()).filter(Boolean)
  );

  const roles = ['architecture', 'context', 'product'];
  const results = await Promise.all(
    roles.map((role) => fetchDocForRole(owner, repo, role, DOC_CANDIDATES[role], headSha, changedPathSet))
  );

  const repoDocs = results.filter(Boolean);

  // Secondary: README as architecture if none found
  if (!repoDocs.some((d) => d.role === 'architecture')) {
    const readme = await fetchDocForRole(
      owner,
      repo,
      'architecture',
      ['README.md', 'readme.md', 'docs/README.md'],
      headSha,
      changedPathSet
    );
    if (readme) {
      repoDocs.unshift({ ...readme, role: 'architecture', path: readme.path });
    }
  }

  return repoDocs;
}

function stripMdNoise(text) {
  return text
    .replace(/^[-*+]\s+(\[[ xX]\]\s*)?/, '')
    .replace(/^\d+[\.\)]\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();
}

function isUsefulBullet(text) {
  if (!text) return false;
  if (text.length < 12 || text.length > 220) return false;
  if (/^https?:\/\//i.test(text)) return false;
  if (/^#{1,6}\s/.test(text)) return false;
  return true;
}

/**
 * Extract checklist / bullet / numbered items from markdown.
 * When sectionHints provided, prefer lines under matching headings.
 */
export function extractMarkdownItems(markdown, { sectionHints = [], limit = MAX_CRITERIA } = {}) {
  if (!markdown || typeof markdown !== 'string') return [];

  const lines = markdown.split('\n');
  const items = [];
  let inPreferredSection = sectionHints.length === 0;
  const hintRe = sectionHints.length
    ? new RegExp(sectionHints.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i')
    : null;

  for (const raw of lines) {
    const line = raw.trim();
    if (/^#{1,6}\s+/.test(line)) {
      if (hintRe) {
        inPreferredSection = hintRe.test(line);
      }
      continue;
    }
    if (!inPreferredSection && hintRe) continue;

    const isChecklist = /^[-*+]\s+\[[ xX]\]\s+/.test(line);
    const isBullet = /^[-*+]\s+/.test(line);
    const isNumbered = /^\d+[\.\)]\s+/.test(line);
    if (!isChecklist && !isBullet && !isNumbered) continue;

    const text = stripMdNoise(line);
    if (!isUsefulBullet(text)) continue;
    if (items.some((i) => i.text.toLowerCase() === text.toLowerCase())) continue;

    items.push({
      text,
      completed: isChecklist ? /\[[xX]\]/.test(line) : false
    });
    if (items.length >= limit) break;
  }

  // If section filtering yielded nothing, retry without section filter
  if (items.length === 0 && sectionHints.length > 0) {
    return extractMarkdownItems(markdown, { sectionHints: [], limit });
  }

  return items;
}

export function buildCriteriaFromDocs(prTitle, bodyPreview, repoDocs) {
  const fromBody = bodyPreview
    ? bodyPreview
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^[-*]\s+\[[ xX]\]/.test(l) || /^[-*]\s+/.test(l))
        .slice(0, MAX_CRITERIA)
        .map((l, i) => ({
          id: `AC-${i + 1}`,
          text: stripMdNoise(l),
          completed: /\[[xX]\]/.test(l)
        }))
        .filter((c) => isUsefulBullet(c.text))
    : [];

  if (fromBody.length > 0) return fromBody;

  const byRole = Object.fromEntries(repoDocs.map((d) => [d.role, d]));
  const productItems = byRole.product
    ? extractMarkdownItems(byRole.product.content, {
        sectionHints: ['goal', 'requirement', 'acceptance', 'criteria', 'feature', 'scope', 'product'],
        limit: MAX_CRITERIA
      })
    : [];
  const contextItems = byRole.context
    ? extractMarkdownItems(byRole.context.content, {
        sectionHints: ['goal', 'requirement', 'acceptance', 'criteria', 'intent', 'context', 'overview'],
        limit: MAX_CRITERIA
      })
    : [];

  const merged = [...productItems];
  for (const item of contextItems) {
    if (merged.length >= MAX_CRITERIA) break;
    if (!merged.some((m) => m.text.toLowerCase() === item.text.toLowerCase())) {
      merged.push(item);
    }
  }

  if (merged.length > 0) {
    return merged.slice(0, MAX_CRITERIA).map((item, i) => ({
      id: `AC-${i + 1}`,
      text: item.text,
      completed: Boolean(item.completed)
    }));
  }

  return [
    { id: 'AC-1', text: `Review intent: ${prTitle}`, completed: false },
    { id: 'AC-2', text: 'Validate changed files for correctness and regressions', completed: false },
    { id: 'AC-3', text: 'Confirm tests / coverage for the touched paths', completed: false }
  ];
}

export function buildStandardsFromDocs(repoDocs) {
  const byRole = Object.fromEntries(repoDocs.map((d) => [d.role, d]));
  const arch = byRole.architecture;
  const context = byRole.context;

  let source = arch;
  let items = arch
    ? extractMarkdownItems(arch.content, {
        sectionHints: ['rule', 'agent', 'guideline', 'standard', 'contract', 'must', 'never', 'placement', 'architecture'],
        limit: MAX_STANDARDS
      })
    : [];

  if (items.length === 0 && context) {
    source = context;
    items = extractMarkdownItems(context.content, {
      sectionHints: ['rule', 'agent', 'guideline', 'standard', 'architecture'],
      limit: MAX_STANDARDS
    });
  }

  if (items.length > 0) {
    return items.map((item, i) => {
      const title = item.text.length > 72 ? `${item.text.slice(0, 69)}…` : item.text;
      return {
        id: `DOC-STD-${String(i + 1).padStart(2, '0')}`,
        standardFile: source?.path || 'ARCHITECTURE.md',
        category: arch ? 'Architecture Doc' : 'Context Doc',
        title,
        description: item.text,
        completed: false
      };
    });
  }

  if (arch || context || byRole.product) {
    const docPath = arch?.path || context?.path || byRole.product?.path || 'repo docs';
    return [
      {
        id: 'DOC-STD-01',
        standardFile: docPath,
        category: 'Architecture Doc',
        title: 'Changes respect documented architecture boundaries',
        description: `Review Tier 1 diffs against guidance in ${docPath}.`,
        completed: false
      },
      {
        id: 'DOC-STD-02',
        standardFile: docPath,
        category: 'Architecture Doc',
        title: 'No undocumented cross-layer coupling introduced',
        description: 'Flag new imports/calls that violate stated module boundaries or placement rules.',
        completed: false
      },
      {
        id: 'DOC-STD-03',
        standardFile: docPath,
        category: 'Architecture Doc',
        title: 'Core vs consumer responsibilities remain clear',
        description: 'Confirm UI/consumer code does not absorb core service responsibilities.',
        completed: false
      }
    ];
  }

  return [];
}

function buildArchitectureText(repoDocs) {
  const byRole = Object.fromEntries(repoDocs.map((d) => [d.role, d]));
  if (byRole.architecture?.content) return byRole.architecture.content;

  const parts = [];
  if (byRole.context?.content) {
    parts.push(`# Context\n\n${byRole.context.content}`);
  }
  if (byRole.product?.content) {
    parts.push(`# Product\n\n${byRole.product.content}`);
  }
  return parts.join('\n\n---\n\n');
}

/**
 * Fetch PR metadata + changed files with parsed diffs for the review workspace,
 * plus PR-head repo docs seeded into Level 1 / Level 2.
 */
export async function fetchPullRequestWorkspace(owner, repo, number) {
  const [pr, files] = await Promise.all([
    githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${number}`),
    githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${number}/files?per_page=100`)
  ]);

  const headSha = pr.head?.sha;
  let repoDocs = [];
  if (headSha) {
    try {
      repoDocs = await fetchRepoDocsAtHead(owner, repo, headSha, files);
    } catch (err) {
      // Non-fatal: PR diffs still load if docs lookup fails (e.g. rate limit)
      console.warn('[github] repo docs fetch failed:', err.message);
      repoDocs = [];
    }
  }

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
  const criteria = buildCriteriaFromDocs(pr.title, bodyPreview, repoDocs);
  const standards = buildStandardsFromDocs(repoDocs);
  const architectureText = buildArchitectureText(repoDocs);

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
      criteria
    },
    files: mappedFiles,
    repoDocs,
    architectureText,
    standards,
    meta: {
      draft: Boolean(pr.draft),
      base: pr.base?.ref,
      head: pr.head?.ref,
      headSha: headSha || null,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files
    }
  };
}
