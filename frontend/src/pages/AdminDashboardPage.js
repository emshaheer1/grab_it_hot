import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { GrabMarkIcon } from '../components/GrabMarkIcon';
import {
  formatDateTime,
  formatEventSchedule,
  formatEventLocationOneLine,
  formatCurrency,
  eventDateToDatetimeLocalValue,
  datetimeLocalValueToEventIso,
  resolveEventImageUrl,
} from '../utils/helpers';
import {
  FaArrowRightFromBracket,
  FaBell,
  FaCalendarDays,
  FaChartPie,
  FaChevronDown,
  FaDownload,
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

const TICKETS_PAGE_SIZE = 15;

function TicketPagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        Page {page} of {totalPages} · {total} request{total === 1 ? '' : 's'}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: 13 }}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: 13 }}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function navButtonStyle(active) {
  return {
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
    width: '100%',
    background: active ? 'rgba(255,59,47,0.22)' : 'transparent',
    color: active ? 'white' : 'rgba(255,255,255,0.78)',
    borderLeft: active ? '3px solid #FF3B2F' : '3px solid transparent',
    transition: 'background 0.15s, color 0.15s',
  };
}

/** Reads `Order ID: …` line saved from the public ticket request form */
function parseOrderIdFromNotes(notes) {
  if (!notes || typeof notes !== 'string') return '—';
  const m = notes.match(/Order ID:\s*([^\s\n]+)/i);
  return m ? m[1].trim() : '—';
}

function isTicketRequestNew(row) {
  return row.status !== 'reviewed';
}

function eventIdFromTicketRow(row) {
  if (!row) return '';
  if (row.event && typeof row.event === 'object' && row.event._id) return String(row.event._id);
  if (row.event) return String(row.event);
  return '';
}

/** Group new ticket requests by event for badges / notification list */
function groupNewTicketsByEvent(rows) {
  const map = new Map();
  for (const row of rows) {
    const eventId = eventIdFromTicketRow(row) || 'unknown';
    const existing = map.get(eventId);
    if (!existing) {
      map.set(eventId, {
        eventId,
        eventTitle: row.eventTitle || row.event?.title || 'Unknown event',
        count: 1,
        latestAt: row.createdAt,
      });
    } else {
      existing.count += 1;
      if (new Date(row.createdAt) > new Date(existing.latestAt)) {
        existing.latestAt = row.createdAt;
        existing.eventTitle = row.eventTitle || row.event?.title || existing.eventTitle;
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.latestAt) - new Date(a.latestAt));
}

function NewRequestDot({ size = 8, title = 'New ticket request' }) {
  return (
    <span
      title={title}
      aria-label={title}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#FF3B2F',
        display: 'inline-block',
        flexShrink: 0,
        boxShadow: '0 0 0 3px rgba(255,59,47,0.22)',
      }}
    />
  );
}

function NewCountBadge({ count }) {
  if (!count) return null;
  return (
    <span
      style={{
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 999,
        background: '#FF3B2F',
        color: 'white',
        fontSize: 11,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
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
  const [newTicketRequests, setNewTicketRequests] = useState([]);
  const [ticketGroups, setTicketGroups] = useState([]);
  const [ticketsMenuOpen, setTicketsMenuOpen] = useState(false);
  const [selectedTicketEventId, setSelectedTicketEventId] = useState('');
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketRows, setTicketRows] = useState([]);
  const [ticketPagination, setTicketPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loadingTicketRows, setLoadingTicketRows] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifWrapRef = useRef(null);
  const newTicketRequestsRef = useRef([]);
  newTicketRequestsRef.current = newTicketRequests;

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
    ticketTiers: [],
  });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [summaryRes, eventsRes, contactsRes, ticketReqRes, groupsRes] = await Promise.all([
        api.get('/admin/summary'),
        api.get('/admin/events'),
        api.get('/admin/contacts'),
        api.get('/admin/ticket-requests', { params: { status: 'new', limit: 100 } }),
        api.get('/admin/ticket-requests/groups'),
      ]);
      setSummary(summaryRes.data.data);
      setEvents(eventsRes.data.data);
      setContacts(contactsRes.data.data);
      setNewTicketRequests(ticketReqRes.data.data);
      setTicketGroups(groupsRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const refreshNewTicketRequests = useCallback(async () => {
    try {
      const [ticketRes, groupsRes] = await Promise.all([
        api.get('/admin/ticket-requests', { params: { status: 'new', limit: 200 } }),
        api.get('/admin/ticket-requests/groups'),
      ]);
      setNewTicketRequests(ticketRes.data.data);
      setTicketGroups(groupsRes.data.data || []);
    } catch {
      /* ignore — used by polling */
    }
  }, []);

  const loadTicketGroups = useCallback(async () => {
    const r = await api.get('/admin/ticket-requests/groups');
    const groups = r.data.data || [];
    setTicketGroups(groups);
    return groups;
  }, []);

  const markEventTicketsReviewed = useCallback(async (eventId) => {
    if (!eventId) return;
    try {
      await api.get(`/admin/notifications/clear-ticket-requests`, {
        params: { eventId, _: Date.now() },
      });
    } catch (firstErr) {
      if (firstErr?.response?.status === 404) {
        await api.post('/admin/ticket-requests/mark-reviewed', { eventId });
      }
    }
    await refreshNewTicketRequests();
  }, [refreshNewTicketRequests]);

  const loadSelectedEventTickets = useCallback(async (eventId, page = 1) => {
    if (!eventId) {
      setTicketRows([]);
      setTicketPagination({ page: 1, totalPages: 1, total: 0 });
      return;
    }
    setLoadingTicketRows(true);
    try {
      const res = await api.get('/admin/ticket-requests', {
        params: { eventId, page, limit: TICKETS_PAGE_SIZE },
      });
      setTicketRows(res.data.data || []);
      setTicketPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load ticket requests');
    } finally {
      setLoadingTicketRows(false);
    }
  }, []);

  const reloadTicketSectionData = useCallback(async () => {
    const groups = await loadTicketGroups();
    if (selectedTicketEventId && !groups.some((g) => String(g.eventId) === String(selectedTicketEventId))) {
      setSelectedTicketEventId('');
      setTicketRows([]);
      setTicketPagination({ page: 1, totalPages: 1, total: 0 });
      return;
    }
    if (selectedTicketEventId) {
      await loadSelectedEventTickets(selectedTicketEventId, ticketPage);
    }
  }, [loadTicketGroups, loadSelectedEventTickets, selectedTicketEventId, ticketPage]);

  const openTicketEvent = (eventId) => {
    const id = String(eventId);
    // Keep "new" status so dots show in the table; clear previous event when switching away
    if (selectedTicketEventId && selectedTicketEventId !== id) {
      markEventTicketsReviewed(selectedTicketEventId);
    }
    setActiveSection('tickets');
    setTicketsMenuOpen(true);
    setSelectedTicketEventId(id);
    setTicketPage(1);
  };

  const dismissNotifications = useCallback(async () => {
    setNotifOpen(false);
    if (!newTicketRequestsRef.current.some(isTicketRequestNew)) {
      await refreshNewTicketRequests();
      return;
    }
    try {
      try {
        await api.get(`/admin/notifications/clear-ticket-requests?_=${Date.now()}`);
      } catch (firstErr) {
        if (firstErr?.response?.status !== 404) throw firstErr;
        await api.post('/admin/ticket-requests/mark-reviewed', {});
      }
      await refreshNewTicketRequests();
    } catch (err) {
      if (err?.response?.status === 401) return;
      const body = err?.response?.data;
      const msg =
        (body && typeof body === 'object' && body.message) ||
        (typeof body === 'string' ? body.replace(/<[^>]+>/g, '').trim().slice(0, 120) : null);
      toast.error(msg || 'Could not clear notifications');
    }
  }, [refreshNewTicketRequests]);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      refreshNewTicketRequests();
    }, 30000);
    return () => clearInterval(id);
  }, [refreshNewTicketRequests]);

  useEffect(() => {
    if (activeSection !== 'tickets' || !selectedTicketEventId) return;
    loadSelectedEventTickets(selectedTicketEventId, ticketPage);
  }, [activeSection, selectedTicketEventId, ticketPage, loadSelectedEventTickets]);

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
      ticketTiers: (event.ticketTiers || []).map((t) => ({
        _id: t._id,
        name: t.name || '',
        price: t.price ?? '',
        salePrice: t.salePrice ?? '',
        capacity: t.capacity ?? 0,
        sold: t.sold ?? 0,
        description: t.description || '',
      })),
    });
  };

  const updateEventTierField = (tierId, field, value) => {
    setEventEditForm((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map((tier) => (
        tier._id === tierId ? { ...tier, [field]: value } : tier
      )),
    }));
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
      ticketTiers: [],
    });
  };

  const saveEditedEvent = async (eventId) => {
    for (const tier of eventEditForm.ticketTiers) {
      const list = Number(tier.price);
      const hasSale = tier.salePrice !== '' && tier.salePrice != null;
      const sale = hasSale ? Number(tier.salePrice) : list;
      if (Number.isNaN(list) || list < 0) {
        toast.error(`Invalid cut price for ${tier.name || 'ticket tier'}`);
        return;
      }
      if (hasSale && (Number.isNaN(sale) || sale < 0)) {
        toast.error(`Invalid sale price for ${tier.name || 'ticket tier'}`);
        return;
      }
      if (hasSale && sale > list) {
        toast.error(`Sale price cannot be higher than cut price for ${tier.name || 'ticket tier'}`);
        return;
      }
    }

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
        ticketTiers: eventEditForm.ticketTiers.map((tier) => ({
          _id: tier._id,
          name: tier.name,
          price: Number(tier.price),
          salePrice: tier.salePrice === '' || tier.salePrice == null ? undefined : Number(tier.salePrice),
          capacity: tier.capacity,
          sold: tier.sold,
          description: tier.description,
        })),
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
      await refreshNewTicketRequests();
      await reloadTicketSectionData();
      if (activeSection !== 'tickets') loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    } finally {
      setProcessingTicketReqId('');
    }
  };

  const downloadTicketRequestsCsv = async () => {
    setDownloadingCsv(true);
    try {
      const params = {};
      if (selectedTicketEventId) params.eventId = selectedTicketEventId;

      const res = await api.get('/admin/ticket-requests/export', {
        params,
        responseType: 'blob',
      });

      const contentType = String(res.headers['content-type'] || '');
      if (contentType.includes('application/json')) {
        const text = await res.data.text();
        const body = JSON.parse(text);
        throw new Error(body.message || 'Could not download CSV');
      }

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const group = ticketGroups.find((g) => String(g.eventId) === String(selectedTicketEventId));
      const eventSlug = group
        ? group.eventTitle.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
        : 'all-events';
      link.href = url;
      link.download = `ticket-requests-${eventSlug}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Full ticket request data downloaded');
    } catch (err) {
      let message = err.message || 'Could not download CSV';
      const data = err.response?.data;
      if (data instanceof Blob) {
        try {
          const body = JSON.parse(await data.text());
          if (body.message) message = body.message;
        } catch {
          /* keep default */
        }
      } else if (data?.message) {
        message = data.message;
      }
      toast.error(message);
    } finally {
      setDownloadingCsv(false);
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

  const newTicketRows = newTicketRequests.filter(isTicketRequestNew);
  const newTicketCount = newTicketRows.length;
  const newTicketsByEvent = groupNewTicketsByEvent(newTicketRows);
  const newCountByEventId = Object.fromEntries(
    newTicketsByEvent.map((g) => [String(g.eventId), g.count])
  );
  const selectedTicketGroup = ticketGroups.find((g) => String(g.eventId) === String(selectedTicketEventId));
  const ticketsSectionActive = activeSection === 'tickets';

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

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {SIDEBAR.map(({ id, label, icon: Icon }) => {
            if (id === 'tickets') {
              return (
                <div key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection('tickets');
                      setTicketsMenuOpen((open) => !open);
                      loadTicketGroups();
                      refreshNewTicketRequests();
                    }}
                    style={navButtonStyle(ticketsSectionActive)}
                    aria-expanded={ticketsMenuOpen}
                  >
                    <span style={{ fontSize: 18, opacity: ticketsSectionActive ? 1 : 0.85, display: 'inline-flex', position: 'relative' }}>
                      <Icon />
                      {newTicketCount > 0 ? (
                        <span style={{ position: 'absolute', top: -2, right: -4 }}>
                          <NewRequestDot size={7} />
                        </span>
                      ) : null}
                    </span>
                    <span style={{ flex: 1 }}>{label}</span>
                    <NewCountBadge count={newTicketCount} />
                    <FaChevronDown
                      style={{
                        fontSize: 12,
                        opacity: 0.75,
                        transform: ticketsMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s',
                      }}
                    />
                  </button>
                  {ticketsMenuOpen ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '4px 0 8px 12px', paddingLeft: 8, borderLeft: '1px solid rgba(255,255,255,0.12)' }}>
                      {ticketGroups.length === 0 ? (
                        <div style={{ padding: '8px 12px', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                          No event requests yet
                        </div>
                      ) : (
                        ticketGroups.map((group) => {
                          const eventActive = ticketsSectionActive && String(selectedTicketEventId) === String(group.eventId);
                          const eventNewCount = newCountByEventId[String(group.eventId)] || 0;
                          return (
                            <button
                              key={group.eventId}
                              type="button"
                              onClick={() => openTicketEvent(group.eventId)}
                              title={group.eventTitle}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                width: '100%',
                                textAlign: 'left',
                                padding: '9px 12px',
                                borderRadius: 8,
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 12,
                                fontWeight: eventActive ? 700 : 500,
                                lineHeight: 1.35,
                                background: eventActive ? 'rgba(255,59,47,0.28)' : 'transparent',
                                color: eventActive ? 'white' : 'rgba(255,255,255,0.7)',
                              }}
                            >
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {eventNewCount > 0 ? <NewRequestDot size={7} /> : null}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {group.eventTitle}
                                  </span>
                                </span>
                                <span style={{ display: 'block', marginTop: 2, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
                                  {group.total} request{group.total === 1 ? '' : 's'}
                                  {eventNewCount > 0 ? ` · ${eventNewCount} new` : ''}
                                </span>
                              </span>
                              <NewCountBadge count={eventNewCount} />
                            </button>
                          );
                        })
                      )}
                    </div>
                  ) : null}
                </div>
              );
            }

            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (selectedTicketEventId) markEventTicketsReviewed(selectedTicketEventId);
                  setActiveSection(id);
                  setTicketsMenuOpen(false);
                }}
                style={navButtonStyle(active)}
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
              {ticketsSectionActive && selectedTicketGroup
                ? selectedTicketGroup.eventTitle
                : SIDEBAR.find((s) => s.id === activeSection)?.label || 'Dashboard'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>
              {activeSection === 'overview' && 'Key metrics and recent activity.'}
              {ticketsSectionActive && !selectedTicketGroup && 'Choose an event from the sidebar to view its ticket requests.'}
              {ticketsSectionActive && selectedTicketGroup && 'Buyer details and ticket request info for this event.'}
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
                  <span style={{ fontWeight: 700, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    New ticket requests
                    {newTicketCount > 0 ? <NewCountBadge count={newTicketCount} /> : null}
                  </span>
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
                  {newTicketsByEvent.length === 0 ? (
                    <p style={{ margin: 0, padding: '18px 16px', color: 'var(--text-muted)', fontSize: 14 }}>No new ticket requests.</p>
                  ) : (
                    newTicketsByEvent.map((group) => (
                      <button
                        key={group.eventId}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          openTicketEvent(group.eventId);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          width: '100%',
                          textAlign: 'left',
                          padding: '14px 16px',
                          border: 'none',
                          borderBottom: '1px solid var(--border-light)',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <NewRequestDot size={10} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                            {group.count} new
                          </span>
                          <span style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {group.eventTitle}
                          </span>
                          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                            Latest {formatDateTime(group.latestAt)}
                          </span>
                        </span>
                        <NewCountBadge count={group.count} />
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
              { label: 'Ticket requests', value: summary?.metrics?.ticketRequests || 0, icon: <FaImage />, showNew: true },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  ...cardShell,
                  padding: '16px 18px',
                  position: 'relative',
                  cursor: card.showNew ? 'pointer' : 'default',
                }}
                onClick={card.showNew ? () => { setActiveSection('tickets'); setTicketsMenuOpen(true); refreshNewTicketRequests(); } : undefined}
                onKeyDown={undefined}
                role={card.showNew ? 'button' : undefined}
              >
                {card.showNew && newTicketCount > 0 ? (
                  <span style={{ position: 'absolute', top: 14, right: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <NewRequestDot size={9} />
                    <NewCountBadge count={newTicketCount} />
                  </span>
                ) : null}
                <div style={{ color: 'var(--flame)', marginBottom: 10 }}>{card.icon}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{card.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{card.value}</div>
                {card.showNew && newTicketsByEvent.length > 0 ? (
                  <div style={{ marginTop: 10, display: 'grid', gap: 4 }}>
                    {newTicketsByEvent.slice(0, 3).map((g) => (
                      <div key={g.eventId} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <NewRequestDot size={6} />
                        <span style={{ fontWeight: 700, color: 'var(--flame)' }}>{g.count}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.eventTitle}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
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
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.4 }}>
                        {formatEventLocationOneLine(event.location) || `${event.location?.city}, ${event.location?.state}`}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>{formatEventSchedule(event)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: ticketsSectionActive ? 'block' : 'none' }}>
          <div style={{ ...cardShell, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 6 }}>
                  {selectedTicketGroup ? selectedTicketGroup.eventTitle : 'Ticket purchase requests'}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
                  {selectedTicketGroup
                    ? `${selectedTicketGroup.total} request${selectedTicketGroup.total === 1 ? '' : 's'} for this event`
                    : 'Select an event from the sidebar dropdown'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '10px 18px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                disabled={downloadingCsv || ticketGroups.length === 0}
                onClick={downloadTicketRequestsCsv}
              >
                <FaDownload /> {downloadingCsv ? 'Downloading…' : 'Download CSV'}
              </button>
            </div>
          </div>

          {!selectedTicketEventId ? (
            <div style={cardShell}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                {ticketGroups.length === 0
                  ? 'No ticket requests yet.'
                  : 'Open Ticket requests in the sidebar and choose an event to view its requests.'}
              </p>
            </div>
          ) : (
            <div style={{ ...cardShell, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--smoke-deep)' }}>
                    <th style={{ padding: '10px 8px', width: 36 }} aria-label="New" />
                    <th style={{ padding: '10px 8px' }}>Received</th>
                    <th style={{ padding: '10px 8px' }}>Buyer</th>
                    <th style={{ padding: '10px 8px' }}>Contact</th>
                    <th style={{ padding: '10px 8px' }}>Order ID</th>
                    <th style={{ padding: '10px 8px' }}>Tier / Qty</th>
                    <th style={{ padding: '10px 8px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTicketRows ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</td>
                    </tr>
                  ) : ticketRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No requests for this event.</td>
                    </tr>
                  ) : (
                    ticketRows.map((row) => {
                      const isNew = isTicketRequestNew(row);
                      return (
                        <tr
                          key={row._id}
                          style={{
                            borderBottom: '1px solid var(--border-light)',
                            verticalAlign: 'top',
                            background: isNew ? 'rgba(255,59,47,0.06)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '12px 8px', width: 36, textAlign: 'center' }}>
                            {isNew ? <NewRequestDot size={9} title="New ticket request" /> : null}
                          </td>
                          <td style={{ padding: '10px 8px', fontSize: 13 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span>{formatDateTime(row.createdAt)}</span>
                              {isNew ? (
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#FF3B2F', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                  New
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.fullName}</td>
                          <td style={{ padding: '10px 8px', fontSize: 13 }}>
                            <div>{row.email}</div>
                            <div style={{ color: 'var(--text-muted)' }}>{row.phone}</div>
                          </td>
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
                      );
                    })
                  )}
                </tbody>
              </table>

              <TicketPagination
                page={ticketPage}
                totalPages={ticketPagination.totalPages || 1}
                total={ticketPagination.total || 0}
                onPageChange={setTicketPage}
              />
            </div>
          )}
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
                  <th style={{ padding: '10px 8px' }}>Location</th>
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
                      <td style={{ padding: '10px 8px', maxWidth: 280, fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {formatEventLocationOneLine(event.location) || `${event.location?.city}, ${event.location?.state}`}
                      </td>
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

                          {eventEditForm.ticketTiers.length > 0 ? (
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--ink)' }}>
                                Ticket prices
                              </div>
                              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                Cut price is shown struck through on the site. Sale price is what customers pay.
                              </p>
                              <div style={{ display: 'grid', gap: 12 }}>
                                {eventEditForm.ticketTiers.map((tier) => (
                                  <div
                                    key={tier._id}
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
                                      gap: 10,
                                      alignItems: 'end',
                                      padding: '12px 14px',
                                      borderRadius: 10,
                                      border: '1px solid var(--border-light)',
                                      background: 'white',
                                    }}
                                  >
                                    <div style={{ gridColumn: '1 / -1', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                                      {tier.name}
                                      {tier.capacity ? (
                                        <span style={{ fontWeight: 500, color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>
                                          ({Math.max(0, tier.capacity - (tier.sold || 0))} left)
                                        </span>
                                      ) : null}
                                    </div>
                                    <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                                      Cut price ($)
                                      <input
                                        className="form-input"
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={tier.price}
                                        onChange={(e) => updateEventTierField(tier._id, 'price', e.target.value)}
                                      />
                                    </label>
                                    <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                                      Sale price ($)
                                      <input
                                        className="form-input"
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={tier.salePrice}
                                        placeholder={tier.price === '' ? 'Same as cut price' : String(tier.price)}
                                        onChange={(e) => updateEventTierField(tier._id, 'salePrice', e.target.value)}
                                      />
                                    </label>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingBottom: 10 }}>
                                      {tier.salePrice !== '' && tier.salePrice != null && Number(tier.salePrice) < Number(tier.price) ? (
                                        <>
                                          Preview:{' '}
                                          <span style={{ textDecoration: 'line-through' }}>{formatCurrency(tier.price)}</span>
                                          {' → '}
                                          <strong style={{ color: 'var(--flame)' }}>{formatCurrency(tier.salePrice)}</strong>
                                        </>
                                      ) : (
                                        <>Preview: <strong>{formatCurrency(tier.price || 0)}</strong></>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

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
