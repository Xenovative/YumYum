import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = registerSchema.parse(req.body);

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}`;

    const result = await query(
      `INSERT INTO users (id, email, password_hash, name, phone, membership_tier, joined_at, total_spent, total_visits)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0, 0)
       RETURNING id, email, name, phone, avatar, display_name, gender, membership_tier, membership_expiry, joined_at, total_spent, total_visits`,
      [userId, email, passwordHash, name, phone, 'free']
    );

    const user = result.rows[0];
    const payload = { userId: user.id, email: user.email };
    const secret = process.env.JWT_SECRET || '';
    const options = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' };
    const token = jwt.sign(payload, secret, options);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        displayName: user.display_name,
        gender: user.gender,
        membershipTier: user.membership_tier,
        membershipExpiry: user.membership_expiry,
        joinedAt: user.joined_at,
        totalSpent: parseFloat(user.total_spent),
        totalVisits: user.total_visits
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await query(
      `SELECT id, email, password_hash, name, phone, avatar, display_name, gender, 
              membership_tier, membership_expiry, joined_at, total_spent, total_visits
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { userId: user.id, email: user.email };
    const secret = process.env.JWT_SECRET || '';
    const options = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' };
    const token = jwt.sign(payload, secret, options);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        displayName: user.display_name,
        gender: user.gender,
        membershipTier: user.membership_tier,
        membershipExpiry: user.membership_expiry,
        joinedAt: user.joined_at,
        totalSpent: parseFloat(user.total_spent),
        totalVisits: user.total_visits
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, phone, avatar, display_name, gender, 
              membership_tier, membership_expiry, joined_at, total_spent, total_visits
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      displayName: user.display_name,
      gender: user.gender,
      membershipTier: user.membership_tier,
      membershipExpiry: user.membership_expiry,
      joinedAt: user.joined_at,
      totalSpent: parseFloat(user.total_spent),
      totalVisits: user.total_visits
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, phone, avatar, displayName, gender } = req.body;

    const result = await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           avatar = COALESCE($3, avatar),
           display_name = COALESCE($4, display_name),
           gender = COALESCE($5, gender),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, name, phone, avatar, display_name, gender, 
                 membership_tier, membership_expiry, joined_at, total_spent, total_visits`,
      [name, phone, avatar, displayName, gender, req.userId]
    );

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      displayName: user.display_name,
      gender: user.gender,
      membershipTier: user.membership_tier,
      membershipExpiry: user.membership_expiry,
      joinedAt: user.joined_at,
      totalSpent: parseFloat(user.total_spent),
      totalVisits: user.total_visits
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    const token = jwt.sign(
      { isAdmin: true },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

export default router;
