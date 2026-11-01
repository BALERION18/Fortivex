/**
 * Formats a number with comma separators or abbreviated units (e.g., 1.5k).
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return num.toLocaleString();
}

/**
 * Formats an ISO date string into a localized readable date.
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats an ISO date string into relative time (e.g. "3 days ago").
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) {
    return formatDate(dateString);
  }
  if (diffDay >= 1) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  }
  if (diffHour >= 1) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  }
  if (diffMin >= 1) {
    return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/**
 * Validates and extracts owner and repo on the client side.
 */
export function parseClientUrl(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Enter a repository URL or owner/repo' };
  }

  const cleaned = input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/^github\.com\//i, '')
    .replace(/\.git$/i, '');

  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length < 2) {
    return { valid: false, error: 'Please enter "owner/repo" or full GitHub URL.' };
  }

  const owner = parts[0];
  const repo = parts[1];

  const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  const repoRegex = /^[a-zA-Z0-9_.-]{1,100}$/;

  if (!ownerRegex.test(owner) || !repoRegex.test(repo)) {
    return { valid: false, error: 'Invalid characters in owner or repository name.' };
  }

  return { valid: true, owner, repo, fullName: `${owner}/${repo}` };
}
