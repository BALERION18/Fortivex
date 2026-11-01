import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Local storage file for fallback persistence
const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('[AuthService] Could not create data directory:', err.message);
  }
}

// In-memory cache synced with users.json
let usersStore = [];

function loadUsersFromDisk() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      usersStore = JSON.parse(content);
    } else {
      usersStore = [];
    }
  } catch (err) {
    console.warn('[AuthService] Error reading users.json:', err.message);
    usersStore = [];
  }
}

function saveUsersToDisk() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[AuthService] Error saving users.json:', err.message);
  }
}

loadUsersFromDisk();

// MongoDB Mongoose User Schema
const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    fullName: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    salt: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'developer' }
  },
  { timestamps: true }
);

let MongoUserModel = null;
let isMongoConnected = false;

// Initialize MongoDB if MONGODB_URI is provided
export async function initDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return false;

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      dbName: 'fortivex'
    });
    MongoUserModel = mongoose.models.User || mongoose.model('User', userSchema);
    isMongoConnected = true;
    console.log('[AuthService] Successfully connected to MongoDB Atlas');
    return true;
  } catch (err) {
    console.warn('[AuthService] MongoDB connection failed, using local store:', err.message);
    isMongoConnected = false;
    return false;
  }
}

// Auto-attempt connection on module load
if (process.env.MONGODB_URI) {
  initDatabase().catch(() => {});
}

/**
 * Hash a password using Node.js crypto pbkdf2
 */
export function hashPassword(password, salt = null) {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
  return { salt: generatedSalt, hash };
}

/**
 * Verify password against stored hash & salt
 */
export function verifyPassword(password, salt, storedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

/**
 * Generate a secure session token
 */
export function generateToken(user) {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id || user.userId,
      email: user.email,
      username: user.username,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'fortivex-secure-auth-secret-key-2026')
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

/**
 * Verify a session token
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'fortivex-secure-auth-secret-key-2026')
    .update(payload)
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Register a new user (MongoDB Atlas with fallback to local store)
 */
export async function registerUser({ fullName, email, username, password }) {
  if (!email || !password || !username) {
    throw new Error('Email, username, and password are required');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  if (cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const { salt, hash } = hashPassword(password);
  const userId = 'usr_' + crypto.randomBytes(8).toString('hex');

  // If connected to MongoDB Atlas, store in MongoDB
  if (isMongoConnected && MongoUserModel) {
    const existing = await MongoUserModel.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }]
    });

    if (existing) {
      if (existing.email === cleanEmail) {
        throw new Error('An account with this email already exists');
      }
      throw new Error('This username is already taken');
    }

    const doc = await MongoUserModel.create({
      userId,
      fullName: (fullName || cleanUsername).trim(),
      email: cleanEmail,
      username: cleanUsername,
      salt,
      passwordHash: hash,
      role: 'developer'
    });

    const token = generateToken({ id: doc.userId, email: doc.email, username: doc.username });

    return {
      user: {
        id: doc.userId,
        fullName: doc.fullName,
        email: doc.email,
        username: doc.username,
        role: doc.role,
        createdAt: doc.createdAt
      },
      token
    };
  }

  // Fallback to local store
  const existing = usersStore.find(
    (u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername
  );
  if (existing) {
    if (existing.email.toLowerCase() === cleanEmail) {
      throw new Error('An account with this email already exists');
    }
    throw new Error('This username is already taken');
  }

  const newUser = {
    id: userId,
    fullName: (fullName || cleanUsername).trim(),
    email: cleanEmail,
    username: cleanUsername,
    salt,
    passwordHash: hash,
    role: 'developer',
    createdAt: new Date().toISOString()
  };

  usersStore.push(newUser);
  saveUsersToDisk();

  const token = generateToken(newUser);

  return {
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      createdAt: newUser.createdAt
    },
    token
  };
}

/**
 * Authenticate existing user
 */
export async function authenticateUser({ loginIdentifier, password }) {
  if (!loginIdentifier || !password) {
    throw new Error('Email/username and password are required');
  }

  const cleanId = loginIdentifier.trim().toLowerCase();

  // If connected to MongoDB Atlas, query MongoDB
  if (isMongoConnected && MongoUserModel) {
    const user = await MongoUserModel.findOne({
      $or: [{ email: cleanId }, { username: cleanId }]
    });

    if (!user) {
      throw new Error('Invalid email/username or password');
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email/username or password');
    }

    const token = generateToken({ id: user.userId, email: user.email, username: user.username });

    return {
      user: {
        id: user.userId,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    };
  }

  // Fallback to local store
  const user = usersStore.find(
    (u) => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId
  );

  if (!user) {
    throw new Error('Invalid email/username or password');
  }

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email/username or password');
  }

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    },
    token
  };
}

/**
 * Get Database Connection Status Information
 */
export function getDatabaseStatus() {
  const uri = process.env.MONGODB_URI;

  if (isMongoConnected) {
    return {
      configured: true,
      databaseType: 'MongoDB Atlas',
      connectionStringConfigured: true,
      activeUsersCount: usersStore.length,
      message: 'Connected to MongoDB Atlas cloud database'
    };
  }

  if (uri) {
    return {
      configured: true,
      databaseType: 'MongoDB Atlas (Connecting...)',
      connectionStringConfigured: true,
      activeUsersCount: usersStore.length,
      message: 'Attempting connection to MongoDB Atlas'
    };
  }

  return {
    configured: false,
    databaseType: 'Local Persistence (JSON Store)',
    connectionStringConfigured: false,
    activeUsersCount: usersStore.length,
    message: 'Using local persistence store. Provide MONGODB_URI to connect to MongoDB Atlas.'
  };
}

/**
 * Get all registered users (sanitized for admin/table view)
 */
export async function getAllUsers() {
  if (isMongoConnected && MongoUserModel) {
    try {
      const users = await MongoUserModel.find({}, { passwordHash: 0, salt: 0 }).sort({ createdAt: -1 }).lean();
      return users.map(u => ({
        id: u.userId || u._id?.toString(),
        fullName: u.fullName || '',
        username: u.username,
        email: u.email,
        role: u.role || 'developer',
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }));
    } catch (e) {
      console.warn('[AuthService] Could not fetch users from MongoDB:', e.message);
    }
  }

  return usersStore.map(u => ({
    id: u.id,
    fullName: u.fullName || '',
    username: u.username,
    email: u.email,
    role: u.role || 'developer',
    createdAt: u.createdAt
  }));
}
