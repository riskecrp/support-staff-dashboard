import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getOverviewStats, getTrends, getSeniorComparison, getStrikeStats } from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [seniorComparison, setSeniorComparison] = useState([]);
  const [strikeStats, setStrikeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, trendsRes, comparisonRes, strikeStatsRes] = await Promise.all([
        getOverviewStats(dateRange),
        getTrends(dateRange),
        getSeniorComparison(dateRange),
        getStrikeStats()
      ]);

      setStats(statsRes.data);
      setTrends(trendsRes.data);
      setSeniorComparison(comparisonRes.data.map(item => ({
        ...item,
        type: item.is_senior ? 'Senior' : 'Non-Senior'
      })));
      setStrikeStats(strikeStatsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Staff activity metrics and insights</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-700">Date Range:</label>
          <input
            type="date"
            value={dateRange.start_date}
            onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Reports</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats?.total_reports?.toLocaleString() || 0}
              </p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Quiz Acceptance Rate</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats?.quiz_acceptance_rate || 0}%
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Staff</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats?.active_staff || 0}
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Strikes</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats?.active_strikes || 0}
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Activity Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Activity Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="log_date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line type="monotone" dataKey="reports" stroke="#3b82f6" name="Reports" />
              <Line type="monotone" dataKey="discord" stroke="#8b5cf6" name="Discord" />
              <Line type="monotone" dataKey="ig_reports" stroke="#ef4444" name="IG Reports" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Senior vs Non-Senior */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Senior vs Non-Senior Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={seniorComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_reports" fill="#3b82f6" name="Total Reports" />
              <Bar dataKey="avg_reports" fill="#10b981" name="Avg Reports" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strike Statistics */}
      {strikeStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Strike Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{strikeStats.total_strikes}</p>
              <p className="text-xs text-gray-600 mt-1">Total Strikes</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{strikeStats.active_strikes}</p>
              <p className="text-xs text-gray-600 mt-1">Active</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{strikeStats.warnings}</p>
              <p className="text-xs text-gray-600 mt-1">⚠️ Warnings</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{strikeStats.minor_strikes}</p>
              <p className="text-xs text-gray-600 mt-1">🔶 Minor</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{strikeStats.major_strikes}</p>
              <p className="text-xs text-gray-600 mt-1">🔴 Major</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{strikeStats.severe_strikes}</p>
              <p className="text-xs text-gray-600 mt-1">🚨 Severe</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{strikeStats.staff_with_strikes}</p>
              <p className="text-xs text-gray-600 mt-1">Staff w/ Strikes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
