const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Get activity logs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { staff_id, start_date, end_date, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        al.*,
        sm.name as staff_name,
        sm.is_senior
      FROM activity_logs al
      JOIN staff_members sm ON al.staff_id = sm.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (staff_id) {
      query += ` AND al.staff_id = $${paramCount}`;
      params.push(staff_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND al.log_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND al.log_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY al.log_date DESC, sm.name ASC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to get activity logs' });
  }
});

// Create activity log (managers and admins only)
router.post('/', authMiddleware, requireRole('manager', 'admin'), [
  body('staff_id').isInt(),
  body('log_date').isDate(),
  body('quizzes_accepted').optional().isInt({ min: 0 }),
  body('quizzes_rejected').optional().isInt({ min: 0 }),
  body('reports_completed').optional().isInt({ min: 0 }),
  body('total_forum_reports').optional().isInt({ min: 0 }),
  body('total_discord').optional().isInt({ min: 0 }),
  body('new_ig_reports').optional().isInt({ min: 0 }),
  body('new_forum_reports').optional().isInt({ min: 0 }),
  body('new_discord').optional().isInt({ min: 0 }),
  body('strike_given').optional().isBoolean(),
  body('loa_days').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      staff_id,
      log_date,
      quizzes_accepted = 0,
      quizzes_rejected = 0,
      reports_completed = 0,
      total_forum_reports = 0,
      total_discord = 0,
      new_ig_reports = 0,
      new_forum_reports = 0,
      new_discord = 0,
      strike_given = false,
      loa_days = 0
    } = req.body;

    const result = await db.query(`
      INSERT INTO activity_logs (
        staff_id, log_date, quizzes_accepted, quizzes_rejected,
        reports_completed, total_forum_reports, total_discord,
        new_ig_reports, new_forum_reports, new_discord,
        strike_given, loa_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (staff_id, log_date) 
      DO UPDATE SET
        quizzes_accepted = EXCLUDED.quizzes_accepted,
        quizzes_rejected = EXCLUDED.quizzes_rejected,
        reports_completed = EXCLUDED.reports_completed,
        total_forum_reports = EXCLUDED.total_forum_reports,
        total_discord = EXCLUDED.total_discord,
        new_ig_reports = EXCLUDED.new_ig_reports,
        new_forum_reports = EXCLUDED.new_forum_reports,
        new_discord = EXCLUDED.new_discord,
        strike_given = EXCLUDED.strike_given,
        loa_days = EXCLUDED.loa_days,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      staff_id, log_date, quizzes_accepted, quizzes_rejected,
      reports_completed, total_forum_reports, total_discord,
      new_ig_reports, new_forum_reports, new_discord,
      strike_given, loa_days
    ]);

    res.status(201).json({
      message: 'Activity log created/updated successfully',
      activity: result.rows[0]
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to create activity log' });
  }
});

// Update activity log (managers and admins only)
router.patch('/:id', authMiddleware, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'quizzes_accepted', 'quizzes_rejected', 'reports_completed',
      'total_forum_reports', 'total_discord', 'new_ig_reports',
      'new_forum_reports', 'new_discord', 'strike_given', 'loa_days'
    ];

    const updates = [];
    const params = [];
    let paramCount = 1;

    Object.keys(req.body).forEach(field => {
      if (allowedFields.includes(field)) {
        updates.push(`${field} = $${paramCount}`);
        params.push(req.body[field]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await db.query(`
      UPDATE activity_logs 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity log not found' });
    }

    res.json({
      message: 'Activity log updated successfully',
      activity: result.rows[0]
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity log' });
  }
});

// Delete activity log (admins only)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM activity_logs WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity log not found' });
    }

    res.json({ message: 'Activity log deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Failed to delete activity log' });
  }
});

// Bulk import activity logs (admins only)
router.post('/bulk-import', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { activities } = req.body;

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ error: 'Invalid activities array' });
    }

    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      let imported = 0;
      for (const activity of activities) {
        await client.query(`
          INSERT INTO activity_logs (
            staff_id, log_date, quizzes_accepted, quizzes_rejected,
            reports_completed, total_forum_reports, total_discord,
            new_ig_reports, new_forum_reports, new_discord,
            strike_given, loa_days
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (staff_id, log_date) DO NOTHING
        `, [
          activity.staff_id,
          activity.log_date,
          activity.quizzes_accepted || 0,
          activity.quizzes_rejected || 0,
          activity.reports_completed || 0,
          activity.total_forum_reports || 0,
          activity.total_discord || 0,
          activity.new_ig_reports || 0,
          activity.new_forum_reports || 0,
          activity.new_discord || 0,
          activity.strike_given || false,
          activity.loa_days || 0
        ]);
        imported++;
      }

      await client.query('COMMIT');
      
      res.json({
        message: 'Bulk import completed',
        imported
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import activities' });
  }
});

module.exports = router;
