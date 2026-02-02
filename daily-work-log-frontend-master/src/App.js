import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout Components
import MainLayout from './components/layouts/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';

import Register from './pages/auth/Register';


// Team Leader Pages
import TeamLeaderDashboard from './pages/teamLeader/Dashboard';
import CreateDailyLog from './pages/teamLeader/CreateDailyLog';
import EditDailyLog from './pages/teamLeader/EditDailyLog';
import ViewDailyLog from './pages/teamLeader/ViewDailyLog';

// Manager Pages
import ManagerDashboard from './pages/manager/Dashboard';
import AllLogs from './pages/manager/AllLogs';
import LogDetails from './pages/manager/LogDetails';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />  {/* ✅ הוספת register כאן */}

      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        {/* Team Leader Routes */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['Team Leader']}>
            <TeamLeaderDashboard />
          </ProtectedRoute>
        } />
        <Route path="/create-log" element={
          <ProtectedRoute allowedRoles={['Team Leader']}>
            <CreateDailyLog />
          </ProtectedRoute>
        } />
        <Route path="/edit-log/:id" element={
          <ProtectedRoute allowedRoles={['Team Leader','Manager']}>
            <EditDailyLog />
          </ProtectedRoute>
        } />
        <Route path="/view-log/:id" element={
          <ProtectedRoute allowedRoles={['Team Leader']}>
            <ViewDailyLog />
          </ProtectedRoute>
        } />
        
        {/* Manager Routes */}
        <Route path="/manager" element={
          <ProtectedRoute allowedRoles={['Manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/all-logs" element={
          <ProtectedRoute allowedRoles={['Manager']}>
            <AllLogs />
          </ProtectedRoute>
        } />
        <Route path="/log-details/:id" element={
          <ProtectedRoute allowedRoles={['Manager']}>
            <LogDetails />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;
