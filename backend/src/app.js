import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import repoRoutes from './routes/repoRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';

export function createApp() {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json());

  // Mount API route handlers
  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/repo', repoRoutes);
  app.use('/api/security', securityRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/reports', reportRoutes);


  // Catch-all 404 for unknown API endpoints
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API endpoint ${req.originalUrl} not found`
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    // eslint-disable-line no-unused-vars
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  });

  return app;
}
