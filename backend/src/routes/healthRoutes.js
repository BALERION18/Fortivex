import { Router } from 'express';
import { getRateLimitStatus } from '../services/githubService.js';
import { parseGitHubUrl } from '../utils/urlParser.js';

const router = Router();

// Server liveness and health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'fortivex-backend',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// GitHub API rate limit tracking endpoint
router.get('/rate-limit', async (req, res) => {
  try {
    const rateLimit = await getRateLimitStatus();
    res.json({
      success: true,
      data: rateLimit
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve rate limit status',
      details: err.message
    });
  }
});

// URL parsing and validation endpoint
router.post('/parse-url', (req, res) => {
  const { url } = req.body || {};
  const parsed = parseGitHubUrl(url);

  if (!parsed.valid) {
    return res.status(400).json({
      success: false,
      error: parsed.error
    });
  }

  res.json({
    success: true,
    data: parsed
  });
});

export default router;
