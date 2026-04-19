import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { GrabMarkIcon } from '../components/GrabMarkIcon';

const AdminLoginPage = () => {
  const { user, loading, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (!loading && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '70vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(email, password);
      if (u.role !== 'admin') {
        logout();
        toast.error('This account is not authorized for the admin dashboard.');
        return;
      }
      toast.success('Signed in');
      navigate(from.startsWith('/admin') ? from : '/admin', { replace: true });
    } catch (err) {
      const d = err.response?.data;
      const validationMsg = Array.isArray(d?.errors) ? d.errors.map((e) => e.msg).join(' ') : '';
      const msg =
        d?.message
        || validationMsg
        || (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Cannot reach API. Is the backend running on port 5000?'
          : null)
        || err.message
        || 'Sign-in failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cloud)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28, color: 'var(--ink)' }}>
          Grab It <span style={{ color: '#FF3B2F' }}>Hot</span>
          <GrabMarkIcon />
        </Link>
        <div style={{ background: 'white', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)', padding: '36px 32px', border: '1px solid var(--border-light)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Admin login</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Sign in to open the staff dashboard.</p>
          <form onSubmit={submit}>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPass ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass((p) => !p)} aria-label={showPass ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}>
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }} disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in to dashboard'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to site</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
