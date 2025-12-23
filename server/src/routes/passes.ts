import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createPassSchema = z.object({
  barId: z.string(),
  barName: z.string(),
  personCount: z.number().min(1).max(10),
  totalPrice: z.number(),
  platformFee: z.number(),
  barPayment: z.number(),
  transactionId: z.string().optional(),
  paymentMethod: z.string().optional()
});

// List passes for current user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, user_id, bar_id, bar_name, person_count, total_price, platform_fee, 
              bar_payment, purchase_time, expiry_time, qr_code, is_active, 
              transaction_id, payment_method
       FROM passes 
       WHERE user_id = $1 
       ORDER BY purchase_time DESC`,
      [req.userId]
    );

    const passes = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
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
    console.error('Get passes error:', error);
    res.status(500).json({ error: 'Failed to fetch passes' });
  }
});

// Compatibility alias
router.get('/my-passes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, user_id, bar_id, bar_name, person_count, total_price, platform_fee, 
              bar_payment, purchase_time, expiry_time, qr_code, is_active, 
              transaction_id, payment_method
       FROM passes 
       WHERE user_id = $1 
       ORDER BY purchase_time DESC`,
      [req.userId]
    );

    const passes = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
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
    console.error('Get passes (alias) error:', error);
    res.status(500).json({ error: 'Failed to fetch passes' });
  }
});

router.get('/active', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, user_id, bar_id, bar_name, person_count, total_price, platform_fee, 
              bar_payment, purchase_time, expiry_time, qr_code, is_active, 
              transaction_id, payment_method
       FROM passes 
       WHERE user_id = $1 AND is_active = true AND expiry_time > NOW()
       ORDER BY purchase_time DESC`,
      [req.userId]
    );

    const passes = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
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
    console.error('Get active passes error:', error);
    res.status(500).json({ error: 'Failed to fetch active passes' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = createPassSchema.parse(req.body);
    
    const passId = `pass-${Date.now()}`;
    const purchaseTime = new Date();
    const expiryTime = new Date(purchaseTime.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const userResult = await query(
      'SELECT name, phone FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    const qrCode = JSON.stringify({
      type: 'ONENIGHTDRINK_FREE_DRINKS',
      passId,
      barId: data.barId,
      barName: data.barName,
      personCount: data.personCount,
      barPayment: data.barPayment,
      userName: user.name,
      userPhone: user.phone,
      expiry: expiryTime.toISOString(),
      transactionId: data.transactionId,
      paymentMethod: data.paymentMethod,
      code: Math.random().toString(36).substr(2, 9).toUpperCase()
    });

    const result = await query(
      `INSERT INTO passes (id, user_id, bar_id, bar_name, person_count, total_price, 
                          platform_fee, bar_payment, purchase_time, expiry_time, qr_code, 
                          is_active, transaction_id, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, $13)
       RETURNING id, user_id, bar_id, bar_name, person_count, total_price, platform_fee, 
                 bar_payment, purchase_time, expiry_time, qr_code, is_active, 
                 transaction_id, payment_method`,
      [passId, req.userId, data.barId, data.barName, data.personCount, data.totalPrice,
       data.platformFee, data.barPayment, purchaseTime, expiryTime, qrCode,
       data.transactionId, data.paymentMethod]
    );

    // Update user's totals
    await query(
      `UPDATE users
       SET total_spent = COALESCE(total_spent, 0) + $1,
           total_visits = COALESCE(total_visits, 0) + $2,
           updated_at = NOW()
       WHERE id = $3`,
      [data.totalPrice, data.personCount, req.userId]
    );

    const pass = result.rows[0];
    res.json({
      id: pass.id,
      userId: pass.user_id,
      barId: pass.bar_id,
      barName: pass.bar_name,
      personCount: pass.person_count,
      totalPrice: parseFloat(pass.total_price),
      platformFee: parseFloat(pass.platform_fee),
      barPayment: parseFloat(pass.bar_payment),
      purchaseTime: pass.purchase_time,
      expiryTime: pass.expiry_time,
      qrCode: pass.qr_code,
      isActive: pass.is_active,
      transactionId: pass.transaction_id,
      paymentMethod: pass.payment_method
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create pass error:', error);
    res.status(500).json({ error: 'Failed to create pass' });
  }
});

export default router;
