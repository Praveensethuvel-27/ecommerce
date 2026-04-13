import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signAccessToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = express.Router();

authRouter.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    role: 'customer',
  });

  const token = signAccessToken({ sub: String(user._id), role: user.role });
  return res.status(201).json({
    token,
    user: { id: String(user._id), email: user.email, role: user.role },
  });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.blocked) return res.status(403).json({ error: 'This account has been blocked' });

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signAccessToken({ sub: String(user._id), role: user.role });
  return res.json({
    token,
    user: { id: String(user._id), email: user.email, role: user.role },
  });
});

// GET saved address for logged-in user
authRouter.get('/address', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ address: user.savedAddress || {} });
});

// SAVE address for logged-in user
authRouter.post('/address', requireAuth, async (req, res) => {
  const { name, phone, address1, address2, city, state, pincode } = req.body || {};
  await User.findByIdAndUpdate(req.user.id, {
    savedAddress: { name, phone, address1, address2, city, state, pincode },
  });
  return res.json({ ok: true });
});