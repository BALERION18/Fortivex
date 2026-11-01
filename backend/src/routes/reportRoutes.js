import express from 'express';
import {
  getRepository,
  getCommits,
  getGitTree,
  getFileContent,
  getContributors,
  getWorkflowRuns
} from '../services/githubService.js';
import { buildArchitectureAnalysis } from '../services/codeIntelligence.js';
import { auditRepositorySecurity } from '../services/securityAuditService.js';
import {
  analyzeHistoryComparison,
  estimateChangeImpact,
  analyzeContributorOwnership,
  checkDocumentationDrift,
  runSetupDoctor
} from '../services/advancedAnalytics.js';
import { generateExecutivePdfReport } from '../services/pdfReportService.js';

const router = express.Router();

/**
 * Filter architectural files: manifests, configs, server/app entrypoints, env templates, and security policies
 */
function isArchitectureFile(path) {
  const p = path.toLowerCase();
  return (
    p.match(/^readme\.md$/i) ||
    p.startsWith('.github/workflows/') ||
    p.endsWith('security.md') ||
    p.endsWith('codeowners') ||
    p.endsWith('package.json') ||
    p.endsWith('requirements.txt') ||
    p.endsWith('pyproject.toml') ||
    p.endsWith('go.mod') ||
    p.endsWith('cargo.toml') ||
    p.endsWith('docker-compose.yml') ||
    p.endsWith('dockerfile') ||
    p.includes('.env') ||
    p.includes('config') ||
    p.includes('conftest.py') ||
    p.includes('/routes/') ||
    p.includes('/controllers/') ||
    p.includes('/api/') ||
    p.includes('server.') ||
    p.includes('app.') ||
    p.includes('main.py')
  );
}

/**
 * GET /api/reports/pdf/:owner/:repo
 * Generates and downloads a sanitized executive PDF audit report.
 *
 * Enforces pre-sanitization and post-generation buffer audit:
 * If an unredacted credential or secret pattern is detected, export is blocked with status 422.
 */
router.get('/pdf/:owner/:repo', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const ref = req.query.ref || 'HEAD';

    // 1. Concurrently fetch all necessary intelligence, telemetry, contributors, and workflow runs
    const [overview, commits, treeRes, contributors, workflowRuns] = await Promise.all([
      getRepository(owner, repo).catch(() => ({})),
      getCommits(owner, repo, { per_page: 30 }).catch(() => []),
      getGitTree(owner, repo, ref).catch(() => ({ tree: [] })),
      getContributors(owner, repo, { per_page: 30 }).catch(() => []),
      getWorkflowRuns(owner, repo, { per_page: 25 }).catch(() => [])
    ]);

    const tree = treeRes.tree || [];
    const commitSha = commits[0]?.sha || ref;

    // 2. Fetch candidate files for Intelligence & Security Scan
    const blobEntries = tree.filter((t) => t.type === 'blob');
    const targetBlobs = blobEntries.filter((t) => isArchitectureFile(t.path)).slice(0, 30);

    const candidateFiles = await Promise.all(
      targetBlobs.map((entry) => getFileContent(owner, repo, entry.path, ref).catch(() => null))
    );
    const validFiles = candidateFiles.filter(Boolean);

    const intelligence = buildArchitectureAnalysis(overview, tree, validFiles, commitSha);
    const security = auditRepositorySecurity(tree, validFiles, commitSha);

    // 4. Run Advanced Analytics & Setup Doctor
    let packageJson = null;
    let readmeText = '';
    const pkgEntry = tree.find((f) => f.path === 'package.json' || f.path.endsWith('/package.json'));
    if (pkgEntry) {
      try {
        const pkgRes = await getFileContent(owner, repo, pkgEntry.path, ref);
        const raw = typeof pkgRes === 'string' ? pkgRes : pkgRes.content || '{}';
        packageJson = JSON.parse(raw);
      } catch {
        packageJson = null;
      }
    }
    const readmeEntry = tree.find((f) => /^(?:README|readme)\.md$/i.test(f.path));
    if (readmeEntry) {
      try {
        const readmeRes = await getFileContent(owner, repo, readmeEntry.path, ref);
        readmeText = typeof readmeRes === 'string' ? readmeRes : readmeRes.content || '';
      } catch {
        readmeText = '';
      }
    }

    const history = analyzeHistoryComparison(commits);
    const changeImpact = estimateChangeImpact(commits, tree);
    const ownership = analyzeContributorOwnership(contributors, commits);
    const drift = checkDocumentationDrift(readmeText, tree, packageJson);
    const doctor = runSetupDoctor(tree, packageJson);

    // 4b. Evaluate CI metrics from workflow runs
    const runsList = Array.isArray(workflowRuns) ? workflowRuns : [];
    const completedRuns = runsList.filter((r) => r.status === 'completed');
    const successfulRuns = completedRuns.filter((r) => r.conclusion === 'success');
    const failedRuns = completedRuns.filter((r) => r.conclusion === 'failure');
    const successPercentage = completedRuns.length > 0 ? Math.round((successfulRuns.length / completedRuns.length) * 100) : 0;
    const hasWorkflows = runsList.length > 0 || tree.some((f) => f.path.startsWith('.github/workflows/'));

    if (runsList.length > 0) {
      const ciDoctorCheck = (doctor.checks || []).find((c) => c.id === 'ci-workflow');
      if (ciDoctorCheck) {
        ciDoctorCheck.status = 'PASS';
        ciDoctorCheck.passed = true;
        ciDoctorCheck.remediation = `${runsList.length} active GitHub Actions workflow runs tracked (${successPercentage}% success rate).`;
      }
    }

    const ciMetrics = {
      hasWorkflows,
      ciStatus: runsList.length > 0 ? (successPercentage >= 75 ? 'Passing' : 'Failing') : 'Unconfigured',
      totalRuns: runsList.length,
      completedRuns: completedRuns.length,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.length,
      successPercentage,
      runs: runsList.slice(0, 10)
    };

    // 5. Evidence-based repository health assessment
    const failedChecks = (doctor.checks || []).filter((c) => c.status === 'WARNING');
    const passedChecks = (doctor.checks || []).filter((c) => c.status === 'PASS');
    const hasCriticalSecret = (security.findings || []).some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH');

    let overallRating = 'Adequate';
    let healthExplanation = '';
    if (hasCriticalSecret) {
      overallRating = 'Security Review Required';
      healthExplanation = 'Potential credentials or sensitive patterns flagged in repository files.';
    } else if (failedChecks.length === 0 && doctor.totalCount >= 5) {
      overallRating = 'Healthy';
      healthExplanation = `All ${doctor.passedCount} configuration hygiene and workflow checks verified.`;
    } else if (failedChecks.some((c) => c.id === 'ci-workflow')) {
      overallRating = 'Attention Needed';
      healthExplanation = `Automated CI workflow is not configured (${doctor.passedCount}/${doctor.totalCount} baseline checks passing).`;
    } else {
      overallRating = 'Moderate Hygiene';
      healthExplanation = `${doctor.passedCount} of ${doctor.totalCount} baseline configuration checks passing.`;
    }

    const health = {
      overallRating,
      explanation: healthExplanation,
      passedCount: passedChecks.length,
      totalCount: (doctor.checks || []).length,
      checks: doctor.checks || [],
      ci: ciMetrics,
      criteria: 'Evaluated against automated tests, CI workflows, secret scans, dependency manifests, .gitignore, and environment templates.'
    };

    // 6. Compile aggregate payload for PDF generation
    const reportData = {
      owner,
      repo,
      commitSha,
      defaultBranch: overview.default_branch || 'main',
      timestamp: new Date().toISOString(),
      health,
      workflowRuns: runsList,
      intelligence,
      security,
      analytics: {
        history,
        changeImpact,
        ownership,
        drift,
        doctor
      }
    };

    // 6. Generate sanitized PDF
    const pdfBuffer = await generateExecutivePdfReport(reportData);

    // 7. Send binary PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${owner}-${repo}-fortivex-audit.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    if (error.message && error.message.includes('CRITICAL EXPORT BLOCKED')) {
      return res.status(422).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

export default router;
