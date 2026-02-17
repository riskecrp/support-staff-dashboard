'use client';

import { useEffect, useState } from 'react';

interface Quota {
  required: number;
  actual: number;
  percentage: number;
}

interface StaffWithStats {
  id: number;
  name: string;
  is_senior_support: boolean;
  strikes: number;
  stats: {
    in_game_reports: number;
    forum_reports: number;
    discord_activity: number;
    loa_days: number;
  };
  quota: {
    inGameReports: Quota;
    forumReports: Quota;
    inGameStatus: 'success' | 'warning' | 'danger';
    forumStatus: 'success' | 'warning' | 'danger';
  };
}

export default function MonthlyStatsPage() {
  const [data, setData] = useState<{ month: string; staff: StaffWithStats[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentStats();
  }, []);

  const fetchCurrentStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats/current');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading monthly stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">No data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Monthly Stats Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Current month: {new Date(data.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Staff Stats Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {data.staff.map((member) => (
              <div
                key={member.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                  member.quota.inGameStatus === 'danger' || member.quota.forumStatus === 'danger'
                    ? 'border-red-500'
                    : member.quota.inGameStatus === 'warning' || member.quota.forumStatus === 'warning'
                    ? 'border-yellow-500'
                    : 'border-green-500'
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                      <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.is_senior_support
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.is_senior_support ? 'Senior Support' : 'Support'}
                      </span>
                    </div>
                    {member.strikes > 0 && (
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${
                          member.strikes === 1 ? 'text-yellow-600' :
                          member.strikes === 2 ? 'text-red-600' :
                          'text-red-800'
                        }`}>
                          ⚠ {member.strikes} Strike{member.strikes > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* LOA Days */}
                  {member.stats.loa_days > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                      <span className="text-sm text-blue-800">
                        🏖 {member.stats.loa_days} LOA day{member.stats.loa_days > 1 ? 's' : ''} this month
                      </span>
                    </div>
                  )}

                  {/* In-Game Reports */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">In-Game Reports</span>
                      <span className="text-gray-600">
                        {member.quota.inGameReports.actual} / {member.quota.inGameReports.required}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${getStatusColor(member.quota.inGameStatus)}`}
                        style={{ width: `${Math.min(100, member.quota.inGameReports.percentage)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {member.quota.inGameReports.percentage.toFixed(1)}% complete
                    </div>
                  </div>

                  {/* Forum Reports (if Senior Support) */}
                  {member.is_senior_support && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Forum Reports</span>
                        <span className="text-gray-600">
                          {member.quota.forumReports.actual} / {member.quota.forumReports.required}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getStatusColor(member.quota.forumStatus)}`}
                          style={{ width: `${Math.min(100, member.quota.forumReports.percentage)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {member.quota.forumReports.percentage.toFixed(1)}% complete
                      </div>
                    </div>
                  )}

                  {/* Additional Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500">Discord Activity</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {member.stats.discord_activity}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Quizzes</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {(member.stats as any).quizzes_accepted || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Back to Home */}
          <div className="mt-8">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
