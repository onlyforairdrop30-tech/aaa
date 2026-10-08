import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { verifyOtp } from '../api';

export default function OTPVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const devOtp = location.state?.devOtp || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (devOtp && devOtp.length === 6) {
      setOtp(devOtp.split(''));
    }
  }, [devOtp]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      const newOtp = [...otp];
      for (let i = 0; i < pasteData.length; i++) {
        newOtp[i] = pasteData[i];
      }
      setOtp(newOtp);
      const focusIndex = Math.min(pasteData.length, 5);
      document.getElementById(`otp-${focusIndex}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp({ email: email.trim(), otp_code: otpCode });
      toast.success('OTP verified!');
      navigate('/reset-password', { state: { email: email.trim(), otp: otpCode } });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A1035 0%, #3C3489 100%)' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
          <p>Please go through the forgot password flow first.</p>
          <Link to="/forgot-password" style={{ display: 'inline-block', marginTop: '16px', padding: '12px 24px', background: '#3C3489', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>Go to Forgot Password</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A1035 0%, #3C3489 50%, #085041 100%)', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '48px' }}>🔢</span>
          <h1 style={{ fontSize: '26px', color: '#1A1035', marginTop: '12px' }}>Enter OTP</h1>
          <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>6-digit code for <strong>{email}</strong></p>
        </div>

        {devOtp && (
          <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', textAlign: 'center', fontSize: '13px', color: '#137333' }}>
            ✨ <strong>Dev/Demo OTP:</strong> <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '2px' }}>{devOtp}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '32px' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                style={{ width: '48px', height: '56px', textAlign: 'center', fontSize: '22px', fontWeight: '700', border: '2px solid #E0DDEF', borderRadius: '10px', outline: 'none' }}
              />
            ))}
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '⏳ Verifying...' : '✅ Verify OTP'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#666' }}>
          Didn't receive OTP? <Link to="/forgot-password" style={{ color: '#3C3489', fontWeight: '600' }}>Try again</Link>
        </p>
      </div>
    </div>
  );
}