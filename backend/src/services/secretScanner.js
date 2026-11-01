/**
 * Gitleaks-compatible Secret Detection Engine
 * Scans text content for known credentials, private keys, connection strings,
 * internal endpoints, and suspicious configuration values.
 *
 * Enforces strict masking: RAW SECRETS ARE NEVER RETURNED OR EXPOSED.
 */

// Shannon entropy calculator to verify randomness in generic secrets
export function calculateEntropy(str) {
  if (!str || str.length === 0) return 0;
  const freq = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    freq[char] = (freq[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Safely masks a secret string so it can be previewed without revealing the raw credential.
 * Example: "ghp_sample_token_mock_key" -> "ghp_..._key"
 */
export function maskSecret(secret) {
  if (!secret || typeof secret !== 'string') return '****';
  const trimmed = secret.trim();
  if (trimmed.length <= 8) {
    return '****';
  }
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

// Built-in rule catalog mirroring standard Gitleaks patterns
export const SECRET_RULES = [
  {
    id: 'aws-access-key-id',
    name: 'AWS Access Key ID',
    regex: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
    severity: 'CRITICAL',
    remediation: 'Revoke this access key immediately in AWS IAM Console. Verify CloudTrail for unauthorized activity and rotate IAM credentials.'
  },
  {
    id: 'aws-secret-access-key',
    name: 'AWS Secret Access Key',
    regex: /(?:aws_secret_access_key|aws_secret_key|secret_access_key)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi,
    secretGroup: 1,
    severity: 'CRITICAL',
    remediation: 'Revoke matching AWS Access Key in IAM Console immediately. Audit CloudTrail access logs.'
  },
  {
    id: 'github-pat',
    name: 'GitHub Personal Access Token',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b/g,
    severity: 'CRITICAL',
    remediation: 'Revoke this token immediately at github.com/settings/tokens. Check audit logs for any unauthorized repository or API operations.'
  },

  {
    id: 'github-fine-grained-pat',
    name: 'GitHub Fine-Grained Token',
    regex: /\bgithub_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}\b/g,
    severity: 'CRITICAL',
    remediation: 'Revoke fine-grained PAT in GitHub Settings. Restrict organization access permissions.'
  },
  {
    id: 'private-key',
    name: 'Asymmetric Private Key',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    remediation: 'This private key is compromised. Remove from repository history, generate a new cryptographic key pair, and revoke the public key on all servers.'
  },
  {
    id: 'slack-token',
    name: 'Slack Bot/User Token',
    regex: /\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*\b/g,
    severity: 'HIGH',
    remediation: 'Regenerate this Slack API token in the Slack App Directory console and verify app permissions.'
  },
  {
    id: 'stripe-secret-key',
    name: 'Stripe Secret API Key',
    regex: /\b(sk|rk)_(live|test)_[0-9a-zA-Z]{24,99}\b/g,
    severity: 'CRITICAL',
    remediation: 'Roll API key immediately in the Stripe Dashboard under Developers > API Keys. Ensure no unauthorized charges or refunds were initiated.'
  },
  {
    id: 'database-connection-uri',
    name: 'Database Connection String with Credentials',
    regex: /(?:postgres|postgresql|mysql|mongodb|mongodb\+srv|redis):\/\/[a-zA-Z0-9_.-]+:[^@\s"']+@[a-zA-Z0-9_.-]+(?::\d+)?\/?[^\s"']*/gi,
    severity: 'CRITICAL',
    remediation: 'Rotate the database password immediately. Never commit connection strings containing plaintext credentials; store them in environment secrets.'
  },
  {
    id: 'jwt-token',
    name: 'JSON Web Token (JWT)',
    regex: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
    severity: 'MEDIUM',
    remediation: 'Ensure this token is expired or invalidated. Never commit bearer authentication tokens into source control.'
  },
  // Custom check: Suspicious Hardcoded Password in Config
  {
    id: 'suspicious-config-password',
    name: 'Suspicious Hardcoded Password in Configuration',
    regex: /(?:password|passwd|pwd|db_pass)\s*[:=]\s*["']([^"'\s]{6,})["']/gi,
    secretGroup: 1,
    severity: 'HIGH',
    customCheck: (val) => {
      const lower = val.toLowerCase();
      // Ignore obvious placeholders
      const isPlaceholder = ['change_me', 'your_password', 'password', 'placeholder', 'secret', 'admin', '123456', 'root'].includes(lower);
      return !isPlaceholder && calculateEntropy(val) > 2.5;
    },
    remediation: 'Move this password into an environment variable or secret manager. Never hardcode plaintext credentials in configuration.'
  },
  // Custom check: Internal / Private Network Endpoints Exposed
  {
    id: 'internal-network-endpoint',
    name: 'Internal Network Endpoint / Hostname Exposed',
    regex: /https?:\/\/(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9-]+\.(?:internal|local|corp|lan|cluster\.local))(?::\d+)?(?:\/[^\s"']*)?/gi,
    severity: 'MEDIUM',
    remediation: 'Internal network addresses reveal private network topology. Parameterize these service URLs using environment variables.'
  }
];

/**
 * Scans a text file for secrets and returns classified findings.
 * Raw secrets are always masked.
 *
 * @param {string} filePath - Path of the file
 * @param {string} content - Raw content of the file
 * @param {string} commitSha - Target commit SHA
 * @returns {Array<object>} Array of findings
 */
export function scanContentForSecrets(filePath, content, commitSha = 'HEAD') {
  if (!content || typeof content !== 'string') return [];

  const findings = [];
  const lines = content.split('\n');

  for (const rule of SECRET_RULES) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const rawSecret = rule.secretGroup ? match[rule.secretGroup] : match[0];
      if (!rawSecret) continue;

      // Apply optional custom filter validation
      if (rule.customCheck && !rule.customCheck(rawSecret)) {
        continue;
      }

      // Find line number
      const matchIndex = match.index;
      const textBefore = content.substring(0, matchIndex);
      const lineNumber = textBefore.split('\n').length;
      const lineContent = lines[lineNumber - 1] || '';

      // Mask raw secret for preview
      const maskedSecret = maskSecret(rawSecret);

      // Create a masked snippet of the line (replace raw secret in lineContent with masked version)
      const maskedLine = lineContent.replace(rawSecret, maskedSecret).trim();

      findings.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        file: filePath,
        line: lineNumber,
        maskedSecret,
        maskedSnippet: maskedLine,
        remediation: rule.remediation,
        commitSha,
        commitUrl: `https://github.com/blob/${commitSha}/${filePath}#L${lineNumber}`
      });
    }
  }

  return findings;
}

/**
 * Scans an array of files in batch with bounded execution time and file count limits.
 *
 * @param {Array<{path: string, content: string}>} files - Array of files to scan
 * @param {string} commitSha - Analyzed commit SHA
 * @returns {object} Summary report including findings, scanned count, and limitations
 */
export function scanRepositoryFiles(files = [], commitSha = 'HEAD') {
  const startTime = Date.now();
  const MAX_FILES_TO_SCAN = 35;
  const scannedFiles = [];
  const skippedFiles = [];
  const findings = [];

  const filesToScan = files.slice(0, MAX_FILES_TO_SCAN);
  if (files.length > MAX_FILES_TO_SCAN) {
    skippedFiles.push({
      reason: `Batch capped at ${MAX_FILES_TO_SCAN} high-value files to protect processing time. Remaining ${files.length - MAX_FILES_TO_SCAN} files deferred.`
    });
  }

  for (const file of filesToScan) {
    if (file.skipped) {
      skippedFiles.push({ file: file.path, reason: file.reason || file.error });
      continue;
    }

    // Exclude automated test suites and mock fixtures from production secret scanning
    const p = (file.path || '').toLowerCase();
    if (
      p.includes('/tests/') ||
      p.includes('/test/') ||
      p.startsWith('tests/') ||
      p.startsWith('test/') ||
      p.includes('.test.') ||
      p.includes('.spec.') ||
      p.includes('/fixtures/') ||
      p.includes('/mocks/')
    ) {
      skippedFiles.push({ file: file.path, reason: 'Test file / mock fixture excluded from production credential audit' });
      continue;
    }

    scannedFiles.push(file.path);
    const fileFindings = scanContentForSecrets(file.path, file.content, commitSha);
    findings.push(...fileFindings);
  }

  const durationMs = Date.now() - startTime;

  // Severity counts
  const severityCounts = {
    CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
    HIGH: findings.filter((f) => f.severity === 'HIGH').length,
    MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
    LOW: findings.filter((f) => f.severity === 'LOW').length
  };

  return {
    totalFindings: findings.length,
    severityCounts,
    scannedFileCount: scannedFiles.length,
    skippedFileCount: skippedFiles.length,
    durationMs,
    commitSha,
    findings,
    skippedFiles,
    disclaimer: 'A clean scan indicates no known secret patterns matched in inspected files; it does not prove the total absence of security vulnerabilities or custom secret formats.'
  };
}
