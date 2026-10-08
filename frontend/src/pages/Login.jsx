import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { login } from '../api';

function getFallbackFingerprint() {
  let fp = localStorage.getItem('device_fingerprint');
  if (!fp) {
    fp = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    localStorage.setItem('device_fingerprint', fp);
  }
  return fp;
}

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ student_id: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState(getFallbackFingerprint());

  useEffect(() => {
    FingerprintJS.load()
      .then(fp => fp.get())
      .then(result => {
        if (result?.visitorId) {
          setFingerprint(result.visitorId);
          localStorage.setItem('device_fingerprint', result.visitorId);
        }
      })
      .catch(() => {
        // Fallback already initialized
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const activeFp = fingerprint || getFallbackFingerprint();
    try {
      const res = await login({ ...form, device_fingerprint: activeFp });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      toast.success('Login successful! 🎉');
      navigate('/search');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A1035 0%, #3C3489 50%, #085041 100%)', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '48px' }}>🔍</span>
          <h1 style={{ fontSize: '28px', color: '#1A1035', marginTop: '12px' }}>College Search Engine</h1>
          <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>Login with your student credentials</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Student ID</label>
            <input type="text" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} placeholder="Enter your Student ID" required style={{ width: '100%', padding: '12px 16px', border: '2px solid #E0DDEF', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" required style={{ width: '100%', padding: '12px 16px', border: '2px solid #E0DDEF', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <Link to="/forgot-password" style={{ color: '#3C3489', fontSize: '13px', fontWeight: '500' }}>Forgot Password?</Link>
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Logging in...' : '🔐 Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#666' }}>
          Don't have an account? <Link to="/register" style={{ color: '#3C3489', fontWeight: '600' }}>Register here</Link>
        </p>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #EAE8F5', textAlign: 'center' }}>
          <Link to="/admin/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#8B1A1A', fontSize: '13px', fontWeight: '600', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', background: '#FDF2F2' }}>
            👨‍💼 Go to Admin Portal ➔
          </Link>
        </div>
      </div>
    </div>
  );
}