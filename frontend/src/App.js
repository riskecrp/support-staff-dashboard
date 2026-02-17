import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StrikeManagement from './components/StrikeManagement';
import ActivityManagement from './components/ActivityManagement';
import StaffManagement from './components/StaffManagement';
import Sidebar from './components/Sidebar';
import { getMe } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await getMe();
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} onLogout={handleLogout} />
        
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/strikes" element={<StrikeManagement />} />
            <Route path="/activity" element={<ActivityManagement />} />
            <Route path="/staff" element={<StaffManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
