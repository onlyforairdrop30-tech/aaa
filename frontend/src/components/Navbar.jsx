import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ user, setUser, isAdmin, setIsAdmin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAdmin(false);
    navigate('/admin/login');
  };

  const hideNav = ['/login', '/register', '/forgot-password', '/verify-otp', '/reset-password', '/admin/login'];
  if (hideNav.includes(location.pathname)) return null;

  return (
    <nav style={{ background: '#3C3489', padding: '0 24px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(60,52,137,0.3)' }}>
      <Link to={isAdmin ? '/admin' : '/search'} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white', fontSize: '20px', fontWeight: '700', textDecoration: 'none' }}>
        <span style={{ fontSize: '28px' }}>🔍</span>
        College Search Engine
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isAdmin ? (
          <>
            <span style={{ color: '#C8C4F8', fontSize: '14px' }}>👨‍💼 Admin Panel</span>
            <button onClick={handleAdminLogout} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Logout</button>
          </>
        ) : user ? (
          <>
            <Link to="/search" style={{ color: '#C8C4F8', fontSize: '14px', textDecoration: 'none' }}>🔍 Search</Link>
            <span style={{ color: '#C8C4F8', fontSize: '14px' }}>👋 {user.name}</span>
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Logout</button>
          </>
        ) : null}
      </div>
    </nav>
  );
}