/**
 * Validates and extracts owner and repository name from various GitHub URL formats.
 *
 * Supported formats:
 * - "owner/repo"
 * - "https://github.com/owner/repo"
 * - "https://github.com/owner/repo.git"
 * - "github.com/owner/repo"
 * - "http://github.com/owner/repo/tree/main"
 *
 * @param {string} input - User-provided repository string or URL
 * @returns {{ valid: boolean, owner?: string, repo?: string, fullName?: string, error?: string }}
 */
export function parseGitHubUrl(input) {
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      error: 'Please enter a repository URL or owner/repo path.'
    };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Repository input cannot be empty.'
    };
  }

  // Remove leading/trailing slashes and common prefixes
  let cleaned = trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/^github\.com\//i, '')
    .replace(/\.git$/i, '');

  // If there are subpaths like /tree/main, /issues, /pulls, strip them to get owner/repo
  const parts = cleaned.split('/').filter(Boolean);

  if (parts.length < 2) {
    return {
      valid: false,
      error: 'Invalid format. Use "owner/repo" or a full GitHub repository link.'
    };
  }

  const owner = parts[0];
  const repo = parts[1];

  // GitHub username: 1-39 chars, alphanumeric and single hyphens, no consecutive hyphens at ends
  const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

  // GitHub repository name: 1-100 chars, alphanumeric, hyphens, underscores, dots
  const repoRegex = /^[a-zA-Z0-9_.-]{1,100}$/;

  if (!ownerRegex.test(owner)) {
    return {
      valid: false,
      error: `Invalid owner name "${owner}". GitHub usernames contain alphanumeric characters and hyphens.`
    };
  }

  if (!repoRegex.test(repo)) {
    return {
      valid: false,
      error: `Invalid repository name "${repo}".`
    };
  }

  return {
    valid: true,
    owner,
    repo,
    fullName: `${owner}/${repo}`
  };
}
