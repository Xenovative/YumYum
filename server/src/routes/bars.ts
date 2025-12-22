import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/index.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

const barSchema = z.object({
  name: z.string(),
  nameEn: z.string(),
  districtId: z.string(),
  address: z.string(),
  image: z.string().url(),
  rating: z.number().min(0).max(5),
  drinks: z.array(z.string())
});

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, name_en, district_id, address, image, rating, drinks, is_featured
       FROM bars 
       ORDER BY name`
    );

    const bars = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      districtId: row.district_id,
      address: row.address,
      image: row.image,
      rating: parseFloat(row.rating),
      drinks: row.drinks,
      isFeatured: row.is_featured
    }));

    res.json(bars);
  } catch (error) {
    console.error('Get bars error:', error);
    res.status(500).json({ error: 'Failed to fetch bars' });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, name_en, district_id, address, image, rating, drinks, is_featured
       FROM bars 
       WHERE is_featured = true
       ORDER BY name`
    );

    const bars = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      districtId: row.district_id,
      address: row.address,
      image: row.image,
      rating: parseFloat(row.rating),
      drinks: row.drinks,
      isFeatured: row.is_featured
    }));

    res.json(bars);
  } catch (error) {
    console.error('Get featured bars error:', error);
    res.status(500).json({ error: 'Failed to fetch featured bars' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, name_en, district_id, address, image, rating, drinks, is_featured
       FROM bars 
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bar not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      districtId: row.district_id,
      address: row.address,
      image: row.image,
      rating: parseFloat(row.rating),
      drinks: row.drinks,
      isFeatured: row.is_featured
    });
  } catch (error) {
    console.error('Get bar error:', error);
    res.status(500).json({ error: 'Failed to fetch bar' });
  }
});

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const data = barSchema.parse(req.body);
    const barId = `bar-${Date.now()}`;

    const result = await query(
      `INSERT INTO bars (id, name, name_en, district_id, address, image, rating, drinks, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
       RETURNING id, name, name_en, district_id, address, image, rating, drinks, is_featured`,
      [barId, data.name, data.nameEn, data.districtId, data.address, data.image, data.rating, data.drinks]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      districtId: row.district_id,
      address: row.address,
      image: row.image,
      rating: parseFloat(row.rating),
      drinks: row.drinks,
      isFeatured: row.is_featured
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create bar error:', error);
    res.status(500).json({ error: 'Failed to create bar' });
  }
});

router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const data = barSchema.partial().parse(req.body);

    const result = await query(
      `UPDATE bars 
       SET name = COALESCE($1, name),
           name_en = COALESCE($2, name_en),
           district_id = COALESCE($3, district_id),
           address = COALESCE($4, address),
           image = COALESCE($5, image),
           rating = COALESCE($6, rating),
           drinks = COALESCE($7, drinks),
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, name, name_en, district_id, address, image, rating, drinks, is_featured`,
      [data.name, data.nameEn, data.districtId, data.address, data.image, data.rating, data.drinks, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bar not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      districtId: row.district_id,
      address: row.address,
      image: row.image,
      rating: parseFloat(row.rating),
      drinks: row.drinks,
      isFeatured: row.is_featured
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update bar error:', error);
    res.status(500).json({ error: 'Failed to update bar' });
  }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const result = await query('DELETE FROM bars WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bar not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete bar error:', error);
    res.status(500).json({ error: 'Failed to delete bar' });
  }
});

router.post('/:id/toggle-featured', authenticateAdmin, async (req, res) => {
  try {
    const result = await query(
      `UPDATE bars 
       SET is_featured = NOT is_featured, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, name_en, district_id, address, image, rating, drinks, is_featured`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bar not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      districtId: row.district_id,
      address: row.address,
      image: row.image,
      rating: parseFloat(row.rating),
      drinks: row.drinks,
      isFeatured: row.is_featured
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ error: 'Failed to toggle featured status' });
  }
});

export default router;
