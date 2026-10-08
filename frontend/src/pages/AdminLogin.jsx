import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminLogin } from '../api';

export default function AdminLogin({ setIsAdmin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin({
        username: form.username.trim(),
        password: form.password.trim()
      });
      localStorage.setItem('admin_token', res.data.access_token);
      setIsAdmin(true);
      toast.success('Admin login successful!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A1035 0%, #3C3489 50%, #8B1A1A 100%)', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '48px' }}>👨‍💼</span>
          <h1 style={{ fontSize: '26px', color: '#1A1035', marginTop: '12px' }}>Admin Login</h1>
          <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>Restricted Access for Authorized Administrators</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Admin Email / Username</label>
            <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Enter admin email or username" required style={{ width: '100%', padding: '12px 16px', border: '2px solid #E0DDEF', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter admin password" required style={{ width: '100%', padding: '12px 16px', border: '2px solid #E0DDEF', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: '#8B1A1A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '⏳ Logging in...' : '🔐 Admin Login'}
          </button>
        </form>
      </div>
    </div>
  );
}