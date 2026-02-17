const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Get all strikes (with filters)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { staff_id, is_active, severity, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        s.*,
        sm.name as staff_name,
        sm.is_senior,
        u1.username as issued_by_username,
        u2.username as removed_by_username
      FROM strikes s
      JOIN staff_members sm ON s.staff_id = sm.id
      LEFT JOIN users u1 ON s.issued_by = u1.id
      LEFT JOIN users u2 ON s.removed_by = u2.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (staff_id) {
      query += ` AND s.staff_id = $${paramCount}`;
      params.push(staff_id);
      paramCount++;
    }

    if (is_active !== undefined) {
      query += ` AND s.is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }

    if (severity) {
      query += ` AND s.severity = $${paramCount}`;
      params.push(severity);
      paramCount++;
    }

    if (start_date) {
      query += ` AND s.strike_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND s.strike_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY s.strike_date DESC, s.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get strikes error:', error);
    res.status(500).json({ error: 'Failed to get strikes' });
  }
});

// Get strikes for a specific staff member
router.get('/staff/:staff_id', authMiddleware, async (req, res) => {
  try {
    const { staff_id } = req.params;
    
    const result = await db.query(`
      SELECT 
        s.*,
        u1.username as issued_by_username,
        u2.username as removed_by_username
      FROM strikes s
      LEFT JOIN users u1 ON s.issued_by = u1.id
      LEFT JOIN users u2 ON s.removed_by = u2.id
      WHERE s.staff_id = $1
      ORDER BY s.strike_date DESC
    `, [staff_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get staff strikes error:', error);
    res.status(500).json({ error: 'Failed to get staff strikes' });
  }
});

// Create new strike (managers and admins only)
router.post('/', authMiddleware, requireRole('manager', 'admin'), [
  body('staff_id').isInt(),
  body('strike_date').isDate(),
  body('reason').trim().notEmpty().isLength({ min: 10, max: 1000 }),
  body('severity').isIn(['warning', 'minor', 'major', 'severe']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { staff_id, strike_date, reason, severity, notes } = req.body;

    // Verify staff member exists
    const staffCheck = await db.query(
      'SELECT id FROM staff_members WHERE id = $1',
      [staff_id]
    );

    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Create strike
    const result = await db.query(`
      INSERT INTO strikes (
        staff_id, issued_by, strike_date, reason, severity, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [staff_id, req.user.id, strike_date, reason, severity, notes]);

    // Update activity log if strike is for today
    await db.query(`
      UPDATE activity_logs 
      SET strike_given = TRUE
      WHERE staff_id = $1 AND log_date = $2
    `, [staff_id, strike_date]);

    res.status(201).json({
      message: 'Strike issued successfully',
      strike: result.rows[0]
    });
  } catch (error) {
    console.error('Create strike error:', error);
    res.status(500).json({ error: 'Failed to create strike' });
  }
});

// Remove/deactivate strike (admins only)
router.patch('/:id/remove', authMiddleware, requireRole('admin'), [
  body('removal_reason').trim().notEmpty().isLength({ min: 10, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { removal_reason } = req.body;

    const result = await db.query(`
      UPDATE strikes 
      SET 
        is_active = FALSE,
        removed_at = CURRENT_TIMESTAMP,
        removed_by = $1,
        removal_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND is_active = TRUE
      RETURNING *
    `, [req.user.id, removal_reason, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strike not found or already removed' });
    }

    res.json({
      message: 'Strike removed successfully',
      strike: result.rows[0]
    });
  } catch (error) {
    console.error('Remove strike error:', error);
    res.status(500).json({ error: 'Failed to remove strike' });
  }
});

// Update strike (admins only)
router.patch('/:id', authMiddleware, requireRole('admin'), [
  body('reason').optional().trim().isLength({ min: 10, max: 1000 }),
  body('severity').optional().isIn(['warning', 'minor', 'major', 'severe']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { reason, severity, notes } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (reason) {
      updates.push(`reason = $${paramCount}`);
      params.push(reason);
      paramCount++;
    }

    if (severity) {
      updates.push(`severity = $${paramCount}`);
      params.push(severity);
      paramCount++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await db.query(`
      UPDATE strikes 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strike not found' });
    }

    res.json({
      message: 'Strike updated successfully',
      strike: result.rows[0]
    });
  } catch (error) {
    console.error('Update strike error:', error);
    res.status(500).json({ error: 'Failed to update strike' });
  }
});

// Get strike statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_strikes,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_strikes,
        COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warnings,
        COUNT(CASE WHEN severity = 'minor' THEN 1 END) as minor_strikes,
        COUNT(CASE WHEN severity = 'major' THEN 1 END) as major_strikes,
        COUNT(CASE WHEN severity = 'severe' THEN 1 END) as severe_strikes,
        COUNT(DISTINCT staff_id) as staff_with_strikes
      FROM strikes
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get strike stats error:', error);
    res.status(500).json({ error: 'Failed to get strike statistics' });
  }
});

module.exports = router;
