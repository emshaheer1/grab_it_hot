import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import { formatEventSchedule, formatCurrency } from '../utils/helpers';
import { FaCalendarDays, FaCircleCheck, FaLocationDot, FaTicket } from 'react-icons/fa6';

const ConfirmationPage = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [event, setEvent] = useState(location.state?.event || null);
  const [loading, setLoading] = useState(!booking);

  useEffect(() => {
    if (!booking) {
      api.get(`/bookings/${bookingId}`)
        .then((r) => { setBooking(r.data.data); setEvent(r.data.data.event); })
        .finally(() => setLoading(false));
    }
  }, [booking, bookingId]);

  if (loading) return <div className="spinner-wrap" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ background: 'var(--cloud)', minHeight: '100vh', padding: '80px 24px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        {/* Success animation */}
        <div className="anim-up" style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'linear-gradient(135deg, #E8F5EE, #C6EDD8)',
            border: '2px solid #1A7A4A30',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(26,122,74,0.15)',
          }}><FaCircleCheck /></div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, marginBottom: 10 }}>
            Booking Confirmed!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 380, margin: '0 auto' }}>
            Your tickets are reserved. Check your email for the confirmation receipt.
          </p>
        </div>

        {/* Ticket card */}
        <div className="anim-up d2" style={{ background: 'white', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
          {/* Ticket header */}
          <div style={{ background: 'linear-gradient(135deg, #FF3B2F 0%, #FF6B5B 100%)', padding: '32px 36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>Booking Reference</div>
                <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '0.08em' }}>{booking.bookingId}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                <div style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '5px 16px', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)' }}>
                  ✓ Confirmed
                </div>
              </div>
            </div>
          </div>

          {/* Ticket tear divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '0 -1px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--cloud)', border: '1px solid var(--border-light)', marginLeft: -10, flexShrink: 0 }} />
            <div style={{ flex: 1, borderBottom: '2px dashed var(--smoke-deep)' }} />
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--cloud)', border: '1px solid var(--border-light)', marginRight: -10, flexShrink: 0 }} />
          </div>

          {/* Ticket body */}
          <div style={{ padding: '32px 36px' }}>
            {event && (
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>{event.title}</h2>
                <div style={{ display: 'flex', gap: 20, color: 'var(--text-muted)', fontSize: 14, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><FaCalendarDays /> {formatEventSchedule(event)}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><FaLocationDot /> {event.location?.city}, {event.location?.state}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              {[
                ['Ticket Type', booking.ticketTier?.name],
                ['Quantity', `${booking.quantity} ticket${booking.quantity > 1 ? 's' : ''}`],
                ['Attendee', booking.attendeeInfo?.fullName],
                ['Email', booking.attendeeInfo?.email],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-ghost)', marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 500, wordBreak: 'break-word' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ background: 'var(--smoke)', borderRadius: 'var(--r-md)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Total Paid</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--flame)' }}>{formatCurrency(booking.totalAmount)}</span>
            </div>

            {/* QR placeholder */}
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 100, height: 100, background: 'var(--smoke)', borderRadius: 12, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, border: '2px dashed var(--smoke-deep)' }}><FaTicket /></div>
              <p style={{ fontSize: 12, color: 'var(--text-ghost)' }}>Present booking ID at venue entrance</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="anim-up d3" style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <Link to="/events" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: 15, fontSize: 15 }}>
            Browse More Events →
          </Link>
          <Link to="/profile" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: 14 }}>
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
