import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { isDatabaseConnected } from '../config/db.js';
import { memoryStore, createId } from '../utils/memoryStore.js';
import { signToken } from '../middleware/auth.js';

function sanitizeUser(user) {
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role || 'student',
    createdAt: user.createdAt
  };
}

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const safeRole = role === 'instructor' ? 'instructor' : 'student';
    const passwordHash = await bcrypt.hash(String(password), 10);

    if (isDatabaseConnected()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      const user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        role: safeRole
      });
      const token = signToken(user);
      return res.status(201).json({ token, user: sanitizeUser(user), storage: 'mongodb' });
    }

    const existingMem = memoryStore.users.find((u) => u.email === normalizedEmail);
    if (existingMem) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const memUser = {
      id: createId(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: safeRole,
      createdAt: new Date().toISOString()
    };
    memoryStore.users.push(memUser);
    const token = signToken(memUser);
    return res.status(201).json({ token, user: sanitizeUser(memUser), storage: 'memory-fallback' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    let user = null;
    let storage = 'mongodb';
    if (isDatabaseConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      storage = 'memory-fallback';
      user = memoryStore.users.find((u) => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user), storage });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
}

export async function getMe(req, res) {
  try {
    if (isDatabaseConnected()) {
      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user) return res.status(404).json({ error: 'User not found.' });
      return res.json({ user: sanitizeUser(user), storage: 'mongodb' });
    }

    const user = memoryStore.users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: sanitizeUser(user), storage: 'memory-fallback' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load profile.' });
  }
}
