import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { GrabMarkIcon } from '../components/GrabMarkIcon';

const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    {/* Left decorative panel */}
    <div className="hide-mobile" style={{
      flex: '0 0 45%',
      background: 'var(--ink)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: '60px',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&auto=format&q=70")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.25 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.4) 60%, transparent 100%)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'white', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 48 }}>
          Grab It <span style={{ color: '#FF3B2F' }}>Hot</span> <GrabMarkIcon />
        </Link>
        <blockquote style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, maxWidth: 360, marginBottom: 20 }}>
          "The best events are the ones you didn't plan."
        </blockquote>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Join 500K+ event-goers across America</p>
      </div>
    </div>

    {/* Right form panel */}
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', background: 'var(--cloud)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Mobile logo */}
        <Link to="/" className="hide-desktop" style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          Grab It <span style={{ color: '#FF3B2F' }}>Hot</span> <GrabMarkIcon />
        </Link>

        <div className="anim-up" style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,36px)', fontWeight: 900, marginBottom: 8 }}>{title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{subtitle}</p>
        </div>

        <div className="anim-up d1" style={{ background: 'white', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)', padding: '40px 36px', border: '1px solid var(--border-light)' }}>
          {children}
        </div>

        {footer && <div className="anim-up d2" style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>{footer}</div>}
      </div>
    </div>
  </div>
);

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your tickets and bookings"
      footer={<>Don't have an account? <Link to="/register" style={{ color: 'var(--flame)', fontWeight: 700 }}>Create one free →</Link></>}
    >
      <form onSubmit={submit}>
        <div className="form-field">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" required placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div className="form-field" style={{ marginBottom: 28 }}>
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input className="form-input" type={showPass ? 'text' : 'password'} required placeholder="Your password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={{ paddingRight: 48 }} />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>
              {showPass ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 15, justifyContent: 'center' }}>
          {loading ? 'Signing in...' : 'Sign In →'}
        </button>
      </form>

      <div style={{ marginTop: 24, padding: '14px 18px', background: 'var(--smoke)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
        <strong>Test accounts:</strong><br />
        Admin: admin@gmail.com / ali12345@@ (same as <code>npm run seed:admin</code> defaults)<br />
        User: test@grabit-hot.com / test123456
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
