import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPassword } from '../api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPassword({ email: email.trim() });
      if (res.data.dev_otp) {
        toast.success(`OTP generated: ${res.data.dev_otp}`, { duration: 6000 });
      } else {
        toast.success(res.data.message || 'OTP sent to your email!');
      }
      navigate('/verify-otp', { state: { email: email.trim(), devOtp: res.data.dev_otp } });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A1035 0%, #3C3489 50%, #085041 100%)', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '48px' }}>🔑</span>
          <h1 style={{ fontSize: '26px', color: '#1A1035', marginTop: '12px' }}>Forgot Password</h1>
          <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>Enter your registered email to receive OTP</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your registered email" required style={{ width: '100%', padding: '12px 16px', border: '2px solid #E0DDEF', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '⏳ Sending...' : '📧 Send OTP'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#666' }}>
          Remember your password? <Link to="/login" style={{ color: '#3C3489', fontWeight: '600' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}