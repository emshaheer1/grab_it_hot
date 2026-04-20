import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { formatCurrency, formatEventSchedule } from '../utils/helpers';
import { FaCalendarDays, FaLocationDot, FaTicket } from 'react-icons/fa6';

const ZELLE_EMAIL = 'Payment@melodysounds.net';

/** Farhan show: $10 off each ticket on Zelle request flow only (no service fee). */
const FARHAN_ZELLE_DISCOUNT_PER_TICKET = 10;

function isFarhanEvent(ev) {
  return Boolean(ev && /farhan/i.test(String(ev.title || '')));
}

function makeOrderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  let suffix = '';
  for (let i = 0; i < 6; i += 1) suffix += chars[buf[i] % chars.length];
  return `GH-${suffix}`;
}

const RequestTicketsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tierId, setTierId] = useState(location.state?.tierId || '');
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [eventId]);

  useEffect(() => {
    api
      .get(`/events/${eventId}`)
      .then((r) => {
        const ev = r.data.data;
        setEvent(ev);
        const initial = location.state?.tierId || ev.ticketTiers?.[0]?._id;
        setTierId(initial || '');
      })
      .catch(() => {
        toast.error('Event not found');
        navigate({ pathname: '/', hash: 'featured-events' });
      })
      .finally(() => setLoading(false));
  }, [eventId, navigate, location.state?.tierId]);

  useEffect(() => {
    if (loading || !event?.dateComingSoon) return;
    toast.info('Ticket requests are not open yet — this event is coming soon.');
    navigate(`/event/${eventId}`, { replace: true });
  }, [loading, event, eventId, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!tierId) {
      toast.error('Select a ticket type');
      return;
    }
    if (!orderId) {
      toast.error('Please generate your order ID before submitting');
      return;
    }
    setSubmitting(true);
    try {
      const tierNow = event.ticketTiers?.find((t) => t._id === tierId);
      const listTotal = tierNow ? tierNow.price * quantity : 0;
      const zelleDue = isFarhanEvent(event) && tierNow
        ? Math.max(0, tierNow.price - FARHAN_ZELLE_DISCOUNT_PER_TICKET) * quantity
        : listTotal;
      const notesForAdmin = isFarhanEvent(event)
        ? `Order ID: ${orderId}\nZelle payee: ${ZELLE_EMAIL}\nZelle amount due: ${formatCurrency(zelleDue)}\nList: ${formatCurrency(listTotal)} — $10/ticket discount, no service fee (Farhan only)`
        : `Order ID: ${orderId}\nZelle payee: ${ZELLE_EMAIL}\nEstimated total: ${formatCurrency(listTotal)}`;
      await api.post('/ticket-requests', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        eventId,
        tierId,
        quantity,
        notes: notesForAdmin,
      });
      toast.success('Request submitted. Our team will confirm your tickets.');
      navigate(`/event/${eventId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }
  if (!event) return null;

  if (event.dateComingSoon) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const tier = event.ticketTiers?.find((t) => t._id === tierId);

  return (
    <div style={{ background: 'var(--cloud)', minHeight: '100vh', padding: '40px 0 72px' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <Link to={`/event/${event._id}`} style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, display: 'inline-block' }}>
          ← Back to event
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,36px)', fontWeight: 900, marginBottom: 8 }}>Request tickets</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, maxWidth: 520 }}>
          Complete the form with your details and generated order ID. We will match your Zelle payment and confirm your tickets.
        </p>

        <div style={{ background: 'var(--smoke)', borderRadius: 'var(--r-lg)', padding: 20, marginBottom: 28, border: '1px solid var(--border-light)' }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{event.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FaCalendarDays /> {formatEventSchedule(event)}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FaLocationDot /> {event.location?.venue}, {event.location?.city}
            </span>
          </div>
        </div>

        <form onSubmit={submit} style={{ background: 'white', borderRadius: 'var(--r-xl)', padding: '36px 32px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="form-field">
            <label className="form-label">Ticket type</label>
            <select className="form-input" value={tierId} onChange={(e) => setTierId(e.target.value)} required>
              {event.ticketTiers?.map((t) => {
                const avail = t.capacity - t.sold;
                return (
                  <option key={t._id} value={t._id} disabled={avail <= 0}>
                    {t.name} — {formatCurrency(t.price)}{avail <= 0 ? ' (sold out)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Quantity</label>
            <input className="form-input" type="number" min={1} max={50} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} />
          </div>
          <div className="form-field">
            <label className="form-label">Full name</label>
            <input className="form-input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Phone</label>
            <input className="form-input" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Order ID</label>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.55 }}>
              Please generate an order ID. You will use it when you pay so we can match your payment to this request.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setOrderId(makeOrderId())}
                style={{ padding: '10px 20px', fontSize: 14 }}
              >
                Generate order ID
              </button>
              {orderId ? (
                <code style={{
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  background: 'var(--smoke)',
                  padding: '10px 14px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border-light)',
                }}
                >
                  {orderId}
                </code>
              ) : null}
            </div>
            {orderId ? (
              <div style={{
                background: '#F0F7FF',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--r-lg)',
                padding: '16px 18px',
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
              }}
              >
                <p style={{ margin: '0 0 10px' }}>
                  <strong style={{ color: 'var(--ink)' }}>Please pay to this Zelle account:</strong>{' '}
                  <a href={`mailto:${ZELLE_EMAIL}`} style={{ color: 'var(--flame)', fontWeight: 700 }}>{ZELLE_EMAIL}</a>
                </p>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: 'var(--ink)' }}>Important:</strong> When you send payment via Zelle, include your order ID{' '}
                  <strong>({orderId})</strong> in the memo or note field so we can confirm your tickets.
                </p>
              </div>
            ) : null}
          </div>
          {tier && (
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 10px' }}>
                <FaTicket style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Ticket subtotal: <strong>{formatCurrency(tier.price * quantity)}</strong>
                {isFarhanEvent(event) ? ` (${formatCurrency(tier.price)} × ${quantity})` : null}
              </p>
              {isFarhanEvent(event) ? (
                <>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--flame)' }}>$10 discount — no service fee</strong>
                    {' '}· applies to this Farhan event only
                  </p>
                  <p style={{ margin: 0, fontSize: 16, color: 'var(--ink)', fontWeight: 700 }}>
                    Zelle amount due:{' '}
                    {formatCurrency(Math.max(0, tier.price - FARHAN_ZELLE_DISCOUNT_PER_TICKET) * quantity)}
                  </p>
                </>
              ) : (
                <p style={{ margin: 0 }}>
                  Estimated total: <strong>{formatCurrency(tier.price * quantity)}</strong> (before any discounts)
                </p>
              )}
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestTicketsPage;
