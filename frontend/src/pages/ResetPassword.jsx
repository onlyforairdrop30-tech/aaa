import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';
  const [form, setForm] = useState({ new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);

  const checkStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    setStrength(s);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await resetPassword({ email, otp_code: otp, new_password: form.new_password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['#8B1A1A', '#ED7D31', '#FFC000', '#085041'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!email || !otp) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A1035 0%, #3C3489 100%)' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
        <p>Please complete the OTP verification first.</p>
        <Link to="/forgot-password" style={{ display: 'inline-block', marginTop: '16px', padding: '12px 24px', background: '#3C3489', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>Start Over</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A1035 0%, #3C3489 50%, #085041 100%)', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '48px' }}>🔒</span>
          <h1 style={{ fontSize: '26px', color: '#1A1035', marginTop: '12px' }}>Set New Password</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>New Password</label>
            <input type="password" value={form.new_password} onChange={(e) => { setForm({ ...form, new_password: e.target.value }); checkStrength(e.target.value); }} placeholder="Enter new password" minLength={8} required style={{ width: '100%', padding: '12px 16px', border: '2px solid #E0DDEF', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
            {form.new_password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ height: '4px', background: '#E0DDEF', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(strength / 4) * 100}%`, background: strengthColors[strength - 1] || '#E0DDEF', transition: 'all 0.3s' }} />
                </div>
                <span style={{ fontSize: '12px', color: strengthColors[strength - 1] || '#999' }}>{strength > 0 ? strengthLabels[strength - 1] : ''}</span>
              </div>
            )}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Confirm Password</label>
            <input type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} placeholder="Confirm new password" minLength={8} required style={{ width: '100%', padding: '12px 16px', border: '2px solid #E0DDEF', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '⏳ Resetting...' : '🔒 Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}