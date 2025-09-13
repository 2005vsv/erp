import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';

// Student Pages
import StudentList from './pages/students/StudentList';
import StudentDetails from './pages/students/StudentDetails';
import AddStudent from './pages/students/AddStudent';

// Admission Pages
import AdmissionList from './pages/admissions/AdmissionList';
import AdmissionForm from './pages/admissions/AdmissionForm';

// Fee Pages
import FeeCollection from './pages/fees/FeeCollection';
import FeeReports from './pages/fees/FeeReports';

// Hostel Pages
import HostelList from './pages/hostels/HostelList';
import HostelAllocation from './pages/hostels/HostelAllocation';

// Exam Pages
import ExamList from './pages/exams/ExamList';
import ExamResults from './pages/exams/ExamResults';

// User Management Pages
import UserList from './pages/users/UserList';
import UserProfile from './pages/users/UserProfile';

// Settings Pages
import Settings from './pages/settings/Settings';

// Error Pages
import NotFound from './pages/errors/NotFound';

// Context and Hooks
import { useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>
        
        {/* Main App Routes */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Dashboard />} />
          
          {/* Student Routes */}
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/:id" element={<StudentDetails />} />
          <Route path="/students/add" element={<AddStudent />} />
          
          {/* Admission Routes */}
          <Route path="/admissions" element={<AdmissionList />} />
          <Route path="/admissions/apply" element={<AdmissionForm />} />
          
          {/* Fee Routes */}
          <Route path="/fees/collect" element={<FeeCollection />} />
          <Route path="/fees/reports" element={<FeeReports />} />
          
          {/* Hostel Routes */}
          <Route path="/hostels" element={<HostelList />} />
          <Route path="/hostels/allocate" element={<HostelAllocation />} />
          
          {/* Exam Routes */}
          <Route path="/exams" element={<ExamList />} />
          <Route path="/exams/results" element={<ExamResults />} />
          
          {/* User Management Routes */}
          <Route path="/users" element={<UserList />} />
          <Route path="/profile" element={<UserProfile />} />
          
          {/* Settings Route */}
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;