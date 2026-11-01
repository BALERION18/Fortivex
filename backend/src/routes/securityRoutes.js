import { Router } from 'express';
import { getGitTree, getFileContent, getRepository } from '../services/githubService.js';
import { auditRepositorySecurity } from '../services/securityAuditService.js';
import { parseGitHubUrl } from '../utils/urlParser.js';

const router = Router();

function validateParams(req, res, next) {
  const { owner, repo } = req.params;
  const validation = parseGitHubUrl(`${owner}/${repo}`);
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error });
  }
  req.repoOwner = validation.owner;
  req.repoName = validation.repo;
  next();
}

/**
 * High-value file selector for security scanning.
 * Prioritizes configs, workflows, manifests, credentials templates, and server entrypoints.
 */
function isHighValueFile(path) {
  const p = path.toLowerCase();
  return (
    p.includes('.env') ||
    p.includes('config') ||
    p.includes('secret') ||
    p.includes('key') ||
    p.includes('cred') ||
    p.startsWith('.github/workflows/') ||
    p.endsWith('security.md') ||
    p.endsWith('codeowners') ||
    p.endsWith('package.json') ||
    p.endsWith('requirements.txt') ||
    p.endsWith('pyproject.toml') ||
    p.endsWith('cargo.toml') ||
    p.endsWith('go.mod') ||
    p.endsWith('.json') ||
    p.endsWith('.yml') ||
    p.endsWith('.yaml') ||
    p.endsWith('.toml') ||
    p.endsWith('.xml') ||
    p.endsWith('.conf') ||
    p.endsWith('.properties') ||
    p.endsWith('.sh') ||
    p.endsWith('.sql') ||
    p.includes('server') ||
    p.includes('app.') ||
    p.includes('index.') ||
    p.includes('main.py') ||
    p.includes('auth') ||
    p.includes('database') ||
    p.includes('db')
  );
}

/**
 * GET /api/security/scan/:owner/:repo
 * Scans repository files for leaked secrets, code injection anti-patterns, supply-chain risks, and workflow hardening.
 */
router.get('/scan/:owner/:repo', validateParams, async (req, res) => {
  const { repoOwner, repoName } = req;
  const { ref = 'HEAD' } = req.query;

  try {
    // 1. Fetch repository and git tree
    const [repo, treeData] = await Promise.all([
      getRepository(repoOwner, repoName),
      getGitTree(repoOwner, repoName, ref)
    ]);

    const tree = treeData.tree || [];
    const blobEntries = tree.filter((t) => t.type === 'blob');

    // 2. Filter high-value candidate files (capped to 30 files for bounded execution time)
    const candidates = blobEntries.filter((t) => isHighValueFile(t.path));
    const targetEntries = (candidates.length > 0 ? candidates : blobEntries).slice(0, 30);

    // 3. Concurrently fetch file contents (enforcing 100KB size limit inside getFileContent)
    const fileContents = await Promise.all(
      targetEntries.map((entry) => getFileContent(repoOwner, repoName, entry.path, ref))
    );

    // 4. Run Unified Security & Attack Defense Audit
    const commitSha = treeData.sha || repo.default_branch || 'HEAD';
    const report = auditRepositorySecurity(tree, fileContents.filter(Boolean), commitSha);

    res.json({
      success: true,
      data: {
        repository: repo.full_name,
        treeTruncated: Boolean(treeData.truncated),
        totalBlobsInTree: blobEntries.length,
        ...report
      }
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message,
      isRateLimit: Boolean(err.isRateLimit),
      isInaccessible: Boolean(err.isInaccessible)
    });
  }
});

export default router;
