import { Router } from 'express';
import {
  getRepository,
  getCommits,
  getPushEvents,
  getPullRequests,
  getIssues,
  getContributors,
  getBranches,
  getReleases,
  getWorkflowRuns,
  getLanguages,
  getRateLimitStatus
} from '../services/githubService.js';
import { calculateHealthMetrics } from '../services/metricsService.js';
import { parseGitHubUrl } from '../utils/urlParser.js';

const router = Router();

/**
 * Middleware to validate owner and repo params
 */
function validateRepoParams(req, res, next) {
  const { owner, repo } = req.params;
  const validation = parseGitHubUrl(`${owner}/${repo}`);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error
    });
  }
  req.repoOwner = validation.owner;
  req.repoName = validation.repo;
  next();
}

/**
 * GET /api/repo/:owner/:repo
 * Aggregated dashboard payload: repo metadata, health metrics, and initial datasets.
 */
router.get('/:owner/:repo', validateRepoParams, async (req, res) => {
  const { repoOwner, repoName } = req;

  try {
    // 1. Fetch core repository metadata first
    const repoData = await getRepository(repoOwner, repoName);

    // 2. Concurrently fetch complementary datasets with safe fallback handling
    const [
      commitsResult,
      eventsResult,
      pullsResult,
      issuesResult,
      contributorsResult,
      branchesResult,
      releasesResult,
      workflowsResult,
      languagesResult,
      rateLimitResult
    ] = await Promise.allSettled([
      getCommits(repoOwner, repoName, { per_page: 30 }),
      getPushEvents(repoOwner, repoName, { per_page: 20 }),
      getPullRequests(repoOwner, repoName, { state: 'all', per_page: 30 }),
      getIssues(repoOwner, repoName, { state: 'all', per_page: 30 }),
      getContributors(repoOwner, repoName, { per_page: 20 }),
      getBranches(repoOwner, repoName, { per_page: 20 }),
      getReleases(repoOwner, repoName, { per_page: 10 }),
      getWorkflowRuns(repoOwner, repoName, { per_page: 15 }),
      getLanguages(repoOwner, repoName),
      getRateLimitStatus()
    ]);

    const commits = commitsResult.status === 'fulfilled' ? commitsResult.value : [];
    const pushEventsData = eventsResult.status === 'fulfilled'
      ? eventsResult.value
      : { items: [], notice: 'Events unavailable.' };
    const pulls = pullsResult.status === 'fulfilled' ? pullsResult.value : [];
    const issues = issuesResult.status === 'fulfilled' ? issuesResult.value : [];
    const contributors = contributorsResult.status === 'fulfilled' ? contributorsResult.value : [];
    const branches = branchesResult.status === 'fulfilled' ? branchesResult.value : [];
    const releases = releasesResult.status === 'fulfilled' ? releasesResult.value : [];
    const workflowRuns = workflowsResult.status === 'fulfilled' ? workflowsResult.value : [];
    const languages = languagesResult.status === 'fulfilled' ? languagesResult.value : {};
    const rateLimit = rateLimitResult.status === 'fulfilled' ? rateLimitResult.value : null;

    // 3. Compute measurable repository health metrics
    const health = calculateHealthMetrics(repoData, pulls, issues, workflowRuns);

    res.json({
      success: true,
      data: {
        repository: repoData,
        health,
        commits,
        pushEvents: pushEventsData.items,
        pushEventsNotice: pushEventsData.notice,
        pullRequests: pulls,
        issues,
        contributors,
        branches,
        releases,
        workflowRuns,
        languages,
        rateLimit
      }
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message,
      isRateLimit: Boolean(err.isRateLimit),
      isInaccessible: Boolean(err.isInaccessible),
      rateLimit: err.rateLimit || null
    });
  }
});

/**
 * GET /api/repo/:owner/:repo/commits
 */
router.get('/:owner/:repo/commits', validateRepoParams, async (req, res) => {
  const { page = 1, per_page = 30, sha } = req.query;
  try {
    const commits = await getCommits(req.repoOwner, req.repoName, {
      page: parseInt(page, 10),
      per_page: parseInt(per_page, 10),
      sha
    });
    res.json({ success: true, data: commits });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/repo/:owner/:repo/events (Push Events)
 */
router.get('/:owner/:repo/events', validateRepoParams, async (req, res) => {
  const { page = 1, per_page = 30 } = req.query;
  try {
    const data = await getPushEvents(req.repoOwner, req.repoName, {
      page: parseInt(page, 10),
      per_page: parseInt(per_page, 10)
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/repo/:owner/:repo/pulls
 */
router.get('/:owner/:repo/pulls', validateRepoParams, async (req, res) => {
  const { page = 1, per_page = 30, state = 'all' } = req.query;
  try {
    const pulls = await getPullRequests(req.repoOwner, req.repoName, {
      page: parseInt(page, 10),
      per_page: parseInt(per_page, 10),
      state
    });
    res.json({ success: true, data: pulls });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/repo/:owner/:repo/issues
 */
router.get('/:owner/:repo/issues', validateRepoParams, async (req, res) => {
  const { page = 1, per_page = 30, state = 'all' } = req.query;
  try {
    const issues = await getIssues(req.repoOwner, req.repoName, {
      page: parseInt(page, 10),
      per_page: parseInt(per_page, 10),
      state
    });
    res.json({ success: true, data: issues });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/repo/:owner/:repo/contributors
 */
router.get('/:owner/:repo/contributors', validateRepoParams, async (req, res) => {
  const { page = 1, per_page = 30 } = req.query;
  try {
    const contributors = await getContributors(req.repoOwner, req.repoName, {
      page: parseInt(page, 10),
      per_page: parseInt(per_page, 10)
    });
    res.json({ success: true, data: contributors });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/repo/:owner/:repo/branches
 */
router.get('/:owner/:repo/branches', validateRepoParams, async (req, res) => {
  const { page = 1, per_page = 30 } = req.query;
  try {
    const branches = await getBranches(req.repoOwner, req.repoName, {
      page: parseInt(page, 10),
      per_page: parseInt(per_page, 10)
    });
    res.json({ success: true, data: branches });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/repo/:owner/:repo/releases
 */
router.get('/:owner/:repo/releases', validateRepoParams, async (req, res) => {
  const { page = 1, per_page = 30 } = req.query;
  try {
    const releases = await getReleases(req.repoOwner, req.repoName, {
      page: parseInt(page, 10),
      per_page: parseInt(per_page, 10)
    });
    res.json({ success: true, data: releases });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/repo/:owner/:repo/actions
 */
router.get('/:owner/:repo/actions', validateRepoParams, async (req, res) => {
  const { page = 1, per_page = 30 } = req.query;
  try {
    const workflowRuns = await getWorkflowRuns(req.repoOwner, req.repoName, {
      page: parseInt(page, 10),
      per_page: parseInt(per_page, 10)
    });
    res.json({ success: true, data: workflowRuns });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

export default router;
