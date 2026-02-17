/**
 * Calculate quota for a staff member in a specific month
 */
export interface Staff {
  id: number;
  name: string;
  is_support: boolean;
  is_senior_support: boolean;
  strikes: number;
  is_active: boolean;
}

export interface MonthlyStats {
  staff_id: number;
  month_date: string;
  in_game_reports: number;
  forum_reports: number;
  discord_activity: number;
  quizzes_accepted: number;
  quizzes_rejected: number;
  other_activities: number;
  loa_days: number;
}

export interface QuotaResult {
  inGameReports: {
    required: number;
    actual: number;
    percentage: number;
  };
  forumReports: {
    required: number;
    actual: number;
    percentage: number;
  };
}

export function calculateQuota(staffMember: Staff, monthlyStats: MonthlyStats): QuotaResult {
  const baseIGQuota = 30;
  const baseForumQuota = staffMember.is_senior_support ? 5 : 0;
  
  const loaDays = monthlyStats.loa_days || 0;
  const adjustedIGQuota = Math.max(0, baseIGQuota - loaDays);
  
  return {
    inGameReports: {
      required: adjustedIGQuota,
      actual: monthlyStats.in_game_reports || 0,
      percentage: adjustedIGQuota > 0 
        ? (monthlyStats.in_game_reports / adjustedIGQuota * 100) 
        : 100
    },
    forumReports: {
      required: baseForumQuota,
      actual: monthlyStats.forum_reports || 0,
      percentage: baseForumQuota > 0 
        ? (monthlyStats.forum_reports / baseForumQuota * 100) 
        : 100
    }
  };
}

/**
 * Get color status based on percentage
 */
export function getQuotaStatus(percentage: number): 'success' | 'warning' | 'danger' {
  if (percentage >= 100) return 'success';
  if (percentage >= 75) return 'warning';
  return 'danger';
}
