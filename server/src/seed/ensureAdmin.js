import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export async function ensureSeedAdmin() {
  if (!env.seedAdminEmail || !env.seedAdminPassword) return;

  const email = String(env.seedAdminEmail).toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) return;

  const passwordHash = await bcrypt.hash(String(env.seedAdminPassword), 10);
  await User.create({ email, passwordHash, role: 'admin' });
  console.log(`Seeded admin user: ${email}`);
}

