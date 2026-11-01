import express from 'express';
import {
  registerUser,
  authenticateUser,
  getDatabaseStatus,
  getAllUsers,
  verifyToken
} from '../services/authService.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;
    const result = await registerUser({ fullName, email, username, password });
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message || 'Registration failed'
    });
  }
});

/**
 * POST /api/auth/login
 * Log in with email/username and password
 */
router.post('/login', async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;
    const result = await authenticateUser({ loginIdentifier, password });
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: result
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: err.message || 'Login failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Validate session token and return user profile
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization token required'
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      user: payload
    }
  });
});

/**
 * GET /api/auth/db-status
 * Check database connection status
 */
router.get('/db-status', (req, res) => {
  const status = getDatabaseStatus();
  res.status(200).json({
    success: true,
    data: status
  });
});

/**
 * GET /api/auth/users
 * Retrieve list of registered users (sanitized for table view)
 */
router.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({
      success: true,
      data: {
        users,
        total: users.length
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve users'
    });
  }
});

export default router;
