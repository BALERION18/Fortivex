const API_BASE = '/api';

/**
 * Generic request helper that unpacks backend responses and parses custom error states.
 */
async function apiRequest(endpoint, params = {}) {
  const url = new URL(`${window.location.origin}${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.append(key, String(val));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json'
    }
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.isRateLimit = Boolean(body.isRateLimit);
    error.isInaccessible = Boolean(body.isInaccessible);
    error.rateLimit = body.rateLimit || null;
    throw error;
  }

  return body.data;
}

/**
 * Fetches the complete aggregated repository dataset.
 */
export async function fetchRepoOverview(owner, repo) {
  return await apiRequest(`/repo/${owner}/${repo}`);
}

/**
 * Fetches paginated commits.
 */
export async function fetchCommits(owner, repo, params = {}) {
  return await apiRequest(`/repo/${owner}/${repo}/commits`, params);
}

/**
 * Fetches paginated push events.
 */
export async function fetchPushEvents(owner, repo, params = {}) {
  return await apiRequest(`/repo/${owner}/${repo}/events`, params);
}

/**
 * Fetches paginated pull requests.
 */
export async function fetchPullRequests(owner, repo, params = {}) {
  return await apiRequest(`/repo/${owner}/${repo}/pulls`, params);
}

/**
 * Fetches paginated issues (PRs excluded).
 */
export async function fetchIssues(owner, repo, params = {}) {
  return await apiRequest(`/repo/${owner}/${repo}/issues`, params);
}

/**
 * Fetches contributors.
 */
export async function fetchContributors(owner, repo, params = {}) {
  return await apiRequest(`/repo/${owner}/${repo}/contributors`, params);
}

/**
 * Fetches branches.
 */
export async function fetchBranches(owner, repo, params = {}) {
  return await apiRequest(`/repo/${owner}/${repo}/branches`, params);
}

/**
 * Fetches releases.
 */
export async function fetchReleases(owner, repo, params = {}) {
  return await apiRequest(`/repo/${owner}/${repo}/releases`, params);
}

/**
 * Fetches Actions workflow runs.
 */
export async function fetchWorkflowRuns(owner, repo, params = {}) {
  return await apiRequest(`/repo/${owner}/${repo}/actions`, params);
}

/**
 * Fetches current rate limit status.
 */
export async function fetchRateLimit() {
  return await apiRequest('/rate-limit');
}

/**
 * Phase 2: Runs Gitleaks secret detection scan across repository files.
 */
export async function scanSecrets(owner, repo, ref = 'HEAD') {
  return await apiRequest(`/security/scan/${owner}/${repo}`, { ref });
}

/**
 * Phase 2: Fetches living architecture analysis, routes, and schemas.
 */
export async function fetchCodeIntelligence(owner, repo, ref = 'HEAD') {
  return await apiRequest(`/ai/intelligence/${owner}/${repo}`, { ref });
}

/**
 * Phase 2: Submits a natural language inquiry to the codebase AI engine.
 */
export async function queryCodebaseAI(owner, repo, query, ref = 'HEAD') {
  const url = `${window.location.origin}${API_BASE}/ai/query/${owner}/${repo}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ query, ref })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `AI query failed with status ${response.status}`);
  }
  return body.data;
}

/**
 * Phase 3: Fetches advanced insights (change impact, bus factor, doc drift, setup doctor).
 */
export async function fetchAdvancedInsights(owner, repo, ref = 'HEAD') {
  return await apiRequest(`/analytics/insights/${owner}/${repo}`, { ref });
}

/**
 * Phase 3: Downloads the sanitized executive PDF report.
 */
export async function downloadPdfReport(owner, repo, ref = 'HEAD') {
  const url = `${window.location.origin}${API_BASE}/reports/pdf/${owner}/${repo}?ref=${encodeURIComponent(ref)}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || `PDF generation failed with HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${owner}-${repo}-fortivex-audit.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
}

/**
 * Authentication: Register a new user
 */
export async function registerUser({ fullName, email, username, password }) {
  const url = `${window.location.origin}${API_BASE}/auth/register`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, username, password })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'Registration failed');
  }

  if (body.data?.token) {
    localStorage.setItem('fortivex_auth_token', body.data.token);
    localStorage.setItem('fortivex_user', JSON.stringify(body.data.user));
  }

  return body.data;
}

/**
 * Authentication: Log in existing user
 */
export async function loginUser(loginIdentifier, password) {
  const url = `${window.location.origin}${API_BASE}/auth/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginIdentifier, password })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'Login failed');
  }

  if (body.data?.token) {
    localStorage.setItem('fortivex_auth_token', body.data.token);
    localStorage.setItem('fortivex_user', JSON.stringify(body.data.user));
  }

  return body.data;
}

/**
 * Authentication: Get currently logged in user
 */
export async function fetchCurrentUser() {
  const token = localStorage.getItem('fortivex_auth_token');
  if (!token) return null;

  const url = `${window.location.origin}${API_BASE}/auth/me`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    localStorage.removeItem('fortivex_auth_token');
    localStorage.removeItem('fortivex_user');
    return null;
  }

  const body = await response.json().catch(() => ({}));
  return body.data?.user || null;
}

/**
 * Check Database Connection Status
 */
export async function fetchDatabaseStatus() {
  return await apiRequest('/auth/db-status');
}

