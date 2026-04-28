import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import FarhanZellePricePair from '../components/FarhanZellePricePair';
import { formatEventSchedule, formatCurrency, formatEventLocationOneLine, getCategoryIcon, hasDirectPayDiscount, resolveEventImageUrl, splitGrabItHotClosing } from '../utils/helpers';
import {
  FaCalendarDays,
  FaLocationDot,
  FaMicrophoneLines,
  FaTag,
  FaLock,
  FaTicket,
  FaPhone,
  FaEnvelope,
  FaXmark,
} from 'react-icons/fa6';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [id]);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((r) => { setEvent(r.data.data); setSelectedTier(r.data.data.ticketTiers?.[0]?._id); })
      .catch(() => navigate({ pathname: '/', hash: 'featured-events' }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!comingSoonModalOpen) return undefined;
    const onEscape = (e) => {
      if (e.key === 'Escape') setComingSoonModalOpen(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [comingSoonModalOpen]);

  if (loading) return <div className="spinner-wrap" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  if (!event) return null;

  const handleBuy = () => {
    if (event.dateComingSoon) {
      setComingSoonModalOpen(true);
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    navigate(`/request-tickets/${event._id}`, { state: { tierId: selectedTier } });
  };

  const ticketsClosed = Boolean(event.dateComingSoon);

  const tier = event.ticketTiers?.find((t) => t._id === selectedTier);
  const CategoryIcon = getCategoryIcon(event.category);

  const detailRows = [
    [<FaCalendarDays key="d" />, 'Date & Time', formatEventSchedule(event)],
    [<FaLocationDot key="l" />, 'Venue', formatEventLocationOneLine(event.location) || `${event.location.venue}, ${event.location.city}, ${event.location.state}`],
    [<FaMicrophoneLines key="o" />, 'Organizer', event.organizer?.name],
    [<FaTag key="c" />, 'Category', event.category],
  ];
  if (event.organizer?.email) {
    detailRows.push([<FaEnvelope key="e" />, 'Email', event.organizer.email]);
  }
  if (event.organizer?.phone) {
    detailRows.push([<FaPhone key="p" />, 'Phone', event.organizer.phone]);
  }

  const locationLine =
    formatEventLocationOneLine(event.location) ||
    [event.location?.venue, event.location?.city].filter(Boolean).join(', ');

  const { body: heroDescriptionBody, closing: heroGrabClosing } = splitGrabItHotClosing(event.description);

  return (
    <div>
      <section style={{ background: 'var(--cloud)', borderBottom: '1px solid var(--border-light)', paddingTop: 28 }}>
        <div className="container" style={{ padding: '40px 24px 48px' }}>
          <div className="event-detail-hero-grid">
            {/* Left: poster — stretches to match text column height */}
            <div
              className="event-detail-hero-poster"
              style={{
                background: '#06060a',
                borderRadius: 'var(--r-xl)',
                padding: 'clamp(16px, 3vw, 28px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'center',
                minHeight: 280,
                alignSelf: 'stretch',
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 0,
                }}
              >
                <img
                  src={resolveEventImageUrl(event.image)}
                  alt=""
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    maxHeight: 'min(72vh, 720px)',
                    objectFit: 'contain',
                    borderRadius: 'var(--r-md)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                  }}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400'; }}
                />
              </div>
            </div>

            {/* Right: meta + body (flex grow) + Grab It Hot card (bottom-aligned with poster) */}
            <div
              className="event-detail-hero-copy"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignSelf: 'stretch',
                paddingTop: 8,
                paddingBottom: 8,
                minHeight: 0,
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CategoryIcon style={{ fontSize: 16, color: 'var(--flame)' }} />
                  {event.category}
                </div>
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--ink)',
                    fontSize: 'clamp(28px, 3.6vw, 42px)',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    margin: '0 0 20px',
                  }}
                >
                  {event.title}
                </h1>
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: 16,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <FaCalendarDays style={{ color: 'var(--flame)', flexShrink: 0 }} />
                  <span>{formatEventSchedule(event)}</span>
                </p>
                <p
                  style={{
                    margin: '0 0 28px',
                    fontSize: 16,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <FaLocationDot style={{ color: 'var(--flame)', flexShrink: 0, marginTop: 3 }} />
                  <span>{locationLine}</span>
                </p>
              </div>
              {heroDescriptionBody ? (
                <p
                  style={{
                    flex: heroGrabClosing ? 1 : undefined,
                    margin: 0,
                    marginBottom: heroGrabClosing ? 20 : 0,
                    fontSize: 16,
                    lineHeight: 1.85,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-line',
                    minHeight: heroGrabClosing ? 0 : undefined,
                  }}
                >
                  {heroDescriptionBody}
                </p>
              ) : heroGrabClosing ? (
                <div style={{ flex: 1, minHeight: 0 }} aria-hidden />
              ) : null}
              {heroGrabClosing ? (
                <aside
                  className="event-detail-hero-gith"
                  style={{
                    marginTop: 'auto',
                    flexShrink: 0,
                    borderRadius: 'var(--r-xl)',
                    border: '1px solid var(--border-light)',
                    background: 'white',
                    boxShadow: 'var(--shadow-sm)',
                    padding: 'clamp(16px, 3vw, 28px)',
                    borderLeft: '4px solid var(--flame)',
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Grab It Hot
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{heroGrabClosing.replace(/^Grab It Hot\s+/i, '').trim()}</p>
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '56px 24px' }}>
        <div className="event-detail-body-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 56, alignItems: 'start' }}>
          <div>
            <div style={{ background: 'var(--smoke)', borderRadius: 'var(--r-xl)', padding: '32px', marginBottom: 40 }}>
              <h3 style={{ fontSize: 18, marginBottom: 24, fontFamily: 'var(--font-display)' }}>Event details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 24 }}>
                {detailRows.map(([icon, label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{icon} {label}</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {event.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {event.tags.map((t) => (
                  <span key={t} className="pill pill-flame-solid">#{t}</span>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'sticky', top: 96 }}>
            <div style={{ background: 'white', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)', padding: 32, border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 24 }}>Select your tickets</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {event.ticketTiers.map((t) => {
                  const avail = t.capacity - t.sold;
                  const sel = selectedTier === t._id;
                  return (
                    <div key={t._id} onClick={() => avail > 0 && setSelectedTier(t._id)}
                      style={{
                        border: `2px solid ${sel ? 'var(--flame)' : 'var(--smoke-deep)'}`,
                        borderRadius: 'var(--r-lg)', padding: '18px 20px',
                        cursor: avail > 0 ? 'pointer' : 'not-allowed',
                        background: sel ? 'var(--flame-ghost)' : 'var(--cloud)',
                        opacity: avail === 0 ? 0.45 : 1,
                        transition: 'all 0.2s',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                          {sel && <span style={{ fontSize: 11, background: 'var(--flame)', color: 'white', borderRadius: 'var(--r-pill)', padding: '2px 8px', fontWeight: 700 }}>Selected</span>}
                        </div>
                        {t.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{t.description}</div>}
                        <div style={{ fontSize: 12, fontWeight: 600, color: avail < 10 ? 'var(--flame)' : 'var(--text-ghost)' }}>
                          {avail === 0 ? '● Sold out' : `● ${avail} available`}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: 'var(--ink)', flexShrink: 0, paddingLeft: 12 }}>
                        {hasDirectPayDiscount(event) ? (
                          <FarhanZellePricePair
                            event={event}
                            listPrice={t.price}
                            strikeStyle={{ fontSize: '0.85em', fontWeight: 700 }}
                            currentStyle={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: 'var(--ink)' }}
                          />
                        ) : (
                          formatCurrency(t.price)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {event.promoCode && (
                <div style={{ background: '#FFF8E7', border: '1px solid #F59E0B40', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <FaTag /> Use code <strong style={{ background: '#F59E0B20', padding: '2px 6px', borderRadius: 4 }}>{event.promoCode}</strong> for {event.promoDiscount}% off at checkout!
                  </span>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBuy}
                style={{ width: '100%', padding: '17px', fontSize: 16, marginBottom: 12, justifyContent: 'center' }}
                disabled={!ticketsClosed && !selectedTier}
              >
                <FaTicket /> {ticketsClosed ? 'Tickets coming soon' : 'Buy tickets'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: ticketsClosed ? 'var(--text-muted)' : 'var(--text-ghost)' }}>
                {ticketsClosed ? (
                  'Sales are not open yet. Check back after the date is announced.'
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FaLock /> Secure checkout · Instant confirmation · Official tickets</span>
                )}
              </p>

              {tier && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--smoke-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Starting from</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, color: 'var(--flame)' }}>
                    {hasDirectPayDiscount(event) ? (
                      <FarhanZellePricePair
                        event={event}
                        listPrice={tier.price}
                        strikeStyle={{ fontSize: '0.82em', fontWeight: 700, color: 'var(--text-muted)' }}
                        currentStyle={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, color: 'var(--flame)' }}
                      />
                    ) : (
                      formatCurrency(tier.price)
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {comingSoonModalOpen ? (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(15, 17, 21, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setComingSoonModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-coming-soon-heading"
            style={{
              background: 'white',
              borderRadius: 'var(--r-xl)',
              padding: '28px 26px',
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
              border: '1px solid var(--border-light)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setComingSoonModalOpen(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                border: 'none',
                background: 'var(--cloud)',
                borderRadius: 10,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--ink)',
              }}
            >
              <FaXmark />
            </button>
            <h2
              id="event-coming-soon-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--ink)',
                margin: '0 36px 16px 0',
                lineHeight: 1.25,
              }}
            >
              Tickets coming soon
            </h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              The event is coming soon please stay tuned
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setComingSoonModalOpen(false)}
              style={{ width: '100%', marginTop: 24, justifyContent: 'center', padding: '12px 20px' }}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <style>{`
        .event-detail-hero-grid {
          display: grid;
          grid-template-columns: minmax(260px, 1fr) minmax(300px, 1.05fr);
          gap: clamp(28px, 4vw, 56px);
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .event-detail-hero-grid { grid-template-columns: 1fr !important; }
          .event-detail-body-grid { grid-template-columns: 1fr !important; }
          .event-detail-body-grid > div[style*="sticky"] { position: static !important; }
        }
      `}</style>
    </div>
  );
};

export default EventDetailPage;
