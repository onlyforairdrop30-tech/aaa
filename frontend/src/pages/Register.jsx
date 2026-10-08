import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', student_id: '', email: '', password: '', college_enroll_id: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Registration successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A1035 0%, #3C3489 50%, #085041 100%)', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '48px' }}>🎓</span>
          <h1 style={{ fontSize: '26px', color: '#1A1035', marginTop: '12px' }}>Student Registration</h1>
        </div>
        <form onSubmit={handleSubmit}>
          {[
            { label: 'Full Name', key: 'name', type: 'text', ph: 'Enter your full name' },
            { label: 'Student ID', key: 'student_id', type: 'text', ph: 'Enter your Student ID' },
            { label: 'College Enrollment ID', key: 'college_enroll_id', type: 'text', ph: 'Enter enrollment ID' },
            { label: 'Email Address', key: 'email', type: 'email', ph: 'Enter your email' },
            { label: 'Password', key: 'password', type: 'password', ph: 'Min 8 characters' },
          ].map((f) => (
            <div key={f.key} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} required minLength={f.key === 'password' ? 8 : undefined} style={{ width: '100%', padding: '12px 16px', border: '2px solid #E0DDEF', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
            </div>
          ))}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
            {loading ? '⏳ Registering...' : '📝 Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#3C3489', fontWeight: '600' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}