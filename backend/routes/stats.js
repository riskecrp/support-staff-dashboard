const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

// Get dashboard overview stats
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const dateFilter = start_date && end_date 
      ? `WHERE log_date BETWEEN '${start_date}' AND '${end_date}'`
      : `WHERE log_date >= CURRENT_DATE - INTERVAL '30 days'`;

    const stats = await db.query(`
      SELECT 
        COUNT(DISTINCT staff_id) as active_staff,
        SUM(reports_completed) as total_reports,
        SUM(quizzes_accepted) as total_quizzes_accepted,
        SUM(quizzes_rejected) as total_quizzes_rejected,
        SUM(total_discord) as total_discord,
        SUM(new_ig_reports) as total_ig_reports,
        SUM(new_forum_reports) as total_forum_reports,
        COUNT(CASE WHEN strike_given = TRUE THEN 1 END) as strikes_given,
        ROUND(
          SUM(quizzes_accepted)::numeric / 
          NULLIF(SUM(quizzes_accepted) + SUM(quizzes_rejected), 0)::numeric * 100,
          2
        ) as quiz_acceptance_rate
      FROM activity_logs
      ${dateFilter}
    `);

    const activeStrikes = await db.query(`
      SELECT COUNT(*) as count
      FROM strikes
      WHERE is_active = TRUE
    `);

    res.json({
      ...stats.rows[0],
      active_strikes: parseInt(activeStrikes.rows[0].count)
    });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({ error: 'Failed to get overview statistics' });
  }
});

// Get staff performance rankings
router.get('/rankings', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, metric = 'reports_completed' } = req.query;
    
    const dateFilter = start_date && end_date 
      ? `AND log_date BETWEEN '${start_date}' AND '${end_date}'`
      : `AND log_date >= CURRENT_DATE - INTERVAL '30 days'`;

    const validMetrics = [
      'reports_completed', 'quizzes_accepted', 'total_discord',
      'new_ig_reports', 'new_forum_reports'
    ];

    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric' });
    }

    const result = await db.query(`
      SELECT 
        sm.id,
        sm.name,
        sm.is_senior,
        SUM(al.${metric}) as total,
        RANK() OVER (ORDER BY SUM(al.${metric}) DESC) as rank
      FROM staff_members sm
      LEFT JOIN activity_logs al ON sm.id = al.staff_id ${dateFilter}
      WHERE sm.is_active = TRUE
      GROUP BY sm.id, sm.name, sm.is_senior
      ORDER BY total DESC
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get rankings error:', error);
    res.status(500).json({ error: 'Failed to get rankings' });
  }
});

// Get activity trends over time
router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, staff_id } = req.query;
    
    const dateFilter = start_date && end_date 
      ? `log_date BETWEEN '${start_date}' AND '${end_date}'`
      : `log_date >= CURRENT_DATE - INTERVAL '90 days'`;

    const staffFilter = staff_id ? `AND staff_id = ${staff_id}` : '';

    const result = await db.query(`
      SELECT 
        log_date,
        SUM(reports_completed) as reports,
        SUM(quizzes_accepted) as quizzes_accepted,
        SUM(quizzes_rejected) as quizzes_rejected,
        SUM(total_discord) as discord,
        SUM(new_ig_reports) as ig_reports,
        COUNT(DISTINCT staff_id) as active_staff
      FROM activity_logs
      WHERE ${dateFilter} ${staffFilter}
      GROUP BY log_date
      ORDER BY log_date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Failed to get trends' });
  }
});

// Get senior vs non-senior comparison
router.get('/senior-comparison', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const dateFilter = start_date && end_date 
      ? `AND log_date BETWEEN '${start_date}' AND '${end_date}'`
      : `AND log_date >= CURRENT_DATE - INTERVAL '30 days'`;

    const result = await db.query(`
      SELECT 
        sm.is_senior,
        COUNT(DISTINCT sm.id) as staff_count,
        ROUND(AVG(al.reports_completed), 2) as avg_reports,
        ROUND(AVG(al.quizzes_accepted), 2) as avg_quizzes_accepted,
        ROUND(AVG(al.total_discord), 2) as avg_discord,
        SUM(al.reports_completed) as total_reports
      FROM staff_members sm
      LEFT JOIN activity_logs al ON sm.id = al.staff_id ${dateFilter}
      WHERE sm.is_active = TRUE
      GROUP BY sm.is_senior
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get senior comparison error:', error);
    res.status(500).json({ error: 'Failed to get senior comparison' });
  }
});

// Get staff activity summary
router.get('/staff-summary/:staff_id', authMiddleware, async (req, res) => {
  try {
    const { staff_id } = req.params;
    const { start_date, end_date } = req.query;
    
    const dateFilter = start_date && end_date 
      ? `AND log_date BETWEEN '${start_date}' AND '${end_date}'`
      : `AND log_date >= CURRENT_DATE - INTERVAL '30 days'`;

    const summary = await db.query(`
      SELECT 
        sm.name,
        sm.is_senior,
        COUNT(al.id) as days_logged,
        SUM(al.reports_completed) as total_reports,
        SUM(al.quizzes_accepted) as total_quizzes_accepted,
        SUM(al.quizzes_rejected) as total_quizzes_rejected,
        SUM(al.total_discord) as total_discord,
        SUM(al.new_ig_reports) as total_ig_reports,
        SUM(al.loa_days) as total_loa_days,
        COUNT(CASE WHEN al.strike_given = TRUE THEN 1 END) as strikes_in_period,
        ROUND(AVG(al.reports_completed), 2) as avg_reports_per_day,
        MAX(al.reports_completed) as max_reports_single_day
      FROM staff_members sm
      LEFT JOIN activity_logs al ON sm.id = al.staff_id ${dateFilter}
      WHERE sm.id = $1
      GROUP BY sm.id, sm.name, sm.is_senior
    `, [staff_id]);

    if (summary.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const strikes = await db.query(`
      SELECT 
        COUNT(*) as total_strikes,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_strikes
      FROM strikes
      WHERE staff_id = $1
    `, [staff_id]);

    res.json({
      ...summary.rows[0],
      ...strikes.rows[0]
    });
  } catch (error) {
    console.error('Get staff summary error:', error);
    res.status(500).json({ error: 'Failed to get staff summary' });
  }
});

// Export data as CSV
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const dateFilter = start_date && end_date 
      ? `WHERE log_date BETWEEN '${start_date}' AND '${end_date}'`
      : `WHERE log_date >= CURRENT_DATE - INTERVAL '30 days'`;

    const result = await db.query(`
      SELECT 
        al.log_date,
        sm.name as staff_name,
        sm.is_senior,
        al.quizzes_accepted,
        al.quizzes_rejected,
        al.reports_completed,
        al.total_forum_reports,
        al.total_discord,
        al.new_ig_reports,
        al.new_forum_reports,
        al.new_discord,
        al.strike_given,
        al.loa_days
      FROM activity_logs al
      JOIN staff_members sm ON al.staff_id = sm.id
      ${dateFilter}
      ORDER BY al.log_date DESC, sm.name ASC
    `);

    // Convert to CSV
    const headers = Object.keys(result.rows[0] || {});
    const csv = [
      headers.join(','),
      ...result.rows.map(row => 
        headers.map(header => `"${row[header] ?? ''}"`).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=activity_export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;
