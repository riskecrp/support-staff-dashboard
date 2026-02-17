import React, { useState, useEffect } from 'react';
import { getStrikes, createStrike, removeStrike, getStaff } from '../services/api';
import { toast } from 'react-toastify';

const StrikeManagement = () => {
  const [strikes, setStrikes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    is_active: 'true',
    severity: '',
    staff_id: ''
  });

  const [newStrike, setNewStrike] = useState({
    staff_id: '',
    strike_date: new Date().toISOString().split('T')[0],
    reason: '',
    severity: 'minor',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [strikesRes, staffRes] = await Promise.all([
        getStrikes(filters),
        getStaff({ is_active: true })
      ]);
      setStrikes(strikesRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStrike = async (e) => {
    e.preventDefault();
    
    if (newStrike.reason.length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }

    try {
      await createStrike(newStrike);
      toast.success('Strike issued successfully');
      setShowAddModal(false);
      setNewStrike({
        staff_id: '',
        strike_date: new Date().toISOString().split('T')[0],
        reason: '',
        severity: 'minor',
        notes: ''
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to issue strike');
    }
  };

  const handleRemoveStrike = async (strikeId) => {
    const reason = prompt('Enter reason for removing this strike:');
    if (!reason || reason.length < 10) {
      toast.error('Removal reason must be at least 10 characters');
      return;
    }

    try {
      await removeStrike(strikeId, reason);
      toast.success('Strike removed successfully');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove strike');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      minor: 'bg-orange-100 text-orange-800 border-orange-300',
      major: 'bg-red-100 text-red-800 border-red-300',
      severe: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[severity] || colors.minor;
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      warning: '⚠️',
      minor: '🔶',
      major: '🔴',
      severe: '🚨'
    };
    return badges[severity] || '🔶';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Strike Management</h1>
          <p className="text-gray-600 mt-1">Manage and track staff strikes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-semibold flex items-center gap-2"
        >
          <span>⚠️</span> Issue Strike
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.is_active}
              onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Strikes</option>
              <option value="true">Active Only</option>
              <option value="false">Removed Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Severities</option>
              <option value="warning">⚠️ Warning</option>
              <option value="minor">🔶 Minor</option>
              <option value="major">🔴 Major</option>
              <option value="severe">🚨 Severe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Staff Member
            </label>
            <select
              value={filters.staff_id}
              onChange={(e) => setFilters({ ...filters, staff_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Staff</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} {member.is_senior ? '⭐' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Strikes List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading strikes...</p>
          </div>
        ) : strikes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No strikes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {strikes.map((strike) => (
                  <tr key={strike.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-900">
                          {strike.staff_name}
                        </div>
                        {strike.is_senior && (
                          <span className="ml-2 text-yellow-500">⭐</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(strike.strike_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(strike.severity)}`}>
                        {getSeverityBadge(strike.severity)} {strike.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md">
                        {strike.reason}
                      </div>
                      {strike.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          Note: {strike.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {strike.issued_by_username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {strike.is_active ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          ✓ Active
                        </span>
                      ) : (
                        <div>
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                            ✗ Removed
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            By: {strike.removed_by_username}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {strike.is_active && (
                        <button
                          onClick={() => handleRemoveStrike(strike.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Strike Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Issue New Strike</h2>
            </div>

            <form onSubmit={handleAddStrike} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Member *
                </label>
                <select
                  required
                  value={newStrike.staff_id}
                  onChange={(e) => setNewStrike({ ...newStrike, staff_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select staff member...</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} {member.is_senior ? '⭐ Senior' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={newStrike.strike_date}
                  onChange={(e) => setNewStrike({ ...newStrike, strike_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity *
                </label>
                <select
                  required
                  value={newStrike.severity}
                  onChange={(e) => setNewStrike({ ...newStrike, severity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="warning">⚠️ Warning - Verbal/First offense</option>
                  <option value="minor">🔶 Minor - Minor policy violation</option>
                  <option value="major">🔴 Major - Serious policy violation</option>
                  <option value="severe">🚨 Severe - Critical violation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason * (min 10 characters)
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  value={newStrike.reason}
                  onChange={(e) => setNewStrike({ ...newStrike, reason: e.target.value })}
                  placeholder="Describe the incident that led to this strike..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newStrike.reason.length}/1000 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={newStrike.notes}
                  onChange={(e) => setNewStrike({ ...newStrike, notes: e.target.value })}
                  placeholder="Any additional context or notes..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Issue Strike
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrikeManagement;
