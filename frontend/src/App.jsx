import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import ForgotPassword from './pages/ForgotPassword';
import OTPVerify from './pages/OTPVerify';
import ResetPassword from './pages/ResetPassword';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAdmin = localStorage.getItem('admin_token');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedAdmin) setIsAdmin(true);
  }, []);

  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" />;
    return children;
  };

  const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return <Navigate to="/admin/login" />;
    return children;
  };

  return (
    <Router>
      <Toaster position="top-right" />
      <Navbar user={user} setUser={setUser} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      <main style={{ minHeight: 'calc(100vh - 70px)' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<OTPVerify />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/search" element={<ProtectedRoute><Search user={user} /></ProtectedRoute>} />
          <Route path="/admin/login" element={<AdminLogin setIsAdmin={setIsAdmin} />} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;