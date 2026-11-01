import { describe, it, expect } from 'vitest';
import { generateExecutivePdfReport, auditPdfBufferForSecrets } from '../src/services/pdfReportService.js';

describe('PDF Report Generation & Security Sanitizer', () => {
  it('generates a valid, sanitized PDF buffer with expected structure', async () => {
    const mockReportData = {
      owner: 'facebook',
      repo: 'react',
      commitSha: 'e9a41b52c038478d10b71946fef95b1234567890',
      defaultBranch: 'main',
      intelligence: {
        purpose: 'The library for web and native user interfaces.',
        manifest: {
          file: 'package.json',
          name: 'react',
          version: '19.0.0',
          dependencies: ['loose-envify'],
          devDependencies: ['jest']
        },
        routes: [
          { method: 'GET', path: '/api/v1/users', file: 'server.js', line: 12 }
        ],
        schemas: [
          { type: 'Prisma Model', name: 'User', file: 'schema.prisma', line: 4 }
        ],
        setupGuide: {
          installCommand: 'npm install',
          runDevCommand: 'npm start',
          testCommand: 'npm test'
        }
      },
      security: {
        totalFindings: 1,
        findings: [
          {
            ruleName: 'GitHub Personal Access Token',
            severity: 'CRITICAL',
            file: '.env.example',
            line: 5,
            maskedSecret: 'ghp_...Wxyz',
            remediation: 'Revoke and rotate token.'
          }
        ]
      },
      analytics: {
        changeImpact: { blastRadiusScore: 45, riskTier: 'MEDIUM' },
        ownership: {
          top1Percentage: 35,
          heuristicBusFactor: '>= 4 (Low Concentration Risk)',
          cautionaryDisclaimer: 'CAUTIONARY HEURISTIC NOTICE: This bus-factor estimate is based strictly on observable Git commit volume.'
        },
        drift: { status: 'Synchronized (Low Drift)' },
        doctor: { hygieneScore: 90, overallRating: 'Excellent', checks: [] }
      }
    };

    const pdfBuffer = await generateExecutivePdfReport(mockReportData);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    // Verify PDF header magic bytes "%PDF-"
    const header = pdfBuffer.slice(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });

  it('redacts synthetic secrets passed in overview or text before rendering', async () => {
    const mockDataWithSecret = {
      owner: 'test',
      repo: 'repo',
      commitSha: 'abcdef1234567890',
      intelligence: {
        // Contains synthetic GitHub PAT that should be neutralized
        purpose: 'Repository containing token ghp_1234567890abcdefghijklmnopqrstuvwxyz in documentation.'
      },
      security: { totalFindings: 0, findings: [] },
      analytics: {}
    };

    const pdfBuffer = await generateExecutivePdfReport(mockDataWithSecret);
    const pdfText = pdfBuffer.toString('latin1');

    // The raw PAT must NOT exist in the PDF binary!
    expect(pdfText).not.toContain('ghp_1234567890abcdefghijklmnopqrstuvwxyz');
  });

  it('auditPdfBufferForSecrets blocks export when raw unmasked dummy credentials appear', () => {
    // Synthetic raw AWS key injected into buffer
    const unsafeBuffer = Buffer.from('%PDF-1.3 ... AKIAIOSFODNN7EXAMPLE ... %%EOF', 'latin1');
    const audit = auditPdfBufferForSecrets(unsafeBuffer);

    expect(audit.safe).toBe(false);
    expect(audit.error).toContain('CRITICAL EXPORT BLOCKED');
    expect(audit.error).toContain('aws-access-key-id');
  });

  it('auditPdfBufferForSecrets passes when secrets are properly masked', () => {
    const safeBuffer = Buffer.from('%PDF-1.3 ... Token: ghp_...Wxyz ... %%EOF', 'latin1');
    const audit = auditPdfBufferForSecrets(safeBuffer);

    expect(audit.safe).toBe(true);
  });

  it('generates a complete, multi-component audit report for BALERION18/PS60 test case fixture', async () => {
    const ps60ReportData = {
      owner: 'BALERION18',
      repo: 'PS60',
      commitSha: '8448593216b4d2d076986481f88934999d7ff05b',
      defaultBranch: 'main',
      timestamp: '2026-10-18T10:00:00.000Z',
      health: {
        overallRating: 'Attention Needed',
        explanation: 'Automated CI workflow is not configured (5/6 baseline checks passing).',
        passedCount: 5,
        totalCount: 6
      },
      intelligence: {
        purpose: 'Himadri / VajraX — Remote Management, Digital Twin, and Edge AI telemetry for Indian Antarctic research stations (Maitri & Bharati).',
        manifests: [
          {
            type: 'pip',
            language: 'Python',
            file: 'backend/requirements.txt',
            dependencies: ['fastapi', 'uvicorn', 'sqlalchemy', 'pydantic', 'pytest']
          },
          {
            type: 'npm',
            language: 'JavaScript',
            file: 'frontend/package.json',
            dependencies: ['react', 'vite', 'lucide-react', 'tailwindcss']
          }
        ],
        routes: [
          {
            method: 'GET',
            path: '/api/v1/telemetry/station',
            file: 'backend/cloud/main.py',
            line: 45,
            description: 'Station telemetry handler (get_station_telemetry)'
          },
          {
            method: 'POST',
            path: '/api/v1/commands/dispatch',
            file: 'backend/cloud/main.py',
            line: 80,
            description: 'Command dispatch handler (dispatch_remote_command)'
          }
        ],
        schemas: [
          { type: 'SQLAlchemy / Pydantic Entity', name: 'TelemetryPayload', file: 'backend/models.py', line: 12 },
          { type: 'SQLAlchemy / Pydantic Entity', name: 'StationMetrics', file: 'backend/models.py', line: 35 }
        ],
        setupGuide: {
          components: [
            {
              component: 'Python Backend / Services',
              manifestFile: 'backend/requirements.txt',
              installCommand: 'pip install -r backend/requirements.txt',
              runDevCommand: 'uvicorn backend.cloud.main:app --port 8000',
              testCommand: 'pytest backend/tests',
              buildCommand: 'Not applicable (interpreted runtime)'
            },
            {
              component: 'FRONTEND (Node/React)',
              manifestFile: 'frontend/package.json',
              installCommand: 'npm install --prefix frontend',
              runDevCommand: 'npm run dev --prefix frontend',
              testCommand: 'Not verified (no test script in package.json)',
              buildCommand: 'npm run build --prefix frontend'
            }
          ]
        }
      },
      security: {
        totalFindings: 1,
        findings: [
          {
            ruleName: 'Database Connection String URI',
            severity: 'HIGH',
            file: '.env.example',
            line: 8,
            maskedSecret: 'postgres://neondb_owner:****@ep-broad-grass-a1.ap-southeast-1.aws.neon.tech/neondb',
            remediation: 'Rotate credential if ever activated; remove from source code and purge Git history.'
          }
        ]
      },
      analytics: {
        changeImpact: {
          blastRadiusScore: 50,
          riskTier: 'HIGH',
          criticalManifestsCount: 2,
          infraConfigsCount: 1,
          entryPointsCount: 2,
          impactFactors: [
            { factor: 'Dependency Manifests Present', level: 'MEDIUM', evidence: 'backend/requirements.txt, frontend/package.json' }
          ]
        },
        history: {
          totalCommitsSampled: 20,
          activeDaysCount: 8,
          avgCommitsPerActiveDay: 2.5,
          velocity: 'Moderate cadence (20 commits in sampling window)'
        },
        ownership: {
          top1Percentage: 70.0,
          top3Percentage: 90.0,
          top5Percentage: 100.0,
          concentrationLevel: 'Critical Concentration',
          heuristicBusFactor: '1 (Single-Maintainer Dominance - Heuristic Estimate Only)',
          cautionaryDisclaimer: 'CAUTIONARY HEURISTIC NOTICE: This bus-factor estimate is based strictly on observable Git commit volume in sampled history.',
          topContributors: [
            { name: 'BALERION18', count: 14, percentage: 70.0 },
            { name: 'student-NIET', count: 2, percentage: 10.0 },
            { name: 'kunwarshaurya', count: 2, percentage: 10.0 },
            { name: 'Ankur05678', count: 2, percentage: 10.0 }
          ]
        },
        doctor: {
          hygieneScore: 83,
          overallRating: 'Strong',
          checks: [
            { id: 'env-template', label: 'Environment Secret Template (.env.example)', status: 'PASS', remediation: 'Clean .env.example template is present.' },
            { id: 'lockfile-check', label: 'Dependency Manifest & Lockfile', status: 'PASS', remediation: 'Dependency manifest committed for reproducible builds.' },
            { id: 'test-script', label: 'Automated Test Harness', status: 'PASS', remediation: 'Pytest / unittest suite detected in repository tree.' },
            { id: 'ci-workflow', label: 'GitHub Actions CI Automation', status: 'WARNING', remediation: 'Set up an automated GitHub Actions CI workflow to run test suites on pull requests.' },
            { id: 'gitignore', label: 'Git Exclusion Rules (.gitignore)', status: 'PASS', remediation: '.gitignore exclusion rules are present.' },
            { id: 'license-file', label: 'Repository License', status: 'PASS', remediation: 'Open source license file present in root.' }
          ]
        }
      }
    };

    const pdfBuffer = await generateExecutivePdfReport(ps60ReportData);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(5000);
    expect(pdfBuffer.slice(0, 5).toString('ascii')).toBe('%PDF-');

    const audit = auditPdfBufferForSecrets(pdfBuffer);
    expect(audit.safe).toBe(true);

    const pdfText = pdfBuffer.toString('latin1');
    expect(pdfText).toContain('BALERION18/PS60');
    expect(pdfText).toContain('8448593');
  });
});
