const GITHUB_API_BASE = 'https://api.github.com';

// In-memory cache of the latest observed GitHub rate limit
let latestRateLimit = {
  limit: 60,
  remaining: 60,
  reset: Math.floor(Date.now() / 1000) + 3600,
  used: 0,
  hasToken: false
};

/**
 * Returns default headers for GitHub API requests.
 */
function getHeaders() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'FORTIVEX-Cockpit/1.0'
  };

  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    latestRateLimit.hasToken = true;
  } else {
    latestRateLimit.hasToken = false;
  }

  return headers;
}

/**
 * Updates in-memory rate limit info from response headers.
 */
function updateRateLimitFromHeaders(headers) {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');
  const used = headers.get('x-ratelimit-used');

  if (limit !== null) {
    latestRateLimit = {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
      used: used ? parseInt(used, 10) : 0,
      hasToken: Boolean(process.env.GITHUB_TOKEN?.trim())
    };
  }
}

/**
 * Executes a GET request against the GitHub REST API.
 * Handles rate limits, inaccessible repositories, and network errors gracefully.
 */
async function fetchFromGitHub(endpoint, queryParams = {}) {
  const url = new URL(`${GITHUB_API_BASE}${endpoint}`);
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders()
    });

    updateRateLimitFromHeaders(response.headers);

    // Rate limited
    if (response.status === 403 || response.status === 429) {
      const resetDate = new Date(latestRateLimit.reset * 1000).toLocaleTimeString();
      const error = new Error(
        `GitHub API rate limit reached (${latestRateLimit.remaining}/${latestRateLimit.limit}). Quota resets at ${resetDate}. You can configure GITHUB_TOKEN in your .env file to obtain up to 5,000 requests per hour.`
      );
      error.status = response.status;
      error.isRateLimit = true;
      error.rateLimit = latestRateLimit;
      throw error;
    }

    // Repository not found or private
    if (response.status === 404) {
      const error = new Error(
        'Repository not found. It may be private or deleted. Only accessible public repositories are supported.'
      );
      error.status = 404;
      error.isInaccessible = true;
      throw error;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || `GitHub API request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err) {
    if (err.isRateLimit || err.isInaccessible || err.status) {
      throw err;
    }
    const networkError = new Error(`Network error while communicating with GitHub: ${err.message}`);
    networkError.status = 502;
    throw networkError;
  }
}

/**
 * Fetches repository core metadata.
 */
export async function getRepository(owner, repo) {
  return await fetchFromGitHub(`/repos/${owner}/${repo}`);
}

/**
 * Fetches commit history.
 */
export async function getCommits(owner, repo, { per_page = 30, page = 1, sha } = {}) {
  return await fetchFromGitHub(`/repos/${owner}/${repo}/commits`, { per_page, page, sha });
}

/**
 * Fetches public events and filters down to push events.
 * GitHub Events API only retains the last 90 days or max 300 events.
 */
export async function getPushEvents(owner, repo, { per_page = 30, page = 1 } = {}) {
  const events = await fetchFromGitHub(`/repos/${owner}/${repo}/events`, { per_page, page });
  const pushEvents = events
    .filter((event) => event.type === 'PushEvent')
    .map((event) => ({
      id: event.id,
      actor: {
        login: event.actor?.login,
        avatar_url: event.actor?.avatar_url
      },
      ref: event.payload?.ref,
      distinct_size: event.payload?.distinct_size || 0,
      commits: (event.payload?.commits || []).map((c) => ({
        sha: c.sha,
        message: c.message,
        author: c.author
      })),
      created_at: event.created_at
    }));

  return {
    items: pushEvents,
    notice: 'Public push event history is subject to GitHub Events API limits (up to recent 90 days or 300 events).'
  };
}

/**
 * Fetches pull requests.
 */
export async function getPullRequests(owner, repo, { state = 'all', per_page = 30, page = 1 } = {}) {
  return await fetchFromGitHub(`/repos/${owner}/${repo}/pulls`, { state, per_page, page });
}

/**
 * Fetches issues, explicitly filtering out pull requests.
 */
export async function getIssues(owner, repo, { state = 'all', per_page = 30, page = 1 } = {}) {
  const rawItems = await fetchFromGitHub(`/repos/${owner}/${repo}/issues`, { state, per_page, page });
  // GitHub returns pull requests in the issues endpoint unless filtered
  return rawItems.filter((item) => !item.pull_request);
}

/**
 * Fetches repository contributors.
 */
export async function getContributors(owner, repo, { per_page = 30, page = 1 } = {}) {
  return await fetchFromGitHub(`/repos/${owner}/${repo}/contributors`, { per_page, page });
}

/**
 * Fetches repository branches.
 */
export async function getBranches(owner, repo, { per_page = 30, page = 1 } = {}) {
  return await fetchFromGitHub(`/repos/${owner}/${repo}/branches`, { per_page, page });
}

/**
 * Fetches repository releases.
 */
export async function getReleases(owner, repo, { per_page = 30, page = 1 } = {}) {
  return await fetchFromGitHub(`/repos/${owner}/${repo}/releases`, { per_page, page });
}

/**
 * Fetches Actions workflow runs.
 */
export async function getWorkflowRuns(owner, repo, { per_page = 20, page = 1 } = {}) {
  try {
    const data = await fetchFromGitHub(`/repos/${owner}/${repo}/actions/runs`, { per_page, page });
    return data.workflow_runs || [];
  } catch (err) {
    // Some repositories have Actions disabled; gracefully return empty list
    if (err.status === 404 || err.status === 403) {
      return [];
    }
    throw err;
  }
}

/**
 * Fetches repository languages byte breakdown.
 */
export async function getLanguages(owner, repo) {
  return await fetchFromGitHub(`/repos/${owner}/${repo}/languages`);
}

/**
 * Fetches recursive Git tree for a branch or commit SHA.
 */
export async function getGitTree(owner, repo, sha = 'HEAD') {
  try {
    return await fetchFromGitHub(`/repos/${owner}/${repo}/git/trees/${sha}`, { recursive: 1 });
  } catch (err) {
    if (err.status === 404 || err.status === 409) {
      // Empty repo or tree unavailable
      return { tree: [], truncated: false };
    }
    throw err;
  }
}

/**
 * Fetches content of a specific file in the repository with safety size checks.
 * Enforces a strict 100KB limit to prevent memory bloat on large artifacts.
 */
export async function getFileContent(owner, repo, path, ref = 'HEAD') {
  const MAX_FILE_SIZE = 100 * 1024; // 100 KB limit
  try {
    const data = await fetchFromGitHub(`/repos/${owner}/${repo}/contents/${path}`, { ref });
    if (data.type !== 'file') {
      return { path, skipped: true, reason: 'Not a regular file' };
    }
    if (data.size > MAX_FILE_SIZE) {
      return { path, size: data.size, skipped: true, reason: 'File size exceeds 100KB safety limit' };
    }

    if (!data.content && data.download_url) {
      // Small file without embedded base64 (rare on small files)
      const res = await fetch(data.download_url);
      const text = await res.text();
      return { path, size: data.size, content: text, sha: data.sha };
    }

    const decoded = Buffer.from(data.content || '', 'base64').toString('utf-8');
    return { path, size: data.size, content: decoded, sha: data.sha };
  } catch (err) {
    return { path, skipped: true, error: err.message };
  }
}

/**
 * Returns latest cached or remote rate limit info.
 */
export async function getRateLimitStatus() {
  try {
    const data = await fetchFromGitHub('/rate_limit');
    if (data?.rate) {
      latestRateLimit = {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: data.rate.reset,
        used: data.rate.used,
        hasToken: Boolean(process.env.GITHUB_TOKEN?.trim())
      };
    }
  } catch {
    // If fetching /rate_limit fails, fallback to in-memory cached headers
  }
  return latestRateLimit;
}
