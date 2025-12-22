import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createPartySchema = z.object({
  passId: z.string(),
  barId: z.string(),
  barName: z.string(),
  title: z.string(),
  description: z.string().optional(),
  maxFemaleGuests: z.number().min(1).max(10),
  partyTime: z.string()
});

router.get('/', async (req, res) => {
  try {
    const status = req.query.status || 'open';
    
    const result = await query(
      `SELECT p.id, p.host_id, p.host_name, p.host_display_name, p.host_avatar,
              p.pass_id, p.bar_id, p.bar_name, p.title, p.description,
              p.max_female_guests, p.party_time, p.status, p.created_at
       FROM parties p
       WHERE p.status = $1
       ORDER BY p.party_time ASC`,
      [status]
    );

    const partyIds = result.rows.map(row => row.id);
    let membersResult = { rows: [] };
    
    if (partyIds.length > 0) {
      membersResult = await query(
        `SELECT party_id, user_id, name, display_name, avatar, gender, joined_at
         FROM party_members
         WHERE party_id = ANY($1)
         ORDER BY joined_at ASC`,
        [partyIds]
      );
    }

    const membersByParty = membersResult.rows.reduce((acc: any, member) => {
      if (!acc[member.party_id]) acc[member.party_id] = [];
      acc[member.party_id].push({
        userId: member.user_id,
        name: member.name,
        displayName: member.display_name,
        avatar: member.avatar,
        gender: member.gender,
        joinedAt: member.joined_at
      });
      return acc;
    }, {});

    const parties = result.rows.map(row => ({
      id: row.id,
      hostId: row.host_id,
      hostName: row.host_name,
      hostDisplayName: row.host_display_name,
      hostAvatar: row.host_avatar,
      passId: row.pass_id,
      barId: row.bar_id,
      barName: row.bar_name,
      title: row.title,
      description: row.description,
      maxFemaleGuests: row.max_female_guests,
      partyTime: row.party_time,
      status: row.status,
      currentGuests: membersByParty[row.id] || [],
      createdAt: row.created_at
    }));

    res.json(parties);
  } catch (error) {
    console.error('Get parties error:', error);
    res.status(500).json({ error: 'Failed to fetch parties' });
  }
});

router.get('/my-hosted', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.host_id, p.host_name, p.host_display_name, p.host_avatar,
              p.pass_id, p.bar_id, p.bar_name, p.title, p.description,
              p.max_female_guests, p.party_time, p.status, p.created_at
       FROM parties p
       WHERE p.host_id = $1
       ORDER BY p.party_time DESC`,
      [req.userId]
    );

    const partyIds = result.rows.map(row => row.id);
    let membersResult = { rows: [] };
    
    if (partyIds.length > 0) {
      membersResult = await query(
        `SELECT party_id, user_id, name, display_name, avatar, gender, joined_at
         FROM party_members
         WHERE party_id = ANY($1)`,
        [partyIds]
      );
    }

    const membersByParty = membersResult.rows.reduce((acc: any, member) => {
      if (!acc[member.party_id]) acc[member.party_id] = [];
      acc[member.party_id].push({
        userId: member.user_id,
        name: member.name,
        displayName: member.display_name,
        avatar: member.avatar,
        gender: member.gender,
        joinedAt: member.joined_at
      });
      return acc;
    }, {});

    const parties = result.rows.map(row => ({
      id: row.id,
      hostId: row.host_id,
      hostName: row.host_name,
      hostDisplayName: row.host_display_name,
      hostAvatar: row.host_avatar,
      passId: row.pass_id,
      barId: row.bar_id,
      barName: row.bar_name,
      title: row.title,
      description: row.description,
      maxFemaleGuests: row.max_female_guests,
      partyTime: row.party_time,
      status: row.status,
      currentGuests: membersByParty[row.id] || [],
      createdAt: row.created_at
    }));

    res.json(parties);
  } catch (error) {
    console.error('Get hosted parties error:', error);
    res.status(500).json({ error: 'Failed to fetch hosted parties' });
  }
});

router.get('/my-joined', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.host_id, p.host_name, p.host_display_name, p.host_avatar,
              p.pass_id, p.bar_id, p.bar_name, p.title, p.description,
              p.max_female_guests, p.party_time, p.status, p.created_at
       FROM parties p
       INNER JOIN party_members pm ON p.id = pm.party_id
       WHERE pm.user_id = $1
       ORDER BY p.party_time DESC`,
      [req.userId]
    );

    const partyIds = result.rows.map(row => row.id);
    let membersResult = { rows: [] };
    
    if (partyIds.length > 0) {
      membersResult = await query(
        `SELECT party_id, user_id, name, display_name, avatar, gender, joined_at
         FROM party_members
         WHERE party_id = ANY($1)`,
        [partyIds]
      );
    }

    const membersByParty = membersResult.rows.reduce((acc: any, member) => {
      if (!acc[member.party_id]) acc[member.party_id] = [];
      acc[member.party_id].push({
        userId: member.user_id,
        name: member.name,
        displayName: member.display_name,
        avatar: member.avatar,
        gender: member.gender,
        joinedAt: member.joined_at
      });
      return acc;
    }, {});

    const parties = result.rows.map(row => ({
      id: row.id,
      hostId: row.host_id,
      hostName: row.host_name,
      hostDisplayName: row.host_display_name,
      hostAvatar: row.host_avatar,
      passId: row.pass_id,
      barId: row.bar_id,
      barName: row.bar_name,
      title: row.title,
      description: row.description,
      maxFemaleGuests: row.max_female_guests,
      partyTime: row.party_time,
      status: row.status,
      currentGuests: membersByParty[row.id] || [],
      createdAt: row.created_at
    }));

    res.json(parties);
  } catch (error) {
    console.error('Get joined parties error:', error);
    res.status(500).json({ error: 'Failed to fetch joined parties' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = createPartySchema.parse(req.body);
    
    const userResult = await query(
      'SELECT name, display_name, avatar FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    const partyId = `party-${Date.now()}`;

    const result = await query(
      `INSERT INTO parties (id, host_id, host_name, host_display_name, host_avatar,
                           pass_id, bar_id, bar_name, title, description,
                           max_female_guests, party_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'open')
       RETURNING id, host_id, host_name, host_display_name, host_avatar,
                 pass_id, bar_id, bar_name, title, description,
                 max_female_guests, party_time, status, created_at`,
      [partyId, req.userId, user.name, user.display_name, user.avatar,
       data.passId, data.barId, data.barName, data.title, data.description,
       data.maxFemaleGuests, data.partyTime]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      hostId: row.host_id,
      hostName: row.host_name,
      hostDisplayName: row.host_display_name,
      hostAvatar: row.host_avatar,
      passId: row.pass_id,
      barId: row.bar_id,
      barName: row.bar_name,
      title: row.title,
      description: row.description,
      maxFemaleGuests: row.max_female_guests,
      partyTime: row.party_time,
      status: row.status,
      currentGuests: [],
      createdAt: row.created_at
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create party error:', error);
    res.status(500).json({ error: 'Failed to create party' });
  }
});

router.post('/:id/join', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const partyResult = await query(
      'SELECT status, max_female_guests FROM parties WHERE id = $1',
      [req.params.id]
    );

    if (partyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const party = partyResult.rows[0];
    if (party.status !== 'open') {
      return res.status(400).json({ error: 'Party is not open' });
    }

    const countResult = await query(
      'SELECT COUNT(*) as count FROM party_members WHERE party_id = $1',
      [req.params.id]
    );
    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount >= party.max_female_guests) {
      return res.status(400).json({ error: 'Party is full' });
    }

    const userResult = await query(
      'SELECT name, display_name, avatar, gender FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    await query(
      `INSERT INTO party_members (party_id, user_id, name, display_name, avatar, gender)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (party_id, user_id) DO NOTHING`,
      [req.params.id, req.userId, user.name, user.display_name, user.avatar, user.gender]
    );

    if (currentCount + 1 >= party.max_female_guests) {
      await query(
        `UPDATE parties SET status = 'full', updated_at = NOW() WHERE id = $1`,
        [req.params.id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Join party error:', error);
    res.status(500).json({ error: 'Failed to join party' });
  }
});

router.delete('/:id/leave', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query(
      'DELETE FROM party_members WHERE party_id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    await query(
      `UPDATE parties SET status = 'open', updated_at = NOW() WHERE id = $1 AND status = 'full'`,
      [req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Leave party error:', error);
    res.status(500).json({ error: 'Failed to leave party' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `UPDATE parties 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND host_id = $2
       RETURNING id`,
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Party not found or unauthorized' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Cancel party error:', error);
    res.status(500).json({ error: 'Failed to cancel party' });
  }
});

export default router;
