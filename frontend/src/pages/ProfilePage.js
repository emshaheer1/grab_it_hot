import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatEventScheduleDate, formatCurrency, resolveEventImageUrl } from '../utils/helpers';
import { toast } from 'react-toastify';
import { FaCalendarDays, FaTicket } from 'react-icons/fa6';

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/bookings/my')
      .then((r) => setBookings(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingBookings(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await updateProfile(form); toast.success('Profile updated!'); setEditMode(false); }
    catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      setBookings((p) => p.map((b) => b._id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusColors = { confirmed: { bg: '#E8F5EE', color: '#1A7A4A' }, cancelled: { bg: '#F0EFED', color: '#6B6560' }, pending: { bg: '#FEF3C7', color: '#92400E' } };

  return (
    <div style={{ background: 'var(--cloud)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--ink)', padding: '56px 0 48px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--flame)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0, boxShadow: '0 8px 24px rgba(255,59,47,0.4)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,34px)', color: 'white', fontWeight: 900, marginBottom: 4 }}>{user?.name}</h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>{user?.email}</p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ background: user?.role === 'admin' ? 'var(--flame)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '5px 16px', borderRadius: 'var(--r-pill)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 32, alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Profile card */}
            <div style={{ background: 'white', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-md)', padding: '28px 24px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-ghost)', marginBottom: 20 }}>Profile Details</div>

              {editMode ? (
                <form onSubmit={saveProfile}>
                  <div className="form-field">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 20 }}>
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px 0', fontSize: 13 }}>
                      {saving ? '...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditMode(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px 0', fontSize: 13 }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {[['Name', user?.name], ['Email', user?.email], ['Phone', user?.phone || '—']].map(([label, val]) => (
                    <div key={label} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-ghost)', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, wordBreak: 'break-word' }}>{val}</div>
                    </div>
                  ))}
                  <button onClick={() => setEditMode(true)} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '11px 0', marginTop: 8, fontSize: 13 }}>
                    Edit Profile
                  </button>
                </>
              )}
            </div>

            {/* Logout */}
            <button onClick={logout} style={{ background: 'white', border: '1.5px solid var(--smoke-deep)', borderRadius: 'var(--r-lg)', padding: '14px', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--flame)'; e.currentTarget.style.color = 'var(--flame)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--smoke-deep)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              Sign Out
            </button>
          </div>

          {/* Bookings panel */}
          <div style={{ background: 'white', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '28px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>My Bookings</h2>
              <span style={{ background: 'var(--smoke)', color: 'var(--text-muted)', borderRadius: 'var(--r-pill)', padding: '4px 14px', fontSize: 13, fontWeight: 600 }}>
                {bookings.length} total
              </span>
            </div>

            {loadingBookings ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 40px' }}>
                <div style={{ fontSize: 52, marginBottom: 16, color: 'var(--text-ghost)' }}><FaTicket /></div>
                <h3 style={{ fontSize: 20, marginBottom: 10, fontFamily: 'var(--font-display)' }}>No bookings yet</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your confirmed tickets will appear here.</p>
                <Link to="/events" className="btn btn-primary">Browse Events →</Link>
              </div>
            ) : (
              <div>
                {bookings.map((b, i) => (
                  <div key={b._id} style={{ display: 'flex', gap: 16, padding: '20px 32px', borderBottom: i < bookings.length - 1 ? '1px solid var(--border-light)' : 'none', alignItems: 'center', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cloud)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {b.event?.image && (
                      <img src={resolveEventImageUrl(b.event.image)} alt="" style={{ width: 64, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.event?.title || 'Event'}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FaCalendarDays /> {b.event ? formatEventScheduleDate(b.event) : '—'}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FaTicket /> {b.ticketTier?.name} × {b.quantity}</span>
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-ghost)', marginTop: 4 }}>{b.bookingId}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: 'var(--flame)', marginBottom: 6 }}>{formatCurrency(b.totalAmount)}</div>
                      <span style={{ background: statusColors[b.status]?.bg || '#f0f0f0', color: statusColors[b.status]?.color || '#555', padding: '4px 12px', borderRadius: 'var(--r-pill)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {b.status}
                      </span>
                      {b.status === 'confirmed' && (
                        <div>
                          <button onClick={() => cancelBooking(b._id)} style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--flame)', fontSize: 12, cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-body)' }}>Cancel</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@media(max-width:860px){.container > div[style*="grid-template-columns"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
};

export default ProfilePage;
