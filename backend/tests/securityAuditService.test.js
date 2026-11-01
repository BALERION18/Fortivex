import { describe, it, expect } from 'vitest';
import { auditRepositorySecurity } from '../src/services/securityAuditService.js';

describe('Security Audit & Attack Defense Service', () => {
  it('correctly calculates security score and pillars for a clean repo', () => {
    const tree = [
      { path: 'package.json', type: 'blob' },
      { path: 'package-lock.json', type: 'blob' },
      { path: '.gitignore', type: 'blob' },
      { path: 'SECURITY.md', type: 'blob' },
      { path: '.github/workflows/ci.yml', type: 'blob' }
    ];

    const candidateFiles = [
      { path: 'package.json', content: JSON.stringify({ dependencies: { express: '^4.19.2' } }) },
      { path: '.github/workflows/ci.yml', content: 'name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n' },
      { path: 'src/server.js', content: 'console.log("Safe code");' }
    ];

    const report = auditRepositorySecurity(tree, candidateFiles, 'abcdef123456');

    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.grade).toMatch(/^A/);
    expect(report.riskTier).toBe('LOW');
    expect(report.pillars.length).toBe(5);
    expect(report.criticalCount).toBe(0);
    expect(report.highCount).toBe(0);
  });

  it('detects command injection anti-pattern in Node.js and Python', () => {
    const tree = [
      { path: 'src/utils.js', type: 'blob' },
      { path: 'scripts/deploy.py', type: 'blob' }
    ];

    const candidateFiles = [
      { path: 'src/utils.js', content: 'const cp = require("child_process");\ncp.execSync("rm -rf " + userInput);' },
      { path: 'scripts/deploy.py', content: 'import os\nos.system("git pull " + branch)' }
    ];

    const report = auditRepositorySecurity(tree, candidateFiles, 'abcdef123456');

    const cmdFindings = report.findings.filter((f) => f.ruleId.startsWith('cmd-injection'));
    expect(cmdFindings.length).toBe(2);
    expect(cmdFindings[0].severity).toBe('HIGH');
    expect(report.score).toBeLessThan(85);
  });

  it('detects dangerous CI/CD triggers and unpinned moving branch actions', () => {
    const tree = [
      { path: '.github/workflows/ci.yml', type: 'blob' }
    ];

    const candidateFiles = [
      {
        path: '.github/workflows/ci.yml',
        content: `name: Risky\non:\n  pull_request_target:\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: thirdparty/action@master\n`
      }
    ];

    const report = auditRepositorySecurity(tree, candidateFiles, 'abcdef123456');

    expect(report.findings.some((f) => f.ruleId === 'cicd-pull-request-target')).toBe(true);
    expect(report.findings.some((f) => f.ruleId === 'cicd-unpinned-action')).toBe(true);
    expect(report.criticalCount).toBeGreaterThanOrEqual(1);
  });

  it('flags missing lockfile when manifest is present', () => {
    const tree = [
      { path: 'package.json', type: 'blob' }
    ];

    const candidateFiles = [
      { path: 'package.json', content: JSON.stringify({ dependencies: { react: '*' } }) }
    ];

    const report = auditRepositorySecurity(tree, candidateFiles, 'abcdef123456');

    const lockCheck = report.checks.find((c) => c.ruleId === 'supply-chain-lockfile');
    expect(lockCheck.status).toBe('WARN');

    const wildcardFinding = report.findings.find((f) => f.ruleId === 'supply-chain-wildcard-dep');
    expect(wildcardFinding).toBeDefined();
  });
});
