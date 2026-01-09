import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import RegisterStudent from './pages/RegisterStudent';
import RegisterWarden from './pages/RegisterWarden';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminRooms from './pages/admin/Rooms';
import AdminComplaints from './pages/admin/Complaints';
import AdminWardens from './pages/admin/Wardens';
import AdminImport from './pages/admin/Import';
import StudentDashboard from './pages/student/Dashboard';
import StudentComplaints from './pages/student/Complaints';
import StudentNewComplaint from './pages/student/NewComplaint';
import StudentProfile from './pages/student/Profile';
import ProfileSetup from './pages/student/ProfileSetup';
import './App.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultRoute = user.role === 'student' ? '/student/dashboard' : '/admin/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }
  
  // Check if student needs to complete profile
  if (user.role === 'student' && !user.profile_completed && window.location.pathname !== '/student/profile-setup') {
    return <Navigate to="/student/profile-setup" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;

  const getRedirectRoute = () => {
    if (!user) return '/';
    if (user.role === 'student') {
      return user.profile_completed ? '/student/dashboard' : '/student/profile-setup';
    }
    return '/admin/dashboard';
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getRedirectRoute()} replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to={getRedirectRoute()} replace /> : <Login />} />
      <Route path="/register/student" element={<RegisterStudent />} />
      <Route path="/register/warden" element={<RegisterWarden />} />
      
      {/* Admin/Warden Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['superadmin', 'warden']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/students" element={
        <ProtectedRoute allowedRoles={['superadmin', 'warden']}>
          <AdminStudents />
        </ProtectedRoute>
      } />
      <Route path="/admin/rooms" element={
        <ProtectedRoute allowedRoles={['superadmin', 'warden']}>
          <AdminRooms />
        </ProtectedRoute>
      } />
      <Route path="/admin/complaints" element={
        <ProtectedRoute allowedRoles={['superadmin', 'warden']}>
          <AdminComplaints />
        </ProtectedRoute>
      } />
      <Route path="/admin/wardens" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <AdminWardens />
        </ProtectedRoute>
      } />
      <Route path="/admin/import" element={
        <ProtectedRoute allowedRoles={['superadmin', 'warden']}>
          <AdminImport />
        </ProtectedRoute>
      } />
      
      {/* Student Routes */}
      <Route path="/student/profile-setup" element={
        <ProtectedRoute allowedRoles={['student']}>
          <ProfileSetup />
        </ProtectedRoute>
      } />
      <Route path="/student/dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/complaints" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentComplaints />
        </ProtectedRoute>
      } />
      <Route path="/student/complaints/new" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentNewComplaint />
        </ProtectedRoute>
      } />
      <Route path="/student/profile" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentProfile />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
