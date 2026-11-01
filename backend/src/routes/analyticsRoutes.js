import express from 'express';
import {
  getCommits,
  getContributors,
  getGitTree,
  getFileContent,
  getRepository
} from '../services/githubService.js';
import {
  analyzeHistoryComparison,
  estimateChangeImpact,
  analyzeContributorOwnership,
  checkDocumentationDrift,
  runSetupDoctor
} from '../services/advancedAnalytics.js';

const router = express.Router();

/**
 * GET /api/analytics/insights/:owner/:repo
 * Computes advanced repository analytics:
 * - Commit velocity & history comparison
 * - Evidence-based change impact
 * - Contributor distribution & cautiously labeled bus factor
 * - Documentation drift against active tree
 * - Setup Doctor configuration diagnostics
 */
router.get('/insights/:owner/:repo', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const ref = req.query.ref || 'HEAD';

    // Fetch repository data concurrently with error fallbacks
    const [commits, contributors, treeRes, repoRes] = await Promise.all([
      getCommits(owner, repo, { per_page: 30 }).catch(() => []),
      getContributors(owner, repo, { per_page: 30 }).catch(() => []),
      getGitTree(owner, repo, ref).catch(() => ({ tree: [] })),
      getRepository(owner, repo).catch(() => ({ default_branch: 'main' }))
    ]);

    const treeFiles = treeRes.tree || [];


    // Attempt to read package.json and README.md if present
    let packageJson = null;
    let readmeText = '';

    const pkgEntry = treeFiles.find((f) => f.path === 'package.json');
    if (pkgEntry) {
      try {
        const pkgRes = await getFileContent(owner, repo, 'package.json', ref);
        const rawPkg = typeof pkgRes === 'string' ? pkgRes : pkgRes.content || '{}';
        packageJson = JSON.parse(rawPkg);
      } catch {
        packageJson = null;
      }
    }

    const readmeEntry = treeFiles.find((f) => /^(?:README|readme)\.md$/i.test(f.path));
    if (readmeEntry) {
      try {
        const readmeRes = await getFileContent(owner, repo, readmeEntry.path, ref);
        readmeText = typeof readmeRes === 'string' ? readmeRes : readmeRes.content || '';
      } catch {
        readmeText = '';
      }
    }

    // Run analytics
    const history = analyzeHistoryComparison(commits);
    const changeImpact = estimateChangeImpact(commits, treeFiles);
    const ownership = analyzeContributorOwnership(contributors, commits);
    const drift = checkDocumentationDrift(readmeText, treeFiles, packageJson);
    const doctor = runSetupDoctor(treeFiles, packageJson);

    res.json({
      success: true,
      data: {
        repository: `${owner}/${repo}`,
        ref,
        commitSha: commits[0]?.sha || ref,
        defaultBranch: repoRes.default_branch || 'main',
        history,
        changeImpact,
        ownership,
        drift,
        doctor
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
