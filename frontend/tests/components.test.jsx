import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Navbar from '../src/components/Navbar.jsx';
import EmptyState from '../src/components/EmptyState.jsx';
import RateLimitBanner from '../src/components/RateLimitBanner.jsx';
import HealthIndicatorCard from '../src/components/HealthIndicatorCard.jsx';
import SecurityScannerTab from '../src/components/SecurityScannerTab.jsx';
import AIQuestionPanel from '../src/components/AIQuestionPanel.jsx';
import CodeIntelligenceTab from '../src/components/CodeIntelligenceTab.jsx';
import AdvancedInsightsTab from '../src/components/AdvancedInsightsTab.jsx';
import AuthPage from '../src/components/AuthPage.jsx';
import FlowableCanvas from '../src/components/FlowableCanvas.jsx';
import * as apiClient from '../src/api/client.js';



describe('Frontend Components', () => {
  it('renders Navbar with brand title and rate limit info', () => {
    const rateLimit = { remaining: 55, limit: 60, hasToken: false };
    render(<Navbar rateLimit={rateLimit} />);

    expect(screen.getByText('FORTIVEX')).toBeInTheDocument();
    expect(screen.getByText('55/60')).toBeInTheDocument();
  });

  it('renders EmptyState with popular repository suggestions', () => {
    render(<EmptyState onSelectRepo={() => {}} />);

    expect(screen.getByText('GitHub Observability & Security Cockpit')).toBeInTheDocument();
    expect(screen.getByText('facebook/react')).toBeInTheDocument();
    expect(screen.getByText('expressjs/express')).toBeInTheDocument();
  });

  it('renders RateLimitBanner when quota is low (<10)', () => {
    const rateLimit = { remaining: 5, limit: 60, reset: 1770000000, hasToken: false };
    render(<RateLimitBanner rateLimit={rateLimit} />);

    expect(screen.getByText(/Low GitHub API quota/i)).toBeInTheDocument();
  });

  it('does not render RateLimitBanner when quota is high (>10)', () => {
    const rateLimit = { remaining: 50, limit: 60, reset: 1770000000, hasToken: false };
    const { container } = render(<RateLimitBanner rateLimit={rateLimit} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders HealthIndicatorCard with measurable metrics', () => {
    const mockHealth = {
      overallRating: 'Healthy',
      activity: {
        daysSinceLastPush: 2,
        activityStatus: 'Very Active',
        lastPushedAt: '2026-10-16T10:00:00Z'
      },
      issues: {
        totalOpenCount: 10,
        sampledOpen: 2,
        sampledClosed: 8,
        sampledResolutionRate: 80
      },
      pullRequests: {
        sampledOpen: 3,
        sampledClosed: 7,
        sampledResolutionRate: 70
      },
      ci: {
        ciStatus: 'Passing',
        totalRuns: 5,
        completedRuns: 5,
        successfulRuns: 5,
        failedRuns: 0,
        successPercentage: 100
      },
      standards: {
        passed: 5,
        total: 5,
        checklist: [
          { id: 'license', label: 'Open Source License', passed: true, detail: 'MIT' }
        ]
      }
    };

    render(<HealthIndicatorCard health={mockHealth} />);
    expect(screen.getByText('Status: Healthy')).toBeInTheDocument();
    expect(screen.getByText('Very Active')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('100% success')).toBeInTheDocument();
  });

  it('renders SecurityScannerTab with masked secret findings', async () => {
    const mockReport = {
      repository: 'test/repo',
      commitSha: 'a1b2c3d4e5f6',
      scannedFileCount: 12,
      durationMs: 45,
      totalFindings: 1,
      severityCounts: { CRITICAL: 1, HIGH: 0, MEDIUM: 0, LOW: 0 },
      findings: [
        {
          ruleId: 'github-pat',
          ruleName: 'GitHub Personal Access Token (classic)',
          severity: 'CRITICAL',
          file: 'backend/.env',
          line: 4,
          maskedSecret: 'ghp_...Wxyz',
          maskedSnippet: 'GITHUB_TOKEN=ghp_...Wxyz',
          remediation: 'Revoke and rotate the exposed token immediately.',
          commitUrl: 'https://github.com/test/repo/blob/a1b2c3d4e5f6/backend/.env#L4'
        }
      ],
      disclaimer: 'A clean scan indicates no known secret patterns matched.'
    };

    vi.spyOn(apiClient, 'scanSecrets').mockResolvedValue(mockReport);

    render(<SecurityScannerTab owner="test" repo="repo" />);

    expect(screen.getByText(/Gitleaks Secret Detection & Credential Audit/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ghp_...Wxyz')).toBeInTheDocument();
      expect(screen.getByText(/GitHub Personal Access Token/i)).toBeInTheDocument();
      expect(screen.getByText(/Revoke and rotate/i)).toBeInTheDocument();
    });
  });

  it('renders AIQuestionPanel and handles grounded question interaction', async () => {
    const mockAnswer = {
      question: 'Where are API routes declared?',
      commitSha: 'a1b2c3d4e5f6',
      answer: 'API routes are declared in backend/src/app.js using Express router mounts.',
      citations: [
        {
          file: 'backend/src/app.js',
          line: 15,
          snippet: "app.use('/api', apiRoutes);",
          commitUrl: 'https://github.com/test/repo/blob/a1b2c3d4e5f6/backend/src/app.js#L15'
        }
      ]
    };

    vi.spyOn(apiClient, 'queryCodebaseAI').mockResolvedValue(mockAnswer);

    render(<AIQuestionPanel owner="test" repo="repo" commitSha="a1b2c3d4e5f6" />);

    expect(screen.getByText(/Repository Q&A Assistant/i)).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Ask about architecture/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Where are API routes declared?' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText(/backend\/src\/app.js using Express router mounts/i)).toBeInTheDocument();
      expect(screen.getByText(/backend\/src\/app.js:15/i)).toBeInTheDocument();
    });
  });

  it('renders CodeIntelligenceTab with manifest and epistemic triad', async () => {
    const mockIntelligence = {
      repository: 'test/repo',
      commitSha: 'a1b2c3d4e5f6',
      purpose: 'An enterprise-grade observability dashboard.',
      manifest: {
        name: 'test-repo',
        version: '1.0.0',
        dependencies: ['express', 'cors'],
        devDependencies: ['vitest']
      },
      setupGuide: {
        installCommand: 'npm install',
        runDevCommand: 'npm run dev',
        testCommand: 'npm test'
      },
      routes: [
        {
          method: 'GET',
          path: '/api/health',
          file: 'backend/src/app.js',
          line: 25,
          commitUrl: 'https://github.com/test/repo/blob/a1b2c3d4e5f6/backend/src/app.js#L25'
        }
      ],
      schemas: [
        {
          type: 'Prisma Model',
          name: 'User',
          file: 'prisma/schema.prisma',
          line: 10,
          commitUrl: 'https://github.com/test/repo/blob/a1b2c3d4e5f6/prisma/schema.prisma#L10'
        }
      ],
      epistemicTriad: {
        verifiedFacts: [{ claim: 'Standard Node.js application managed by package.json.' }],
        inferences: ['Express.js REST API service architecture inferred.'],
        unknowns: ['Runtime environment variables (.env) are not tracked.']
      }
    };

    vi.spyOn(apiClient, 'fetchCodeIntelligence').mockResolvedValue(mockIntelligence);
    vi.spyOn(apiClient, 'queryCodebaseAI').mockResolvedValue({
      question: '',
      commitSha: 'a1b2c3d4e5f6',
      answer: '',
      citations: []
    });

    render(<CodeIntelligenceTab owner="test" repo="repo" commitSha="a1b2c3d4e5f6" />);

    expect(screen.getByText(/DeepWiki Codebase Architecture/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/An enterprise-grade observability dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/npm run dev/i)).toBeInTheDocument();
      expect(screen.getByText('/api/health')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText(/VERIFIED FACTS/i)).toBeInTheDocument();
      expect(screen.getByText(/ARCHITECTURAL INFERENCES/i)).toBeInTheDocument();
      expect(screen.getByText(/UNKNOWNS & LIMITATIONS/i)).toBeInTheDocument();
    });
  });

  it('renders AdvancedInsightsTab with change impact, bus factor cautionary advisory, and setup doctor', async () => {
    const mockInsights = {
      repository: 'test/repo',
      ref: 'main',
      commitSha: 'a1b2c3d4e5f6',
      history: {
        totalCommitsSampled: 25,
        velocity: 'High Velocity',
        avgCommitsPerActiveDay: 3.5,
        activeDaysCount: 7,
        authorCount: 4,
        authors: [{ name: 'alice', count: 15, share: 60 }],
        summary: 'Analyzed 25 recent commits across 7 active days.'
      },
      changeImpact: {
        riskTier: 'HIGH',
        blastRadiusScore: 65,
        impactFactors: [
          { factor: 'Dependency Manifest Present', level: 'CRITICAL', evidence: 'package.json' }
        ]
      },
      ownership: {
        totalContributors: 4,
        top1Percentage: 60,
        top3Percentage: 90,
        top5Percentage: 100,
        concentrationLevel: 'Moderate Concentration',
        heuristicBusFactor: '3-4 (Moderate Concentration)',
        cautionaryDisclaimer: 'CAUTIONARY HEURISTIC NOTICE: This bus-factor estimate is based strictly on observable Git commit volume.'
      },
      drift: {
        status: 'Synchronized (Low Drift)',
        driftScore: 100,
        discrepancies: []
      },
      doctor: {
        hygieneScore: 92,
        overallRating: 'Excellent',
        checks: [
          { id: 'env-template', label: 'Environment Secret Template (.env.example)', status: 'PASS', remediation: 'Clean .env.example template is present.' }
        ]
      }
    };

    vi.spyOn(apiClient, 'fetchAdvancedInsights').mockResolvedValue(mockInsights);
    const downloadSpy = vi.spyOn(apiClient, 'downloadPdfReport').mockResolvedValue();

    render(<AdvancedInsightsTab owner="test" repo="repo" commitSha="a1b2c3d4e5f6" />);

    expect(screen.getByText(/Advanced Insights, Setup Doctor & PDF Delivery/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('65/100')).toBeInTheDocument();
      expect(screen.getByText('High Velocity')).toBeInTheDocument();
      expect(screen.getByText(/CAUTIONARY HEURISTIC ADVISORY/i)).toBeInTheDocument();
      expect(screen.getByText(/SETUP DOCTOR DIAGNOSTICS/i)).toBeInTheDocument();
      expect(screen.getByText(/DOCUMENTATION DRIFT AUDITOR/i)).toBeInTheDocument();
    });

    const pdfBtn = screen.getByRole('button', { name: /Download PDF Report/i });
    expect(pdfBtn).toBeInTheDocument();
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('test', 'repo', 'a1b2c3d4e5f6');
    });
  });

  it('renders FlowableCanvas with canvas element', () => {
    const { container } = render(<FlowableCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders AuthPage with Sign In and Create Account tabs', async () => {
    render(<AuthPage onContinueGuest={() => {}} />);

    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Create Account$/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@company.com or username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to Cockpit/i })).toBeInTheDocument();

    // Switch to Create Account tab
    const createAccountTab = screen.getByRole('button', { name: /^Create Account$/i });
    fireEvent.click(createAccountTab);

    expect(screen.getByPlaceholderText(/alexdev/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/alex@company.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create FORTIVEX Account/i })).toBeInTheDocument();
  });
});




