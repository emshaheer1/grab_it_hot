import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import FarhanZellePricePair from '../components/FarhanZellePricePair';
import { formatEventSchedule, formatCurrency, isFarhanEvent, resolveEventImageUrl } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaCalendarDays, FaLocationDot, FaLock } from 'react-icons/fa6';

const BookingPage = () => {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [event, setEvent] = useState(location.state?.event || null);
  const [loading, setLoading] = useState(!event);
  const [submitting, setSubmitting] = useState(false);

  const [tierId, setTierId] = useState(location.state?.tierId || '');
  const [quantity, setQuantity] = useState(1);
  const [attendee, setAttendee] = useState({ fullName: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    if (!event) {
      api.get(`/events/${eventId}`)
        .then((r) => { setEvent(r.data.data); if (!tierId) setTierId(r.data.data.ticketTiers?.[0]?._id); })
        .catch(() => navigate('/events'))
        .finally(() => setLoading(false));
    }
  }, [event, eventId, tierId, navigate]);

  if (loading) return <div className="spinner-wrap" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  const selectedTier = event?.ticketTiers?.find((t) => t._id === tierId);
  const subtotal = selectedTier ? selectedTier.price * quantity : 0;
  const discount = promoApplied && event.promoCode ? (subtotal * event.promoDiscount) / 100 : 0;
  const total = subtotal - discount;

  const applyPromo = () => {
    if (promoCode.toUpperCase() === event.promoCode?.toUpperCase()) {
      setPromoApplied(true);
      toast.success(`Promo applied - ${event.promoDiscount}% off!`);
    } else {
      toast.error('Invalid promo code');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/bookings', { eventId, tierId, quantity, attendeeInfo: attendee, promoCode: promoApplied ? promoCode : undefined });
      navigate(`/confirmation/${res.data.data._id}`, { state: { booking: res.data.data, event } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
      setSubmitting(false);
    }
  };

  const canStep2 = !!tierId;
  const canStep3 = attendee.fullName && attendee.email && attendee.phone;

  const stepLabels = ['Select Tickets', 'Your Details', 'Review & Pay'];

  return (
    <div style={{ background: 'var(--cloud)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Page header */}
      <div style={{ background: 'var(--ink)', padding: '48px 0 36px' }}>
        <div className="container">
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Booking</div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: 'clamp(22px,4vw,40px)', fontWeight: 900, marginBottom: 6 }}>{event?.title}</h1>
          {event && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, display: 'inline-flex', gap: 12, flexWrap: 'wrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FaCalendarDays /> {formatEventSchedule(event)}</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FaLocationDot /> {event.location?.city}, {event.location?.state}</span></p>}
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, padding: '48px 24px' }}>
        {/* Step bar */}
        <div className="steps-bar">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            return (
              <React.Fragment key={n}>
                {i > 0 && <div className={`step-connector ${n <= step ? 'done' : ''}`} />}
                <div className="step-item">
                  <div className={`step-circle ${n === step ? 'active' : n < step ? 'done' : ''}`}>
                    {n < step ? '✓' : n}
                  </div>
                  <span className={`step-label hide-mobile ${n === step ? 'active' : n < step ? 'done' : ''}`}>{label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)', padding: '44px 40px', border: '1px solid var(--border-light)' }}>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="anim-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 28 }}>Choose Your Tickets</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                {event.ticketTiers.map((t) => {
                  const avail = t.capacity - t.sold;
                  const sel = tierId === t._id;
                  return (
                    <div key={t._id} onClick={() => avail > 0 && setTierId(t._id)}
                      style={{ border: `2px solid ${sel ? 'var(--flame)' : 'var(--smoke-deep)'}`, borderRadius: 'var(--r-lg)', padding: '20px 24px', cursor: avail > 0 ? 'pointer' : 'not-allowed', background: sel ? 'var(--flame-ghost)' : 'var(--cloud)', opacity: avail === 0 ? 0.4 : 1, transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? 'var(--flame)' : 'var(--smoke-deep)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: sel ? 'var(--flame)' : 'white', flexShrink: 0 }}>
                            {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</div>
                        </div>
                        {t.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, marginLeft: 30 }}>{t.description}</div>}
                        <div style={{ fontSize: 12, fontWeight: 600, color: avail < 10 ? 'var(--flame)' : 'var(--text-ghost)', marginTop: 4, marginLeft: 30 }}>
                          {avail === 0 ? 'Sold out' : `${avail} tickets left`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, color: 'var(--ink)', justifyContent: 'flex-end', display: 'flex' }}>
                          {isFarhanEvent(event) ? (
                            <FarhanZellePricePair
                              listPrice={t.price}
                              strikeStyle={{ fontSize: '0.8em', fontWeight: 700 }}
                              currentStyle={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, color: 'var(--ink)' }}
                            />
                          ) : (
                            formatCurrency(t.price)
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-ghost)' }}>per ticket</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="form-field" style={{ marginBottom: 32 }}>
                <label className="form-label">Quantity</label>
                <select className="form-input" value={quantity} onChange={e => setQuantity(Number(e.target.value))}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} ticket{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>

              {selectedTier && (
                <div style={{ background: 'var(--smoke)', borderRadius: 'var(--r-md)', padding: '18px 22px', marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
                    <span>{selectedTier.name} × {quantity}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--flame)' }}>{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

              <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!canStep2} style={{ width: '100%', padding: 17, fontSize: 15, justifyContent: 'center', opacity: canStep2 ? 1 : 0.4 }}>
                Continue to Details →
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="anim-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 28 }}>Your Details</h2>

              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" required placeholder="John Doe" value={attendee.fullName} onChange={e => setAttendee(p => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" required placeholder="john@example.com" value={attendee.email} onChange={e => setAttendee(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-field" style={{ marginBottom: 28 }}>
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" required placeholder="+1 (555) 000-0000" value={attendee.phone} onChange={e => setAttendee(p => ({ ...p, phone: e.target.value }))} />
              </div>

              {event.promoCode && (
                <div className="form-field" style={{ marginBottom: 32 }}>
                  <label className="form-label">Promo Code <span style={{ color: 'var(--text-ghost)', fontWeight: 400 }}>(optional)</span></label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input className="form-input" style={{ flex: 1 }} placeholder={`Try "${event.promoCode}"`} value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} disabled={promoApplied} />
                    <button onClick={applyPromo} disabled={promoApplied || !promoCode} className="btn btn-dark" style={{ flexShrink: 0, opacity: (promoApplied || !promoCode) ? 0.5 : 1 }}>
                      {promoApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setStep(1)} style={{ flex: 1, padding: 15, justifyContent: 'center' }}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)} disabled={!canStep3} style={{ flex: 2, padding: 15, justifyContent: 'center', opacity: canStep3 ? 1 : 0.4 }}>
                  Review Order →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="anim-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 28 }}>Review Your Order</h2>

              {/* Event summary */}
              <div style={{ background: 'var(--smoke)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 28 }}>
                <div style={{ display: 'flex', gap: 16, padding: '20px 22px', alignItems: 'center' }}>
                  <img src={resolveEventImageUrl(event.image)} alt="" style={{ width: 80, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{event.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><FaCalendarDays /> {formatEventSchedule(event)}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><FaLocationDot /> {event.location?.city}, {event.location?.state}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--smoke-deep)', padding: '18px 22px' }}>
                  {[
                    ['Ticket', `${selectedTier?.name} × ${quantity}`],
                    ['Price each', formatCurrency(selectedTier?.price)],
                    ['Subtotal', formatCurrency(subtotal)],
                    ...(promoApplied ? [['Discount', `-${formatCurrency(discount)}`]] : []),
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>
                      <span>{label}</span><span style={{ fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--smoke-deep)', paddingTop: 14, marginTop: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, color: 'var(--flame)' }}>{formatCurrency(total)}</span>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--smoke-deep)', padding: '14px 22px', fontSize: 13, color: 'var(--text-muted)', background: 'white' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Attendee:</strong> {attendee.fullName} · {attendee.email} · {attendee.phone}
                </div>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-ghost)', textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
                <FaLock style={{ marginRight: 4 }} /> By completing this purchase you agree to our Terms of Service.<br />
                A confirmation email will be sent to <strong style={{ color: 'var(--text-muted)' }}>{attendee.email}</strong>.
              </p>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setStep(2)} style={{ flex: 1, padding: 15, justifyContent: 'center' }}>← Back</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ flex: 2, padding: 15, fontSize: 15, justifyContent: 'center' }}>
                  {submitting ? 'Processing...' : `Confirm & Pay ${formatCurrency(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
