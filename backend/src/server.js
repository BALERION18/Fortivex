import 'dotenv/config';
import { createApp } from './app.js';
import { initDatabase } from './services/authService.js';

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`[FORTIVEX Backend] Server running on http://localhost:${PORT}`);
  console.log(`[FORTIVEX Backend] Health check: http://localhost:${PORT}/api/health`);
  if (process.env.GITHUB_TOKEN) {
    console.log('[FORTIVEX Backend] Authenticated mode enabled (5,000 req/hr rate limit)');
  } else {
    console.log('[FORTIVEX Backend] Public unauthenticated mode (60 req/hr rate limit)');
  }

  // Initialize MongoDB Atlas connection
  await initDatabase();
});
