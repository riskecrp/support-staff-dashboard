import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { month, staff_id } = req.query;
    
    let sql = 'SELECT ms.*, s.name, s.is_senior_support FROM monthly_stats ms JOIN staff s ON ms.staff_id = s.id WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;
    
    if (month) {
      paramCount++;
      sql += ` AND ms.month_date = $${paramCount}`;
      params.push(month);
    }
    
    if (staff_id) {
      paramCount++;
      sql += ` AND ms.staff_id = $${paramCount}`;
      params.push(staff_id);
    }
    
    sql += ' ORDER BY ms.month_date DESC, s.name ASC';
    
    const result = await query(sql, params);
    
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      staff_id,
      month_date,
      in_game_reports = 0,
      forum_reports = 0,
      discord_activity = 0,
      quizzes_accepted = 0,
      quizzes_rejected = 0,
      other_activities = 0,
      loa_days = 0
    } = req.body;
    
    if (!staff_id || !month_date) {
      return res.status(400).json({
        success: false,
        error: 'staff_id and month_date are required'
      });
    }
    
    // Upsert monthly stats
    const result = await query(
      `INSERT INTO monthly_stats 
       (staff_id, month_date, in_game_reports, forum_reports, discord_activity, 
        quizzes_accepted, quizzes_rejected, other_activities, loa_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (staff_id, month_date) 
       DO UPDATE SET
         in_game_reports = EXCLUDED.in_game_reports,
         forum_reports = EXCLUDED.forum_reports,
         discord_activity = EXCLUDED.discord_activity,
         quizzes_accepted = EXCLUDED.quizzes_accepted,
         quizzes_rejected = EXCLUDED.quizzes_rejected,
         other_activities = EXCLUDED.other_activities,
         loa_days = EXCLUDED.loa_days,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [staff_id, month_date, in_game_reports, forum_reports, discord_activity,
       quizzes_accepted, quizzes_rejected, other_activities, loa_days]
    );
    
    return res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating/updating stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
