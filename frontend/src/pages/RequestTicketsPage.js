import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import FarhanZellePricePair from '../components/FarhanZellePricePair';
import { formatCurrency, formatEventSchedule, FARHAN_ZELLE_DISCOUNT_PER_TICKET, isFarhanEvent } from '../utils/helpers';
import { FaCalendarDays, FaLocationDot, FaTicket, FaXmark } from 'react-icons/fa6';

const ZELLE_EMAIL = 'Payment@melodysounds.net';
/** Success modal → redirect to event (about 25–30s). */
const SUCCESS_MODAL_AUTO_CLOSE_MS = 28000;

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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalPhase, setPaymentModalPhase] = useState('details');
  const [pendingOrderId, setPendingOrderId] = useState('');

  const exitPaymentFlowToEvent = useCallback(() => {
    navigate(`/event/${eventId}`);
    setPaymentModalOpen(false);
    setPendingOrderId('');
    setPaymentModalPhase('details');
  }, [navigate, eventId]);

  const dismissPaymentModal = useCallback(() => {
    if (submitting) return;
    if (paymentModalPhase === 'success') exitPaymentFlowToEvent();
    else {
      setPaymentModalOpen(false);
      setPendingOrderId('');
      setPaymentModalPhase('details');
    }
  }, [submitting, paymentModalPhase, exitPaymentFlowToEvent]);

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

  useEffect(() => {
    if (!paymentModalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) dismissPaymentModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paymentModalOpen, submitting, dismissPaymentModal]);

  useEffect(() => {
    if (!paymentModalOpen || paymentModalPhase !== 'success') return;
    const t = window.setTimeout(() => exitPaymentFlowToEvent(), SUCCESS_MODAL_AUTO_CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [paymentModalOpen, paymentModalPhase, exitPaymentFlowToEvent]);

  const openPaymentModal = (e) => {
    e.preventDefault();
    if (!tierId) {
      toast.error('Select a ticket type');
      return;
    }
    setPaymentModalPhase('details');
    setPendingOrderId(makeOrderId());
    setPaymentModalOpen(true);
  };

  const confirmSubmitFromModal = async () => {
    if (!pendingOrderId || !tierId) return;
    setSubmitting(true);
    try {
      const tierNow = event.ticketTiers?.find((t) => t._id === tierId);
      const listTotal = tierNow ? tierNow.price * quantity : 0;
      const zelleDue = isFarhanEvent(event) && tierNow
        ? Math.max(0, tierNow.price - FARHAN_ZELLE_DISCOUNT_PER_TICKET) * quantity
        : listTotal;
      const notesForAdmin = isFarhanEvent(event)
        ? `Order ID: ${pendingOrderId}\nZelle payee: ${ZELLE_EMAIL}\nZelle amount due: ${formatCurrency(zelleDue)}\nList: ${formatCurrency(listTotal)} — $10/ticket discount, no service fee (Farhan only)`
        : `Order ID: ${pendingOrderId}\nZelle payee: ${ZELLE_EMAIL}\nEstimated total: ${formatCurrency(listTotal)}`;
      await api.post('/ticket-requests', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        eventId,
        tierId,
        quantity,
        notes: notesForAdmin,
      });
      setPaymentModalPhase('success');
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
          Complete the form with your details. Click Submit request to review payment instructions and your order ID, then confirm to send your request. We will match your Zelle payment and confirm your tickets.
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

        <form onSubmit={openPaymentModal} style={{ background: 'white', borderRadius: 'var(--r-xl)', padding: '36px 32px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
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
            {isFarhanEvent(event) && tier ? (
              <p style={{ margin: '10px 0 0', fontSize: 15, color: 'var(--ink)' }}>
                Per ticket:{' '}
                <FarhanZellePricePair
                  listPrice={tier.price}
                  strikeStyle={{ fontSize: '0.95em' }}
                  currentStyle={{ fontWeight: 700, color: 'var(--flame)' }}
                />
              </p>
            ) : null}
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
          {tier && (
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 10px' }}>
                <FaTicket style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Ticket subtotal: <strong>{formatCurrency(tier.price * quantity)}</strong>
                {isFarhanEvent(event) ? ` (${formatCurrency(tier.price)} × ${quantity})` : null}
              </p>
              {isFarhanEvent(event) ? (
                <div
                  style={{
                    marginTop: 14,
                    borderRadius: 'var(--r-lg)',
                    border: '1px solid var(--border-light)',
                    background: 'linear-gradient(180deg, #fafafa 0%, var(--smoke) 100%)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '18px 20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: 14,
                      paddingBottom: 12,
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    Farhan event pricing
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
                    <strong style={{ color: 'var(--ink)' }}>{formatCurrency(FARHAN_ZELLE_DISCOUNT_PER_TICKET)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Service Fee</span>
                    <strong style={{ color: 'var(--ink)' }}>{formatCurrency(0)}</strong>
                  </div>
                  <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
                    applies to this Farhan event only
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 14,
                      borderTop: '1px solid var(--border-light)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--ink)',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14 }}>Zelle amount due</span>
                    <span style={{ color: 'var(--flame)', fontFamily: 'var(--font-display)', fontSize: 18 }}>
                      {formatCurrency(Math.max(0, tier.price - FARHAN_ZELLE_DISCOUNT_PER_TICKET) * quantity)}
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0 }}>
                  Estimated total: <strong>{formatCurrency(tier.price * quantity)}</strong> (before any discounts)
                </p>
              )}
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting || paymentModalOpen}>
            Submit request
          </button>
        </form>
      </div>

      {paymentModalOpen && tier && pendingOrderId ? (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(15, 17, 21, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => dismissPaymentModal()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={paymentModalPhase === 'details' ? 'payment-modal-title' : 'payment-success-heading'}
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              maxWidth: paymentModalPhase === 'success' ? 480 : 440,
              width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
              border: '1px solid var(--border-light)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              disabled={submitting && paymentModalPhase === 'details'}
              onClick={dismissPaymentModal}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 36,
                height: 36,
                borderRadius: 'var(--r-md)',
                border: 'none',
                background: 'var(--smoke)',
                color: 'var(--text-muted)',
                cursor: submitting && paymentModalPhase === 'details' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaXmark size={18} />
            </button>

            {paymentModalPhase === 'details' ? (
              <div style={{ padding: '28px 24px 22px' }}>
                <p
                  id="payment-modal-title"
                  style={{
                    margin: '0 0 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  Total to pay (Zelle)
                </p>
                <p
                  style={{
                    margin: '0 0 22px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: 'clamp(32px, 8vw, 40px)',
                    lineHeight: 1.05,
                    color: 'var(--flame)',
                  }}
                >
                  {formatCurrency(
                    isFarhanEvent(event)
                      ? Math.max(0, tier.price - FARHAN_ZELLE_DISCOUNT_PER_TICKET) * quantity
                      : tier.price * quantity,
                  )}
                </p>

                <div
                  style={{
                    borderRadius: 'var(--r-lg)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--cloud)',
                    padding: '16px 18px',
                    marginBottom: 14,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>
                    Please pay to this Zelle account
                  </p>
                  <a
                    href={`mailto:${ZELLE_EMAIL}`}
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: 'var(--flame)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {ZELLE_EMAIL}
                  </a>
                </div>

                <div
                  style={{
                    borderRadius: 'var(--r-lg)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    background: 'linear-gradient(180deg, #fffbeb 0%, #fff7ed 100%)',
                    padding: '16px 18px',
                    marginBottom: 22,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 14, color: '#78350f', lineHeight: 1.65 }}>
                    <strong style={{ color: '#451a03' }}>Important:</strong>{' '}
                    When you send payment via Zelle, include your order ID{' '}
                    <code
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        background: 'rgba(255,255,255,0.9)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: '1px solid rgba(180, 83, 9, 0.28)',
                        color: 'var(--ink)',
                        verticalAlign: 'baseline',
                      }}
                    >
                      ({pendingOrderId})
                    </code>{' '}
                    in the memo or note field so we can confirm your tickets.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px 18px' }}
                    disabled={submitting}
                    onClick={confirmSubmitFromModal}
                  >
                    {submitting ? 'Sending…' : 'Confirm and send request'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={submitting}
                    onClick={dismissPaymentModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '36px 28px 32px', textAlign: 'center' }}>
                <div className="request-success-icon-wrap" aria-hidden="true">
                  <svg className="request-success-check" viewBox="0 0 24 24" width="42" height="42">
                    <path pathLength="1" d="M6.5 12.5 L10.5 16.5 L18 8.5" fill="none" />
                  </svg>
                </div>
                <h2
                  id="payment-success-heading"
                  className="anim-up"
                  style={{
                    margin: '0 0 16px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: 28,
                    color: 'var(--ink)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Thank you!
                </h2>
                <p
                  className="anim-up d1"
                  style={{
                    margin: '0 auto 20px',
                    maxWidth: 400,
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: 'var(--text-secondary)',
                    textAlign: 'left',
                  }}
                >
                  We have received your request. We will verify your payment using your order ID{' '}
                  <strong style={{ color: 'var(--ink)' }}>{pendingOrderId}</strong>. After verification, your tickets
                  will be sent to <strong style={{ color: 'var(--ink)' }}>{email.trim() || 'your email'}</strong>, the
                  email address you provided on this form (such as your Gmail inbox).
                </p>
                <button
                  type="button"
                  className="btn btn-primary anim-up d2"
                  style={{ width: '100%', maxWidth: 320, margin: '0 auto 14px', justifyContent: 'center', padding: '14px 18px', display: 'flex' }}
                  onClick={exitPaymentFlowToEvent}
                >
                  Return to event
                </button>
                <p className="anim-up d3" style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  This window will close automatically in about{' '}
                  {Math.round(SUCCESS_MODAL_AUTO_CLOSE_MS / 1000)} seconds.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RequestTicketsPage;
