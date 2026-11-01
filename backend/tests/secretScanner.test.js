import { describe, it, expect } from 'vitest';
import {
  scanContentForSecrets,
  scanRepositoryFiles,
  maskSecret,
  calculateEntropy
} from '../src/services/secretScanner.js';

describe('Secret Scanner & Gitleaks Engine (Defensive Security)', () => {
  // Synthetic Dummy Test Credentials
  const DUMMY_AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';
  const DUMMY_GH_PAT = 'ghp_0123456789abcdefghijklmnopqrstuvwxyz';
  const DUMMY_SLACK_TOKEN = 'xoxb-123456789012-1234567890123-abcdef123456';
  const DUMMY_DB_URI = 'postgres://admin:SuperSecretP@ss123@10.0.0.5:5432/production';
  const DUMMY_INTERNAL_ENDPOINT = 'http://192.168.1.50:8080/internal/metrics';

  it('calculates Shannon entropy accurately', () => {
    // Repeated string has low entropy
    expect(calculateEntropy('aaaaaaa')).toBe(0);
    // Random mixed string has high entropy
    expect(calculateEntropy('c2FtcGxlX3JhbmRvbV9zZWNyZXQ=')).toBeGreaterThan(3.5);
  });

  it('safely masks secrets without leaking full credential', () => {
    const masked = maskSecret(DUMMY_GH_PAT);
    expect(masked).toBe('ghp_...wxyz');
    expect(masked).not.toBe(DUMMY_GH_PAT);
    expect(maskSecret('short')).toBe('****');
  });

  it('detects synthetic dummy AWS Access Key ID', () => {
    const code = `const awsKey = "${DUMMY_AWS_KEY}";`;
    const findings = scanContentForSecrets('config/aws.js', code);

    expect(findings.length).toBe(1);
    expect(findings[0].ruleId).toBe('aws-access-key-id');
    expect(findings[0].severity).toBe('CRITICAL');
    expect(findings[0].line).toBe(1);
    expect(findings[0].maskedSecret).toBe('AKIA...MPLE');
    // Verifies raw secret is NEVER in findings
    expect(JSON.stringify(findings)).not.toContain(DUMMY_AWS_KEY);
  });

  it('detects synthetic dummy GitHub Personal Access Token', () => {
    const code = `\n// auth config\nconst token = "${DUMMY_GH_PAT}";\n`;
    const findings = scanContentForSecrets('.env', code);

    expect(findings.length).toBe(1);
    expect(findings[0].ruleId).toBe('github-pat');
    expect(findings[0].severity).toBe('CRITICAL');
    expect(findings[0].line).toBe(3);
    expect(findings[0].maskedSecret).toBe('ghp_...wxyz');
    expect(JSON.stringify(findings)).not.toContain(DUMMY_GH_PAT);
  });

  it('detects Database connection URI with credentials', () => {
    const config = `DATABASE_URL="${DUMMY_DB_URI}"`;
    const findings = scanContentForSecrets('config/database.env', config);

    expect(findings.some((f) => f.ruleId === 'database-connection-uri')).toBe(true);
    expect(findings[0].severity).toBe('CRITICAL');
  });

  it('detects internal network endpoints in custom checks', () => {
    const code = `const metricsUrl = "${DUMMY_INTERNAL_ENDPOINT}";`;
    const findings = scanContentForSecrets('src/telemetry.js', code);

    expect(findings.some((f) => f.ruleId === 'internal-network-endpoint')).toBe(true);
    expect(findings[0].severity).toBe('MEDIUM');
  });

  it('scans batch of repository files and reports skipped oversized files', () => {
    const files = [
      { path: 'src/app.js', content: 'console.log("clean app");' },
      { path: 'config/keys.js', content: `const key = "${DUMMY_AWS_KEY}";` },
      { path: 'big-bundle.min.js', skipped: true, reason: 'File size exceeds 100KB safety limit' }
    ];

    const report = scanRepositoryFiles(files, 'commit123');

    expect(report.scannedFileCount).toBe(2);
    expect(report.skippedFileCount).toBe(1);
    expect(report.totalFindings).toBe(1);
    expect(report.severityCounts.CRITICAL).toBe(1);
    expect(report.disclaimer).toBeDefined();
    // Raw secret never appears in report
    expect(JSON.stringify(report)).not.toContain(DUMMY_AWS_KEY);
  });
});
