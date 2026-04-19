import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { GrabMarkIcon } from '../components/GrabMarkIcon';
import {
  formatDateTime,
  formatEventSchedule,
  eventDateToDatetimeLocalValue,
  datetimeLocalValueToEventIso,
  resolveEventImageUrl,
} from '../utils/helpers';
import {
  FaArrowRightFromBracket,
  FaBell,
  FaCalendarDays,
  FaChartPie,
  FaEnvelope,
  FaImage,
  FaPenToSquare,
  FaTicket,
  FaTrash,
  FaXmark,
} from 'react-icons/fa6';

const SIDEBAR = [
  { id: 'overview', label: 'Overview', icon: FaChartPie },
  { id: 'tickets', label: 'Ticket requests', icon: FaTicket },
  { id: 'contacts', label: 'Contact messages', icon: FaEnvelope },
  { id: 'events-manage', label: 'Event records', icon: FaCalendarDays },
];

/** Reads `Order ID: …` line saved from the public ticket request form */
function parseOrderIdFromNotes(notes) {
  if (!notes || typeof notes !== 'string') return '—';
  const m = notes.match(/Order ID:\s*([^\s\n]+)/i);
  return m ? m[1].trim() : '—';
}

function isTicketRequestNew(row) {
  return row.status !== 'reviewed';
}

const AdminDashboardPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [savingEvent, setSavingEvent] = useState(false);
  const [processingEventId, setProcessingEventId] = useState('');
  const [processingContactId, setProcessingContactId] = useState('');
  const [processingTicketReqId, setProcessingTicketReqId] = useState('');
  const [contacts, setContacts] = useState([]);
  const [ticketRequests, setTicketRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifWrapRef = useRef(null);
  const ticketRequestsRef = useRef([]);
  ticketRequestsRef.current = ticketRequests;

  const [editingEventId, setEditingEventId] = useState('');
  const [eventEditForm, setEventEditForm] = useState({
    title: '',
    category: 'Music',
    date: '',
    status: 'upcoming',
    venue: '',
    city: '',
    state: '',
    featured: false,
    dateComingSoon: false,
  });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [summaryRes, eventsRes, contactsRes, ticketReqRes] = await Promise.all([
        api.get('/admin/summary'),
        api.get('/admin/events'),
        api.get('/admin/contacts'),
        api.get('/admin/ticket-requests'),
      ]);
      setSummary(summaryRes.data.data);
      setEvents(eventsRes.data.data);
      setContacts(contactsRes.data.data);
      setTicketRequests(ticketReqRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const refreshTicketRequests = useCallback(async () => {
    try {
      const r = await api.get('/admin/ticket-requests');
      setTicketRequests(r.data.data);
    } catch {
      /* ignore — used by polling */
    }
  }, []);

  const dismissNotifications = useCallback(async () => {
    setNotifOpen(false);
    if (!ticketRequestsRef.current.some(isTicketRequestNew)) {
      await refreshTicketRequests();
      return;
    }
    try {
      try {
        await api.get(`/admin/notifications/clear-ticket-requests?_=${Date.now()}`);
      } catch (firstErr) {
        if (firstErr?.response?.status !== 404) throw firstErr;
        await api.post('/admin/ticket-requests/mark-reviewed', {});
      }
      await refreshTicketRequests();
    } catch (err) {
      if (err?.response?.status === 401) return;
      const body = err?.response?.data;
      const msg =
        (body && typeof body === 'object' && body.message) ||
        (typeof body === 'string' ? body.replace(/<[^>]+>/g, '').trim().slice(0, 120) : null);
      toast.error(msg || 'Could not clear notifications');
    }
  }, [refreshTicketRequests]);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      refreshTicketRequests();
    }, 30000);
    return () => clearInterval(id);
  }, [refreshTicketRequests]);

  useEffect(() => {
    if (!notifOpen) return undefined;
    const onDocClick = (e) => {
      if (notifWrapRef.current && !notifWrapRef.current.contains(e.target)) {
        dismissNotifications();
      }
    };
    // Capture phase so we never treat the Close button click as “outside” due to event ordering
    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [notifOpen, dismissNotifications]);

  useEffect(() => {
    if (!SIDEBAR.some((s) => s.id === activeSection)) setActiveSection('overview');
  }, [activeSection]);

  const startEditEvent = (event) => {
    setEditingEventId(event._id);
    setEventEditForm({
      title: event.title || '',
      category: event.category || 'Music',
      date: eventDateToDatetimeLocalValue(event.date),
      status: event.status || 'upcoming',
      venue: event.location?.venue || '',
      city: event.location?.city || '',
      state: event.location?.state || '',
      featured: Boolean(event.featured),
      dateComingSoon: Boolean(event.dateComingSoon),
    });
  };

  const cancelEditEvent = () => {
    setEditingEventId('');
    setEventEditForm({
      title: '',
      category: 'Music',
      date: '',
      status: 'upcoming',
      venue: '',
      city: '',
      state: '',
      featured: false,
      dateComingSoon: false,
    });
  };

  const saveEditedEvent = async (eventId) => {
    setSavingEvent(true);
    try {
      const dateIso = datetimeLocalValueToEventIso(eventEditForm.date);
      const payload = {
        title: eventEditForm.title,
        category: eventEditForm.category,
        status: eventEditForm.status,
        featured: eventEditForm.featured,
        dateComingSoon: Boolean(eventEditForm.dateComingSoon),
        location: {
          venue: eventEditForm.venue,
          city: eventEditForm.city,
          state: eventEditForm.state,
        },
      };
      if (dateIso !== undefined) payload.date = dateIso;
      await api.put(`/events/${eventId}`, payload);
      toast.success('Event updated');
      cancelEditEvent();
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update event');
    } finally {
      setSavingEvent(false);
    }
  };

  const deleteEventRecord = async (eventId) => {
    if (!window.confirm('Delete this event record?')) return;
    setProcessingEventId(eventId);
    try {
      await api.delete(`/events/${eventId}`);
      toast.success('Event deleted');
      if (editingEventId === eventId) cancelEditEvent();
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete event');
    } finally {
      setProcessingEventId('');
    }
  };

  const deleteContactRow = async (id) => {
    if (!window.confirm('Delete this contact message?')) return;
    setProcessingContactId(id);
    try {
      await api.delete(`/admin/contacts/${id}`);
      toast.success('Message deleted');
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    } finally {
      setProcessingContactId('');
    }
  };

  const deleteTicketRequestRow = async (id) => {
    if (!window.confirm('Delete this ticket request?')) return;
    setProcessingTicketReqId(id);
    try {
      await api.delete(`/admin/ticket-requests/${id}`);
      toast.success('Request deleted');
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    } finally {
      setProcessingTicketReqId('');
    }
  };

  const cardShell = {
    background: 'white',
    border: '1px solid var(--border-light)',
    borderRadius: 16,
    boxShadow: 'var(--shadow-sm)',
    padding: 20,
  };

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '70vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const newTicketRows = ticketRequests.filter(isTicketRequestNew);
  const newTicketCount = newTicketRows.length;

  return (
    <div className="admin-dash-layout" style={{ display: 'flex', flexWrap: 'wrap', minHeight: '100vh', background: 'var(--cloud)' }}>
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: 'var(--ink)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 14px',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          minHeight: '100vh',
        }}
      >
        <div style={{ marginBottom: 28, padding: '0 8px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
            Grab It <span style={{ color: '#FF3B2F' }}>Hot</span>
            <GrabMarkIcon style={{ marginLeft: 2 }} />
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6, letterSpacing: '0.04em' }}>Admin dashboard</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minHeight: 0 }}>
          {SIDEBAR.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  background: active ? 'rgba(255,59,47,0.22)' : 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.78)',
                  borderLeft: active ? '3px solid #FF3B2F' : '3px solid transparent',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <span style={{ fontSize: 18, opacity: active ? 1 : 0.85, display: 'inline-flex' }}><Icon /></span>
                {label}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/admin/login', { replace: true });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,59,47,0.15)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            <FaArrowRightFromBracket /> Log out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', padding: '28px 28px 48px' }}>
        <header style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--ink)', marginBottom: 6 }}>
              {SIDEBAR.find((s) => s.id === activeSection)?.label || 'Dashboard'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
              {activeSection === 'overview' && 'Key metrics and recent activity.'}
              {activeSection === 'tickets' && 'Buyer details and ticket request info.'}
              {activeSection === 'contacts' && 'Messages from the public contact form.'}
              {activeSection === 'events-manage' && 'Edit or remove event listings.'}
            </p>
          </div>

          <div ref={notifWrapRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                if (notifOpen) dismissNotifications();
                else setNotifOpen(true);
              }}
              aria-expanded={notifOpen}
              aria-label="Ticket request notifications"
              style={{
                position: 'relative',
                width: 46,
                height: 46,
                borderRadius: 12,
                border: '1px solid var(--border-light)',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <FaBell style={{ fontSize: 20 }} />
              {newTicketCount > 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 22,
                    height: 22,
                    padding: '0 6px',
                    borderRadius: 999,
                    background: 'var(--flame)',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                  }}
                >
                  {newTicketCount > 99 ? '99+' : newTicketCount}
                </span>
              ) : null}
            </button>

            {notifOpen ? (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  width: 360,
                  maxWidth: 'min(360px, calc(100vw - 48px))',
                  background: 'white',
                  border: '1px solid var(--border-light)',
                  borderRadius: 14,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Ticket requests</span>
                  <button
                    type="button"
                    onClick={() => dismissNotifications()}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    <FaXmark style={{ marginRight: 4 }} /> Close
                  </button>
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {newTicketRows.length === 0 ? (
                    <p style={{ margin: 0, padding: '18px 16px', color: 'var(--text-muted)', fontSize: 14 }}>No new ticket requests.</p>
                  ) : (
                    newTicketRows.slice(0, 20).map((row) => (
                      <button
                        key={row._id}
                        type="button"
                        onClick={() => {
                          setActiveSection('tickets');
                          dismissNotifications();
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 16px',
                          border: 'none',
                          borderBottom: '1px solid var(--border-light)',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{row.fullName}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{row.eventTitle || row.event?.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                          {formatDateTime(row.createdAt)}
                          {' · '}
                          <span style={{ fontFamily: 'ui-monospace, monospace' }}>{parseOrderIdFromNotes(row.notes)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <div style={{ display: activeSection === 'overview' ? 'block' : 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Events', value: summary?.metrics?.totalEvents || 0, icon: <FaCalendarDays /> },
              { label: 'Contact messages', value: summary?.metrics?.contactMessages || 0, icon: <FaEnvelope /> },
              { label: 'Ticket requests', value: summary?.metrics?.ticketRequests || 0, icon: <FaImage /> },
            ].map((card) => (
              <div key={card.label} style={{ ...cardShell, padding: '16px 18px' }}>
                <div style={{ color: 'var(--flame)', marginBottom: 10 }}>{card.icon}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{card.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{card.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            <div style={cardShell}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 12 }}>Recent events</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {events.slice(0, 8).map((event) => (
                  <div key={event._id} style={{ display: 'flex', gap: 12, border: '1px solid var(--border-light)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                    <img
                      src={resolveEventImageUrl(event.image)}
                      alt=""
                      style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-light)' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200'; }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{event.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{event.location?.city}, {event.location?.state}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>{formatEventSchedule(event)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: activeSection === 'tickets' ? 'block' : 'none' }}>
          <div style={{ ...cardShell, overflowX: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 12 }}>Ticket purchase requests</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--smoke-deep)' }}>
                  <th style={{ padding: '10px 8px' }}>Received</th>
                  <th style={{ padding: '10px 8px' }}>Buyer</th>
                  <th style={{ padding: '10px 8px' }}>Contact</th>
                  <th style={{ padding: '10px 8px' }}>Event</th>
                  <th style={{ padding: '10px 8px' }}>Order ID</th>
                  <th style={{ padding: '10px 8px' }}>Tier / Qty</th>
                  <th style={{ padding: '10px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ticketRequests.slice(0, 60).map((row) => (
                  <tr key={row._id} style={{ borderBottom: '1px solid var(--border-light)', verticalAlign: 'top' }}>
                    <td style={{ padding: '10px 8px', fontSize: 13 }}>{formatDateTime(row.createdAt)}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.fullName}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13 }}>
                      <div>{row.email}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{row.phone}</div>
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: 13 }}>{row.eventTitle || row.event?.title}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13, fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: 'var(--ink)' }}>
                      {parseOrderIdFromNotes(row.notes)}
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: 13 }}>
                      {row.tierName}
                      <div style={{ color: 'var(--text-muted)' }}>× {row.quantity}</div>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <button type="button" className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12, color: '#B42318', borderColor: 'rgba(180,35,24,0.35)' }} disabled={processingTicketReqId === row._id} onClick={() => deleteTicketRequestRow(row._id)}>
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ticketRequests.length === 0 && <p style={{ color: 'var(--text-muted)', padding: 12 }}>No ticket requests yet.</p>}
          </div>
        </div>

        <div style={{ display: activeSection === 'contacts' ? 'block' : 'none' }}>
          <div style={{ ...cardShell, overflowX: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 12 }}>Contact form messages</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--smoke-deep)' }}>
                  <th style={{ padding: '10px 8px' }}>Received</th>
                  <th style={{ padding: '10px 8px' }}>Name</th>
                  <th style={{ padding: '10px 8px' }}>Email</th>
                  <th style={{ padding: '10px 8px' }}>Message</th>
                  <th style={{ padding: '10px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.slice(0, 60).map((c) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px 8px', fontSize: 13 }}>{formatDateTime(c.createdAt)}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13 }}>{c.email}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13, maxWidth: 360, whiteSpace: 'pre-wrap' }}>{c.message}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <button type="button" className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12, color: '#B42318', borderColor: 'rgba(180,35,24,0.35)' }} disabled={processingContactId === c._id} onClick={() => deleteContactRow(c._id)}>
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contacts.length === 0 && <p style={{ color: 'var(--text-muted)', padding: 12 }}>No messages yet.</p>}
          </div>
        </div>

        <div style={{ display: activeSection === 'events-manage' ? 'block' : 'none' }}>
          <div style={{ ...cardShell, overflowX: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 12 }}>Event records</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--smoke-deep)' }}>
                  <th style={{ padding: '10px 8px' }}>Image</th>
                  <th style={{ padding: '10px 8px' }}>Title</th>
                  <th style={{ padding: '10px 8px' }}>Category</th>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                  <th style={{ padding: '10px 8px' }}>City</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px' }}>Featured</th>
                  <th style={{ padding: '10px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 40).map((event) => (
                  <React.Fragment key={event._id}>
                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px 8px' }}>
                        <img src={resolveEventImageUrl(event.image)} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200'; }} />
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{event.title}</td>
                      <td style={{ padding: '10px 8px' }}>{event.category}</td>
                      <td style={{ padding: '10px 8px' }}>{formatEventSchedule(event)}</td>
                      <td style={{ padding: '10px 8px' }}>{event.location?.city}, {event.location?.state}</td>
                      <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{event.status}</td>
                      <td style={{ padding: '10px 8px' }}>{event.featured ? 'Yes' : 'No'}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => startEditEvent(event)} className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12 }}><FaPenToSquare /> Edit</button>
                          <button type="button" onClick={() => deleteEventRecord(event._id)} disabled={processingEventId === event._id} className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12, color: '#B42318', borderColor: 'rgba(180,35,24,0.35)' }}><FaTrash /> Delete</button>
                        </div>
                      </td>
                    </tr>
                    {editingEventId === event._id && (
                      <tr style={{ borderBottom: '1px solid var(--border-light)', background: '#FCFCFC' }}>
                        <td colSpan={8} style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 }}>
                            <input className="form-input" value={eventEditForm.title} onChange={(e) => setEventEditForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" />
                            <select className="form-input" value={eventEditForm.category} onChange={(e) => setEventEditForm((p) => ({ ...p, category: e.target.value }))}>
                              {['Music', 'Comedy', 'Tech', 'Sports', 'Arts', 'Food', 'Business', 'Other'].map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input className="form-input" type="datetime-local" value={eventEditForm.date} onChange={(e) => setEventEditForm((p) => ({ ...p, date: e.target.value }))} />
                            <input className="form-input" value={eventEditForm.venue} onChange={(e) => setEventEditForm((p) => ({ ...p, venue: e.target.value }))} placeholder="Venue" />
                            <input className="form-input" value={eventEditForm.city} onChange={(e) => setEventEditForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" />
                            <input className="form-input" value={eventEditForm.state} onChange={(e) => setEventEditForm((p) => ({ ...p, state: e.target.value }))} placeholder="State" />
                            <select className="form-input" value={eventEditForm.status} onChange={(e) => setEventEditForm((p) => ({ ...p, status: e.target.value }))}>
                              {['upcoming', 'ongoing', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                              <input type="checkbox" checked={eventEditForm.featured} onChange={(e) => setEventEditForm((p) => ({ ...p, featured: e.target.checked }))} />
                              Featured
                            </label>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                              <input type="checkbox" checked={eventEditForm.dateComingSoon} onChange={(e) => setEventEditForm((p) => ({ ...p, dateComingSoon: e.target.checked }))} />
                              Date/time: Coming soon
                            </label>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button type="button" className="btn btn-primary" disabled={savingEvent} onClick={() => saveEditedEvent(event._id)} style={{ padding: '8px 14px', fontSize: 13 }}>{savingEvent ? 'Saving...' : 'Save changes'}</button>
                            <button type="button" className="btn btn-outline" onClick={cancelEditEvent} style={{ padding: '8px 14px', fontSize: 13 }}><FaXmark /> Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <style>{`
        @media (max-width: 900px) {
          .admin-dash-layout { flex-direction: column !important; }
          .admin-dash-layout aside { width: 100% !important; min-height: auto !important; position: relative !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardPage;
