const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Get all staff members
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { is_active, is_senior } = req.query;
    
    let query = 'SELECT * FROM staff_with_strikes WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }

    if (is_senior !== undefined) {
      query += ` AND is_senior = $${paramCount}`;
      params.push(is_senior === 'true');
      paramCount++;
    }

    query += ' ORDER BY name ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Failed to get staff members' });
  }
});

// Get single staff member
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM staff_with_strikes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get staff member error:', error);
    res.status(500).json({ error: 'Failed to get staff member' });
  }
});

// Create staff member (managers and admins only)
router.post('/', authMiddleware, requireRole('manager', 'admin'), [
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('is_senior').isBoolean(),
  body('hire_date').optional().isDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, is_senior, hire_date } = req.body;

    const result = await db.query(`
      INSERT INTO staff_members (name, is_senior, hire_date)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, is_senior, hire_date || null]);

    res.status(201).json({
      message: 'Staff member created successfully',
      staff: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Staff member with this name already exists' });
    }
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// Update staff member (managers and admins only)
router.patch('/:id', authMiddleware, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_senior, is_active, hire_date } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }

    if (is_senior !== undefined) {
      updates.push(`is_senior = $${paramCount}`);
      params.push(is_senior);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
      paramCount++;
    }

    if (hire_date !== undefined) {
      updates.push(`hire_date = $${paramCount}`);
      params.push(hire_date);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await db.query(`
      UPDATE staff_members 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({
      message: 'Staff member updated successfully',
      staff: result.rows[0]
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// Delete staff member (admins only)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM staff_members WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

module.exports = router;
