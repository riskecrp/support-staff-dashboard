import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { calculateQuota, getQuotaStatus } from '@/lib/quotas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get current month in YYYY-MM-DD format (first day of month)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    // Get all active staff
    const staffResult = await query(
      'SELECT * FROM staff WHERE is_active = true AND is_support = true ORDER BY name ASC'
    );
    
    const staff = staffResult.rows;
    
    // Get monthly stats for current month
    const statsResult = await query(
      'SELECT * FROM monthly_stats WHERE month_date = $1',
      [currentMonth]
    );
    
    // Create a map of staff_id to stats
    const statsMap: Record<number, any> = {};
    statsResult.rows.forEach((stat: any) => {
      statsMap[stat.staff_id] = stat;
    });
    
    // Calculate quotas for each staff member
    const staffWithQuotas = staff.map((staffMember: any) => {
      const stats = statsMap[staffMember.id] || {
        staff_id: staffMember.id,
        month_date: currentMonth,
        in_game_reports: 0,
        forum_reports: 0,
        discord_activity: 0,
        quizzes_accepted: 0,
        quizzes_rejected: 0,
        other_activities: 0,
        loa_days: 0
      };
      
      const quota = calculateQuota(staffMember, stats);
      
      return {
        ...staffMember,
        stats,
        quota: {
          ...quota,
          inGameStatus: getQuotaStatus(quota.inGameReports.percentage),
          forumStatus: getQuotaStatus(quota.forumReports.percentage)
        }
      };
    });
    
    return res.status(200).json({
      success: true,
      data: {
        month: currentMonth,
        staff: staffWithQuotas
      }
    });
  } catch (error: any) {
    console.error('Error fetching current stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
