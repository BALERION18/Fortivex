import { describe, it, expect } from 'vitest';
import {
  analyzeHistoryComparison,
  estimateChangeImpact,
  analyzeContributorOwnership,
  checkDocumentationDrift,
  runSetupDoctor
} from '../src/services/advancedAnalytics.js';

describe('Advanced Analytics Service', () => {
  describe('analyzeHistoryComparison', () => {
    it('handles empty or missing commits gracefully', () => {
      const res = analyzeHistoryComparison([]);
      expect(res.totalCommitsSampled).toBe(0);
      expect(res.velocity).toContain('No commit data');
    });

    it('calculates velocity and author breakdown from commits', () => {
      const mockCommits = [
        { author: { login: 'alice' }, commit: { author: { date: '2026-10-18T10:00:00Z' } } },
        { author: { login: 'alice' }, commit: { author: { date: '2026-10-18T11:00:00Z' } } },
        { author: { login: 'bob' }, commit: { author: { date: '2026-10-17T09:00:00Z' } } }
      ];

      const res = analyzeHistoryComparison(mockCommits);
      expect(res.totalCommitsSampled).toBe(3);
      expect(res.authorCount).toBe(2);
      expect(res.authors[0].name).toBe('alice');
      expect(res.authors[0].count).toBe(2);
    });
  });

  describe('estimateChangeImpact', () => {
    it('evaluates blast radius based on manifests and configs', () => {
      const mockTree = [
        { path: 'package.json' },
        { path: 'docker-compose.yml' },
        { path: 'server.js' },
        { path: 'README.md' }
      ];
      const mockCommits = [
        { commit: { message: 'bump dependency version' } }
      ];

      const res = estimateChangeImpact(mockCommits, mockTree);
      expect(res.blastRadiusScore).toBeGreaterThanOrEqual(50);
      expect(['HIGH', 'CRITICAL']).toContain(res.riskTier);
      expect(res.impactFactors.length).toBeGreaterThan(0);
    });

    it('evaluates low risk when only documentation exists', () => {
      const mockTree = [{ path: 'README.md' }, { path: 'docs/guide.md' }];
      const res = estimateChangeImpact([], mockTree);
      expect(res.riskTier).toBe('LOW');
    });
  });

  describe('analyzeContributorOwnership & Bus Factor', () => {
    it('flags high concentration and includes mandatory cautionary disclaimer', () => {
      const mockContributors = [
        { login: 'lead-dev', contributions: 90 },
        { login: 'contributor-2', contributions: 10 }
      ];

      const res = analyzeContributorOwnership(mockContributors);
      expect(res.top1Percentage).toBe(90);
      expect(res.concentrationLevel).toBe('Critical Concentration');
      expect(res.heuristicBusFactor).toContain('1');
      expect(res.cautionaryDisclaimer).toContain('CAUTIONARY HEURISTIC NOTICE');
      expect(res.cautionaryDisclaimer).toContain('Do not use as an absolute team performance or staffing metric');
    });


    it('handles diversified distribution', () => {
      const mockContributors = [
        { login: 'alice', contributions: 25 },
        { login: 'bob', contributions: 25 },
        { login: 'carol', contributions: 25 },
        { login: 'dave', contributions: 25 }
      ];

      const res = analyzeContributorOwnership(mockContributors);
      expect(res.top1Percentage).toBe(25);
      expect(res.concentrationLevel).toBe('Diversified');
      expect(res.heuristicBusFactor).toContain('>= 4');
    });
  });

  describe('checkDocumentationDrift', () => {
    it('detects missing scripts and broken file path references', () => {
      const readme = `
        ## Setup
        Run \`npm run build:prod\` to compile.
        See \`src/missing-file.js\` for configuration.
      `;
      const tree = [{ path: 'src/real-file.js' }, { path: 'package.json' }];
      const pkg = { scripts: { test: 'vitest run' } }; // build:prod is missing

      const res = checkDocumentationDrift(readme, tree, pkg);
      expect(res.discrepanciesCount).toBeGreaterThan(0);
      const scriptDrift = res.discrepancies.find((d) => d.type === 'UNRESOLVED_SCRIPT');
      expect(scriptDrift).toBeDefined();
      expect(scriptDrift.detail).toContain('build:prod');
    });
  });

  describe('runSetupDoctor', () => {
    it('evaluates repository hygiene checklist', () => {
      const tree = [
        { path: '.env.example' },
        { path: 'package-lock.json' },
        { path: '.gitignore' },
        { path: 'LICENSE' },
        { path: '.github/workflows/ci.yml' }
      ];
      const pkg = {
        name: 'test-app',
        scripts: { test: 'vitest run' }
      };

      const res = runSetupDoctor(tree, pkg);
      expect(res.hygieneScore).toBe(100);
      expect(res.overallRating).toBe('Excellent');
      expect(res.passedCount).toBe(res.totalCount);
    });

    it('warns when lockfile or test script is missing', () => {
      const tree = [{ path: 'index.js' }];
      const pkg = { name: 'untested-app', scripts: {} };

      const res = runSetupDoctor(tree, pkg);
      expect(res.hygieneScore).toBeLessThan(70);
      const testCheck = res.checks.find((c) => c.id === 'test-script');
      expect(testCheck.status).toBe('WARNING');
    });

    it('recognizes Python test harness and requirements manifest in Setup Doctor', () => {
      const tree = [
        { path: 'backend/requirements.txt' },
        { path: 'backend/tests/conftest.py' },
        { path: 'backend/tests/test_api.py' },
        { path: '.env.example' },
        { path: '.gitignore' },
        { path: 'LICENSE' }
      ];

      const res = runSetupDoctor(tree, null);
      const testCheck = res.checks.find((c) => c.id === 'test-script');
      expect(testCheck.status).toBe('PASS');
      expect(testCheck.remediation).toContain('Pytest');

      const lockCheck = res.checks.find((c) => c.id === 'lockfile-check');
      expect(lockCheck.status).toBe('PASS');
    });
  });

  describe('PS60 Attributable Contributor & Percentage Accuracy', () => {
    it('calculates exact contributor percentages that sum to 100.0% from attributable commits', () => {
      // PS60 commit attribution fixture: 20 total commits
      const ps60Commits = [
        ...Array(14).fill({ author: { login: 'BALERION18' }, commit: { author: { name: 'BALERION18' } } }),
        ...Array(2).fill({ author: { login: 'student-NIET' }, commit: { author: { name: 'student-NIET' } } }),
        ...Array(2).fill({ author: { login: 'kunwarshaurya' }, commit: { author: { name: 'kunwarshaurya' } } }),
        ...Array(2).fill({ author: { login: 'Ankur05678' }, commit: { author: { name: 'Ankur05678' } } })
      ];

      // Pass empty contributors array to test fallback to attributable commits
      const res = analyzeContributorOwnership([], ps60Commits);

      expect(res.totalContributors).toBe(4);
      expect(res.totalContributions).toBe(20);

      const balerion = res.topContributors.find((c) => c.name === 'BALERION18');
      expect(balerion.percentage).toBe(70.0);

      const student = res.topContributors.find((c) => c.name === 'student-NIET');
      expect(student.percentage).toBe(10.0);

      // Verify exact sum of percentages = 100.0%
      const sumPercentages = res.topContributors.reduce((sum, c) => sum + c.percentage, 0);
      expect(Math.round(sumPercentages)).toBe(100);

      // Verify cautionary disclaimer is attached
      expect(res.cautionaryDisclaimer).toContain('CAUTIONARY HEURISTIC NOTICE');
    });
  });
});
