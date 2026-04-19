import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaBolt, FaLock, FaMusic, FaUserPlus } from 'react-icons/fa6';
import { GrabMarkIcon } from '../components/GrabMarkIcon';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const h = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      toast.success('Welcome to Grab It Hot!');
      navigate('/events');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left panel */}
      <div className="hide-mobile" style={{ flex: '0 0 42%', background: 'var(--ink)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '60px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&auto=format&q=70")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.4) 70%, transparent 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'white', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 48 }}>
            Grab It <span style={{ color: '#FF3B2F' }}>Hot</span> <GrabMarkIcon />
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
            {[[<FaMusic />, '10,000+ events', 'across all 50 states'], [<FaBolt />, 'Instant booking', 'confirmed in seconds'], [<FaLock />, 'Secure payments', '256-bit encrypted']].map(([icon, title, sub]) => (
              <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>{title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Join 500K+ fans who trust Grab It Hot</p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', background: 'var(--cloud)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <Link to="/" className="hide-desktop" style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            Grab It <span style={{ color: '#FF3B2F' }}>Hot</span> <GrabMarkIcon />
          </Link>

          <div className="anim-up" style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,36px)', fontWeight: 900, marginBottom: 8 }}>Create your account</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Join thousands of event-goers across America</p>
          </div>

          <div className="anim-up d1" style={{ background: 'white', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)', padding: '40px 36px', border: '1px solid var(--border-light)' }}>
            <form onSubmit={submit}>
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" name="name" required placeholder="John Doe" value={form.name} onChange={h} />
              </div>
              <div className="form-field">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" name="email" required placeholder="you@example.com" value={form.email} onChange={h} />
              </div>
              <div className="form-field">
                <label className="form-label">Phone <span style={{ color: 'var(--text-ghost)', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" type="tel" name="phone" placeholder="+1 (555) 000-0000" value={form.phone} onChange={h} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-field">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" name="password" required minLength={6} placeholder="Min. 6 characters" value={form.password} onChange={h} />
                </div>
                <div className="form-field">
                  <label className="form-label">Confirm</label>
                  <input className="form-input" type="password" name="confirm" required placeholder="Repeat password" value={form.confirm} onChange={h} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 15, justifyContent: 'center', marginTop: 8 }}>
                {loading ? 'Creating account...' : <><FaUserPlus /> Create Account</>}
              </button>
            </form>
          </div>

          <p className="anim-up d2" style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--flame)', fontWeight: 700 }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
