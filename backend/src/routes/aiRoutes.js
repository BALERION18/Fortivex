import { Router } from 'express';
import { getGitTree, getFileContent, getRepository } from '../services/githubService.js';
import { buildArchitectureAnalysis } from '../services/codeIntelligence.js';
import { answerCodebaseQuery } from '../services/aiService.js';
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
 * Filter key architectural files: README, package.json, requirements.txt, route files, schema files
 */
function isArchitectureFile(path) {
  const p = path.toLowerCase();
  return (
    p.match(/^readme\.md$/i) ||
    p.endsWith('package.json') ||
    p.endsWith('requirements.txt') ||
    p.endsWith('go.mod') ||
    p.endsWith('cargo.toml') ||
    p.endsWith('pom.xml') ||
    p.endsWith('docker-compose.yml') ||
    p.endsWith('dockerfile') ||
    p.endsWith('.prisma') ||
    p.endsWith('.sql') ||
    p.includes('/routes/') ||
    p.includes('/controllers/') ||
    p.includes('/api/') ||
    p.includes('server.') ||
    p.includes('app.')
  );
}

/**
 * GET /api/ai/intelligence/:owner/:repo
 * Generates living architecture wiki with route/schema discovery & epistemic triad.
 */
router.get('/intelligence/:owner/:repo', validateParams, async (req, res) => {
  const { repoOwner, repoName } = req;
  const { ref = 'HEAD' } = req.query;

  try {
    const [repo, treeData] = await Promise.all([
      getRepository(repoOwner, repoName),
      getGitTree(repoOwner, repoName, ref)
    ]);

    const tree = treeData.tree || [];
    const blobEntries = tree.filter((t) => t.type === 'blob');

    // Filter high-priority architectural files (max 25 files)
    const targetBlobs = blobEntries.filter((t) => isArchitectureFile(t.path)).slice(0, 25);

    // Fetch contents safely
    const files = await Promise.all(
      targetBlobs.map((entry) => getFileContent(repoOwner, repoName, entry.path, ref))
    );

    const commitSha = treeData.sha || repo.default_branch || 'HEAD';
    const analysis = buildArchitectureAnalysis(repo, tree, files, commitSha);

    res.json({
      success: true,
      data: {
        repository: repo.full_name,
        treeTruncated: Boolean(treeData.truncated),
        analyzedFilesCount: files.length,
        ...analysis
      }
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ai/query/:owner/:repo
 * Grounded codebase Q&A with commit-pinned line references and pre-AI redaction.
 */
router.post('/query/:owner/:repo', validateParams, async (req, res) => {
  const { repoOwner, repoName } = req;
  const { query, ref = 'HEAD' } = req.body || {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ success: false, error: 'Question query string is required' });
  }

  try {
    const [repo, treeData] = await Promise.all([
      getRepository(repoOwner, repoName),
      getGitTree(repoOwner, repoName, ref)
    ]);

    const tree = treeData.tree || [];
    const blobEntries = tree.filter((t) => t.type === 'blob');
    const targetBlobs = blobEntries.filter((t) => isArchitectureFile(t.path)).slice(0, 20);

    const files = await Promise.all(
      targetBlobs.map((entry) => getFileContent(repoOwner, repoName, entry.path, ref))
    );

    const commitSha = treeData.sha || repo.default_branch || 'HEAD';
    const architecture = buildArchitectureAnalysis(repo, tree, files, commitSha);

    const answerData = await answerCodebaseQuery({
      query,
      owner: repoOwner,
      repo: repoName,
      commitSha,
      files,
      architecture
    });

    res.json({
      success: true,
      data: answerData
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

export default router;
