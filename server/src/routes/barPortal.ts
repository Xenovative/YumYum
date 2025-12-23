import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { query } from '../db/index.js'
import { authenticateBarUser, BarAuthRequest } from '../middleware/auth.js'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
})

const collectSchema = z.object({
  passId: z.string(),
})

const verifySchema = z.object({
  qrCode: z.string().optional(),
  passId: z.string().optional(),
}).refine((data) => data.qrCode || data.passId, {
  message: 'qrCode or passId is required',
})

const updateBarSchema = z.object({
  name: z.string().optional(),
  nameEn: z.string().optional(),
  districtId: z.string().optional(),
  address: z.string().optional(),
  image: z.string().optional(),
  drinks: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
})

// POST /auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const result = await query(
      `SELECT bu.id, bu.bar_id, bu.email, bu.password_hash, bu.display_name, bu.role, bu.is_active,
              b.name, b.name_en, b.district_id, b.address, b.image, b.rating, b.drinks, b.is_featured
       FROM bar_users bu
       JOIN bars b ON b.id = bu.bar_id
       WHERE bu.email = $1 AND bu.is_active = true`,
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const row = result.rows[0]
    const isValid = await bcrypt.compare(password, row.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { barUserId: row.id, barId: row.bar_id },
      process.env.BAR_JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      barUser: {
        id: row.id,
        barId: row.bar_id,
        email: row.email,
        displayName: row.display_name,
        role: row.role,
      },
      bar: {
        id: row.bar_id,
        name: row.name,
        nameEn: row.name_en,
        districtId: row.district_id,
        address: row.address,
        image: row.image,
        rating: row.rating,
        drinks: row.drinks,
        isFeatured: row.is_featured,
      },
    })
  } catch (error) {
    console.error('Bar login error:', error)
    res.status(400).json({ error: 'Login failed' })
  }
})

// GET /auth/me
router.get('/auth/me', authenticateBarUser, async (req: BarAuthRequest, res) => {
  try {
    const result = await query(
      `SELECT bu.id, bu.bar_id, bu.email, bu.display_name, bu.role, bu.is_active,
              b.name, b.name_en, b.district_id, b.address, b.image, b.rating, b.drinks, b.is_featured
       FROM bar_users bu
       JOIN bars b ON b.id = bu.bar_id
       WHERE bu.id = $1`,
      [req.barUserId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bar user not found' })
    }

    const row = result.rows[0]
    res.json({
      barUser: {
        id: row.id,
        barId: row.bar_id,
        email: row.email,
        displayName: row.display_name,
        role: row.role,
        isActive: row.is_active,
      },
      bar: {
        id: row.bar_id,
        name: row.name,
        nameEn: row.name_en,
        districtId: row.district_id,
        address: row.address,
        image: row.image,
        rating: row.rating,
        drinks: row.drinks,
        isFeatured: row.is_featured,
      },
    })
  } catch (error) {
    console.error('Bar me error:', error)
    res.status(500).json({ error: 'Failed to load profile' })
  }
})

// GET /passes/today
router.get('/passes/today', authenticateBarUser, async (req: BarAuthRequest, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM passes p
       JOIN users u ON u.id = p.user_id
       WHERE p.bar_id = $1
         AND p.purchase_time::date = CURRENT_DATE
       ORDER BY p.purchase_time DESC`,
      [req.barId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Bar passes today error:', error)
    res.status(500).json({ error: 'Failed to fetch passes' })
  }
})

// POST /passes/verify
router.post('/passes/verify', authenticateBarUser, async (req: BarAuthRequest, res) => {
  try {
    const data = verifySchema.parse(req.body)
    const passResult = await query(
      `SELECT p.*, u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM passes p
       JOIN users u ON u.id = p.user_id
       WHERE p.bar_id = $1 AND (p.qr_code = $2 OR p.id = $2)`,
      [req.barId, data.qrCode || data.passId]
    )

    if (passResult.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Pass not found for this bar' })
    }

    const pass = passResult.rows[0]
    const now = new Date()
    const isExpired = new Date(pass.expiry_time) < now

    res.json({
      valid: !isExpired,
      isExpired,
      pass,
    })
  } catch (error) {
    console.error('Bar verify pass error:', error)
    res.status(400).json({ error: 'Failed to verify pass' })
  }
})

// POST /passes/collect
router.post('/passes/collect', authenticateBarUser, async (req: BarAuthRequest, res) => {
  try {
    const { passId } = collectSchema.parse(req.body)
    const result = await query(
      `UPDATE passes
       SET collected_at = NOW(), collected_by = $1, updated_at = NOW()
       WHERE id = $2 AND bar_id = $3
       RETURNING *`,
      [req.barUserId, passId, req.barId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pass not found for this bar' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Bar collect pass error:', error)
    res.status(400).json({ error: 'Failed to collect pass' })
  }
})

// GET /payments/history
router.get('/payments/history', authenticateBarUser, async (req: BarAuthRequest, res) => {
  try {
    const { from, to, status } = req.query
    const params: any[] = [req.barId]
    const conditions = ['p.bar_id = $1']

    if (status === 'collected') {
      conditions.push('p.collected_at IS NOT NULL')
    } else if (status === 'uncollected') {
      conditions.push('p.collected_at IS NULL')
    }

    if (from) {
      params.push(from)
      conditions.push(`p.purchase_time >= $${params.length}`)
    }
    if (to) {
      params.push(to)
      conditions.push(`p.purchase_time <= $${params.length}`)
    }

    const result = await query(
      `SELECT p.*, u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM passes p
       JOIN users u ON u.id = p.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.purchase_time DESC
       LIMIT 200`,
      params
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Bar payments history error:', error)
    res.status(500).json({ error: 'Failed to fetch payment history' })
  }
})

// PUT /bar (edit own bar info)
router.put('/bar', authenticateBarUser, async (req: BarAuthRequest, res) => {
  try {
    const data = updateBarSchema.parse(req.body)
    const fields: string[] = []
    const values: any[] = []

    if (data.name !== undefined) { values.push(data.name); fields.push(`name = $${values.length}`) }
    if (data.nameEn !== undefined) { values.push(data.nameEn); fields.push(`name_en = $${values.length}`) }
    if (data.districtId !== undefined) { values.push(data.districtId); fields.push(`district_id = $${values.length}`) }
    if (data.address !== undefined) { values.push(data.address); fields.push(`address = $${values.length}`) }
    if (data.image !== undefined) { values.push(data.image); fields.push(`image = $${values.length}`) }
    if (data.drinks !== undefined) { values.push(data.drinks); fields.push(`drinks = $${values.length}`) }
    if (data.rating !== undefined) { values.push(data.rating); fields.push(`rating = $${values.length}`) }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    values.push(req.barId)

    const result = await query(
      `UPDATE bars
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, name, name_en, district_id, address, image, rating, drinks, is_featured`,
      values
    )

    res.json({
      bar: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        nameEn: result.rows[0].name_en,
        districtId: result.rows[0].district_id,
        address: result.rows[0].address,
        image: result.rows[0].image,
        rating: result.rows[0].rating,
        drinks: result.rows[0].drinks,
        isFeatured: result.rows[0].is_featured,
      },
    })
  } catch (error) {
    console.error('Bar update error:', error)
    res.status(400).json({ error: 'Failed to update bar' })
  }
})

export default router
