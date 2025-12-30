import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { query } from '../db/index.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

const createBarUserSchema = z.object({
  barId: z.string(),
  email: z.string().email(),
  password: z.string().min(4),
  displayName: z.string().min(1),
  role: z.enum(['owner', 'staff']).default('staff'),
  isActive: z.boolean().optional(),
});

router.get('/members', authenticateAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, phone, avatar, display_name, gender, age, height_cm, drink_capacity,
              membership_tier, membership_expiry, joined_at, total_spent, total_visits
       FROM users 
       ORDER BY joined_at DESC`
    );

    const members = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      avatar: row.avatar,
      displayName: row.display_name,
      gender: row.gender,
      age: row.age,
      heightCm: row.height_cm,
      drinkCapacity: row.drink_capacity,
      membershipTier: row.membership_tier,
      membershipExpiry: row.membership_expiry,
      joinedAt: row.joined_at,
      totalSpent: parseFloat(row.total_spent),
      totalVisits: row.total_visits
    }));

    res.json(members);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.put('/members/:id', authenticateAdmin, async (req, res) => {
  try {
    const { membershipTier, membershipExpiry } = req.body;

    const result = await query(
      `UPDATE users 
       SET membership_tier = COALESCE($1, membership_tier),
           membership_expiry = COALESCE($2, membership_expiry),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, name, phone, avatar, display_name, gender, 
                 age, height_cm, drink_capacity, membership_tier, membership_expiry, joined_at, total_spent, total_visits`,
      [membershipTier, membershipExpiry, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      avatar: row.avatar,
      displayName: row.display_name,
      gender: row.gender,
      membershipTier: row.membership_tier,
      membershipExpiry: row.membership_expiry,
      joinedAt: row.joined_at,
      totalSpent: parseFloat(row.total_spent),
      totalVisits: row.total_visits
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

router.delete('/members/:id', authenticateAdmin, async (req, res) => {
  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

router.get('/passes', authenticateAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.user_id, p.bar_id, p.bar_name, p.person_count, p.total_price, 
              p.platform_fee, p.bar_payment, p.purchase_time, p.expiry_time, p.qr_code, 
              p.is_active, p.transaction_id, p.payment_method,
              u.name as user_name, u.email as user_email
       FROM passes p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.purchase_time DESC`
    );

    const passes = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      barId: row.bar_id,
      barName: row.bar_name,
      personCount: row.person_count,
      totalPrice: parseFloat(row.total_price),
      platformFee: parseFloat(row.platform_fee),
      barPayment: parseFloat(row.bar_payment),
      purchaseTime: row.purchase_time,
      expiryTime: row.expiry_time,
      qrCode: row.qr_code,
      isActive: row.is_active,
      transactionId: row.transaction_id,
      paymentMethod: row.payment_method
    }));

    res.json(passes);
  } catch (error) {
    console.error('Get all passes error:', error);
    res.status(500).json({ error: 'Failed to fetch passes' });
  }
});

router.post('/passes/:id/revoke', authenticateAdmin, async (req, res) => {
  try {
    const passId = req.params.id;
    const result = await query(
      `UPDATE passes
       SET is_active = false, updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [passId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pass not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Revoke pass error:', error);
    res.status(500).json({ error: 'Failed to revoke pass' });
  }
});

router.delete('/passes/:id/revoke', authenticateAdmin, async (req, res) => {
  try {
    const passId = req.params.id;
    const result = await query(
      `UPDATE passes
       SET is_active = false, updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [passId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pass not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Revoke pass (DELETE) error:', error);
    res.status(500).json({ error: 'Failed to revoke pass' });
  }
});

router.get('/payment-settings', authenticateAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT platform_fee_percentage, min_person_count, max_person_count, pass_valid_days,
              stripe_enabled, payme_enabled, fps_enabled, alipay_enabled, wechat_enabled,
              test_mode, payme_qr_code, fps_qr_code, alipay_qr_code, wechat_qr_code
       FROM payment_settings WHERE id = 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment settings not found' });
    }

    const row = result.rows[0];
    res.json({
      platformFeePercentage: parseFloat(row.platform_fee_percentage),
      minPersonCount: row.min_person_count,
      maxPersonCount: row.max_person_count,
      passValidDays: row.pass_valid_days,
      stripeEnabled: row.stripe_enabled,
      paymeEnabled: row.payme_enabled,
      fpsEnabled: row.fps_enabled,
      alipayEnabled: row.alipay_enabled,
      wechatEnabled: row.wechat_enabled,
      testMode: row.test_mode,
      paymeQrCode: row.payme_qr_code,
      fpsQrCode: row.fps_qr_code,
      alipayQrCode: row.alipay_qr_code,
      wechatQrCode: row.wechat_qr_code
    });
  } catch (error) {
    console.error('Get payment settings error:', error);
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

router.put('/payment-settings', authenticateAdmin, async (req, res) => {
  try {
    const {
      platformFeePercentage,
      minPersonCount,
      maxPersonCount,
      passValidDays,
      stripeEnabled,
      paymeEnabled,
      fpsEnabled,
      alipayEnabled,
      wechatEnabled,
      testMode,
      paymeQrCode,
      fpsQrCode,
      alipayQrCode,
      wechatQrCode
    } = req.body;

    const result = await query(
      `UPDATE payment_settings 
       SET platform_fee_percentage = COALESCE($1, platform_fee_percentage),
           min_person_count = COALESCE($2, min_person_count),
           max_person_count = COALESCE($3, max_person_count),
           pass_valid_days = COALESCE($4, pass_valid_days),
           stripe_enabled = COALESCE($5, stripe_enabled),
           payme_enabled = COALESCE($6, payme_enabled),
           fps_enabled = COALESCE($7, fps_enabled),
           alipay_enabled = COALESCE($8, alipay_enabled),
           wechat_enabled = COALESCE($9, wechat_enabled),
           test_mode = COALESCE($10, test_mode),
           payme_qr_code = COALESCE($11, payme_qr_code),
           fps_qr_code = COALESCE($12, fps_qr_code),
           alipay_qr_code = COALESCE($13, alipay_qr_code),
           wechat_qr_code = COALESCE($14, wechat_qr_code),
           updated_at = NOW()
       WHERE id = 1
       RETURNING platform_fee_percentage, min_person_count, max_person_count, pass_valid_days,
                 stripe_enabled, payme_enabled, fps_enabled, alipay_enabled, wechat_enabled,
                 test_mode, payme_qr_code, fps_qr_code, alipay_qr_code, wechat_qr_code`,
      [platformFeePercentage, minPersonCount, maxPersonCount, passValidDays,
       stripeEnabled, paymeEnabled, fpsEnabled, alipayEnabled, wechatEnabled,
       testMode, paymeQrCode, fpsQrCode, alipayQrCode, wechatQrCode]
    );

    const row = result.rows[0];
    res.json({
      platformFeePercentage: parseFloat(row.platform_fee_percentage),
      minPersonCount: row.min_person_count,
      maxPersonCount: row.max_person_count,
      passValidDays: row.pass_valid_days,
      stripeEnabled: row.stripe_enabled,
      paymeEnabled: row.payme_enabled,
      fpsEnabled: row.fps_enabled,
      alipayEnabled: row.alipay_enabled,
      wechatEnabled: row.wechat_enabled,
      testMode: row.test_mode,
      paymeQrCode: row.payme_qr_code,
      fpsQrCode: row.fps_qr_code,
      alipayQrCode: row.alipay_qr_code,
      wechatQrCode: row.wechat_qr_code
    });
  } catch (error) {
    console.error('Update payment settings error:', error);
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

const adItemSchema = z.object({
  image: z.string().url().min(1),
  link: z.string().url().min(1),
  enabled: z.boolean().default(true),
});

const adSettingsSchema = z.object({
  homeAds: z.array(adItemSchema).optional(),
  partiesAds: z.array(adItemSchema).optional(),
  profileAds: z.array(adItemSchema).optional(),
});

router.get('/ad-settings', authenticateAdmin, async (req, res) => {
  try {
    await query(`CREATE TABLE IF NOT EXISTS ad_settings (
      id INT PRIMARY KEY,
      home_ads JSONB DEFAULT '[]'::jsonb,
      parties_ads JSONB DEFAULT '[]'::jsonb,
      profile_ads JSONB DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP DEFAULT NOW()
    )`);

    const result = await query('SELECT * FROM ad_settings WHERE id = 1');
    if (result.rows.length === 0) {
      const insert = await query(
        `INSERT INTO ad_settings (id, home_ads, parties_ads, profile_ads)
         VALUES (1, '[]', '[]', '[]')
         RETURNING *`
      );
      return res.json({
        homeAds: insert.rows[0].home_ads,
        partiesAds: insert.rows[0].parties_ads,
        profileAds: insert.rows[0].profile_ads,
      });
    }

    const row = result.rows[0];
    res.json({
      homeAds: row.home_ads || [],
      partiesAds: row.parties_ads || [],
      profileAds: row.profile_ads || [],
    });
  } catch (error) {
    console.error('Get ad settings error:', error);
    res.status(500).json({ error: 'Failed to fetch ad settings' });
  }
});

router.put('/ad-settings', authenticateAdmin, async (req, res) => {
  try {
    const payload = adSettingsSchema.parse(req.body);

    await query(`CREATE TABLE IF NOT EXISTS ad_settings (
      id INT PRIMARY KEY,
      home_ads JSONB DEFAULT '[]'::jsonb,
      parties_ads JSONB DEFAULT '[]'::jsonb,
      profile_ads JSONB DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP DEFAULT NOW()
    )`);

    const result = await query(
      `INSERT INTO ad_settings (id, home_ads, parties_ads, profile_ads, updated_at)
       VALUES (1, $1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET
         home_ads = COALESCE(EXCLUDED.home_ads, ad_settings.home_ads),
         parties_ads = COALESCE(EXCLUDED.parties_ads, ad_settings.parties_ads),
         profile_ads = COALESCE(EXCLUDED.profile_ads, ad_settings.profile_ads),
         updated_at = NOW()
       RETURNING *`,
      [
        JSON.stringify(payload.homeAds ?? []),
        JSON.stringify(payload.partiesAds ?? []),
        JSON.stringify(payload.profileAds ?? []),
      ]
    );

    const row = result.rows[0];
    res.json({
      homeAds: row.home_ads || [],
      partiesAds: row.parties_ads || [],
      profileAds: row.profile_ads || [],
    });
  } catch (error: any) {
    console.error('Update ad settings error:', error);
    res.status(400).json({ error: error?.message || 'Failed to update ad settings' });
  }
});

// Create bar user account
router.post('/bar-users', authenticateAdmin, async (req, res) => {
  try {
    const { barId, email, password, displayName, role, isActive } = createBarUserSchema.parse(req.body);

    // Ensure bar exists
    const barResult = await query('SELECT id FROM bars WHERE id = $1', [barId]);
    if (barResult.rows.length === 0) {
      return res.status(400).json({ error: 'Bar not found' });
    }

    // Check for existing email
    const existing = await query('SELECT id FROM bar_users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const barUserId = `baruser-${Date.now()}`;
    const insert = await query(
      `INSERT INTO bar_users (id, bar_id, email, password_hash, display_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, true))
       RETURNING id, bar_id, email, display_name, role, is_active, created_at`,
      [barUserId, barId, email, passwordHash, displayName, role, isActive]
    );

    const row = insert.rows[0];
    res.status(201).json({
      id: row.id,
      barId: row.bar_id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
    });
  } catch (error: any) {
    console.error('Create bar user error:', error);
    res.status(400).json({ error: error?.message || 'Failed to create bar user' });
  }
});

// List bar users
router.get('/bar-users', authenticateAdmin, async (_req, res) => {
  try {
    const result = await query(
      `SELECT bu.id, bu.bar_id, bu.email, bu.display_name, bu.role, bu.is_active, bu.created_at,
              b.name AS bar_name
       FROM bar_users bu
       LEFT JOIN bars b ON bu.bar_id = b.id
       ORDER BY bu.created_at DESC`
    );
    const users = result.rows.map((row) => ({
      id: row.id,
      barId: row.bar_id,
      barName: row.bar_name,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));
    res.json(users);
  } catch (error) {
    console.error('Get bar users error:', error);
    res.status(500).json({ error: 'Failed to fetch bar users' });
  }
});

export default router;
