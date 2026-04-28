import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import EventCard from '../components/EventCard';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FaBolt, FaCalendarAlt, FaCheckCircle, FaChevronLeft, FaChevronRight, FaEnvelope, FaHandshake, FaHeadset, FaLock, FaMapMarkerAlt, FaMobileAlt, FaMusic, FaSearch, FaShieldAlt, FaStar, FaTicketAlt } from 'react-icons/fa';
import { GrabMarkIcon } from '../components/GrabMarkIcon';

const REVIEWS = [
  { name: 'Sarah Mitchell', location: 'New York, NY', rating: 5, role: 'Music Enthusiast', text: 'Secured my Junooni Tour tickets in minutes. Checkout was smooth and the confirmation came through right away — exactly what you want when a show is in high demand.' },
  { name: 'James Chen', location: 'Los Angeles, CA', rating: 5, role: 'Concert-goer', text: 'The USA tour listing was clear, tiers were easy to compare, and Grab It Hot made the whole booking feel effortless. Can’t wait for the show.' },
  { name: 'Priya Kapoor', location: 'Chicago, IL', rating: 5, role: 'Live music fan', text: 'Found the Junooni Tour here before anywhere else. The site is fast, mobile-friendly, and I trust it for my next ticket purchase too.' },
];

const Stars = ({ n }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ fontSize: 16, color: i < n ? '#F59E0B' : '#E5E1DC' }}>★</span>
    ))}
  </div>
);

const toFeatured = { pathname: '/', hash: 'featured-events' };

function isPageReload() {
  if (typeof performance === 'undefined') return false;
  const entry = performance.getEntriesByType('navigation')[0];
  if (entry) return entry.type === 'reload';
  if (performance.navigation) {
    return performance.navigation.type === 1;
  }
  return false;
}

const HERO_STATS = [
  { Icon: FaCalendarAlt, end: 10, suffix: 'K+', decimals: 0, label: 'Events Listed' },
  { Icon: FaTicketAlt, end: 500, suffix: 'K+', decimals: 0, label: 'Tickets Sold' },
  { Icon: FaMapMarkerAlt, end: 50, suffix: '+', decimals: 0, label: 'US Cities' },
  { Icon: FaStar, end: 4.9, suffix: '', decimals: 1, label: 'Average Rating' },
];

function formatHeroStatValue(v, decimals, suffix) {
  const n = decimals > 0 ? Number(v).toFixed(decimals) : String(Math.round(v));
  return `${n}${suffix}`;
}

function useCountUp(end, enabled, duration = 1500) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setV(0);
      return;
    }
    let rafId;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - t) ** 4;
      setV(end * eased);
      if (t < 1) rafId = requestAnimationFrame(tick);
      else setV(end);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, end, duration]);
  return v;
}

function HeroStatChip({ stat, index }) {
  const { Icon, end, suffix, decimals, label } = stat;
  const [run, setRun] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRun(true), 120 + index * 110);
    return () => clearTimeout(t);
  }, [index]);
  const raw = useCountUp(end, run, 1900);
  const display = formatHeroStatValue(raw, decimals, suffix);

  return (
    <div className="hero-stat-chip">
      <Icon className="hero-stat-chip__icon" aria-hidden />
      <div className="hero-stat-chip__value" style={{ fontVariantNumeric: 'tabular-nums' }}>{display}</div>
      <div className="hero-stat-chip__label">{label}</div>
    </div>
  );
}

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [featured, setFeatured]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [featuredStart, setFeaturedStart] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(1);
  const [contact, setContact]     = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const h = (location.hash || '').replace(/^#/, '');
    if (isPageReload() && h) {
      navigate({ pathname: location.pathname, search: location.search }, { replace: true });
      return;
    }
    if (!h) return;
    const id = h === 'featured-events' ? 'featured-events' : h;
    const el = document.getElementById(id);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [location.pathname, location.hash, location.search, navigate]);

  useEffect(() => {
    api.get('/events/featured')
      .then((r) => {
        const visibleFeatured = (r.data.data || []).filter((event) => event.status !== 'completed');
        setFeatured(visibleFeatured);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const mq2 = window.matchMedia('(min-width: 700px)');
    const mq3 = window.matchMedia('(min-width: 1100px)');
    const sync = () => {
      if (mq3.matches) setCardsPerView(3);
      else if (mq2.matches) setCardsPerView(2);
      else setCardsPerView(1);
    };
    sync();
    mq2.addEventListener('change', sync);
    mq3.addEventListener('change', sync);
    return () => {
      mq2.removeEventListener('change', sync);
      mq3.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    if (!featured.length) {
      setFeaturedStart(0);
      return;
    }
    const maxS = Math.max(0, featured.length - cardsPerView);
    setFeaturedStart((s) => Math.min(s, maxS));
  }, [featured, cardsPerView]);

  const featuredMaxStart = featured.length ? Math.max(0, featured.length - cardsPerView) : 0;
  const featuredVisible = featured.slice(featuredStart, featuredStart + cardsPerView);

  const goFeaturedPrev = () => {
    if (!featured.length) return;
    setFeaturedStart((s) => {
      const maxS = Math.max(0, featured.length - cardsPerView);
      if (maxS === 0) return 0;
      return s <= 0 ? maxS : s - 1;
    });
  };

  const goFeaturedNext = () => {
    if (!featured.length) return;
    setFeaturedStart((s) => {
      const maxS = Math.max(0, featured.length - cardsPerView);
      if (maxS === 0) return 0;
      return s >= maxS ? 0 : s + 1;
    });
  };

  const sendContact = async (e) => {
    e.preventDefault();
    setContactSending(true);
    try {
      await api.post('/contact', {
        name: contact.name.trim(),
        email: contact.email.trim(),
        message: contact.message.trim(),
      });
      setContactSent(true);
      setContact({ name: '', email: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send message');
    } finally {
      setContactSending(false);
    }
  };

  const tickerEvents = featured.length
    ? featured.map((event) => event.title)
    : ['Junooni Tour — USA'];

  const TICKER_SLOTS_PER_HALF = 18;
  const tickerHalf = Array.from({ length: TICKER_SLOTS_PER_HALF }, (_, i) => tickerEvents[i % tickerEvents.length]);
  const tickerRow = [...tickerHalf, ...tickerHalf];

  return (
    <div>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO — full-bleed cinematic
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section ref={heroRef} style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        overflow: 'hidden',
        background: '#0A0A0A',
      }}>
        {/* Bg image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1800&auto=format&q=80")',
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          opacity: 0.35,
        }} />

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, transparent 40%, rgba(10,10,10,0.85) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(10,10,10,0.5) 100%)' }} />

        {/* Red accent glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(255,59,47,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Content */}
        <div className="container" style={{ position: 'relative', zIndex: 2, paddingTop: 120, paddingBottom: 100, textAlign: 'center' }}>
          {/* Eyebrow */}
          <div className="anim-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', padding: '6px 14px', marginBottom: 24, backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 11, color: '#FF3B2F', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', gap: 8, alignItems: 'center' }}><GrabMarkIcon height="2.35em" /> America’s Most Exclusive Events</span>
          </div>

          <h1 className="anim-up d1" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 6.8vw, 82px)', fontWeight: 900, color: 'white', lineHeight: 1.08, letterSpacing: '-0.03em', maxWidth: 860, margin: '0 auto 24px' }}>
            Discover Events<br />
            That <span style={{ color: '#FF3B2F' }}>Define</span> America
          </h1>

          <p className="anim-up d2" style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto 44px', lineHeight: 1.7, fontWeight: 300 }}>
            From headline tours and festival stages to underground sets and acoustic nights—find the music you love, book fast, and sing it back live with the crowd.
          </p>

          <div className="anim-up d3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
            <Link to={toFeatured} className="btn btn-primary-lg">
              Explore Events
            </Link>
            <a href="#contact" className="btn btn-ghost-lg">
              Host an Event
            </a>
          </div>

          {/* Stats bar */}
          <div className="anim-up d4 hero-stats-wrap hero-stats-wrap--bar">
            {HERO_STATS.map((stat, i) => (
              <HeroStatChip key={stat.label} stat={stat} index={i} />
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.4 }}>
          <span style={{ fontSize: 11, color: 'white', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Scroll</span>
          <div style={{ width: 1, height: 40, background: 'white', animation: 'scrollPulse 1.8s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes scrollPulse { 0%,100%{opacity:0.2;transform:scaleY(0.5) translateY(-8px)} 50%{opacity:1;transform:scaleY(1) translateY(0)} }`}</style>
      </section>

      <section className="events-ticker">
        <div className="events-ticker__track">
          {tickerRow.map((name, index) => (
            <div key={`t-${index}`} className="events-ticker__item">
              <FaTicketAlt />
              <span>{name}</span>
              <span className="events-ticker__sep" aria-hidden>·</span>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FEATURED EVENTS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="featured-events" className="section" style={{ scrollMarginTop: 96 }}>
        <div className="container">
          <div style={{ marginBottom: 56 }}>
            <div className="eyebrow">Don't Miss Out</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>Featured Events</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 10, maxWidth: 520, fontSize: 16, lineHeight: 1.65 }}>
              Carefully curated experiences from coast to coast — handpicked for unforgettable moments.
            </p>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : featured.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>No featured events right now — check back soon.</p>
          ) : (
            <div
              style={{
                position: 'relative',
                maxWidth: cardsPerView === 1 ? 420 : cardsPerView === 2 ? 880 : 1200,
                margin: '0 auto',
                padding: '0 clamp(44px, 6vw, 56px)',
              }}
            >
              {featuredMaxStart > 0 ? (
                <>
                  <button
                    type="button"
                    className="featured-carousel-arrow featured-carousel-arrow--prev"
                    aria-label="Previous featured events"
                    onClick={goFeaturedPrev}
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    type="button"
                    className="featured-carousel-arrow featured-carousel-arrow--next"
                    aria-label="Next featured events"
                    onClick={goFeaturedNext}
                  >
                    <FaChevronRight />
                  </button>
                </>
              ) : null}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cardsPerView}, minmax(0, 1fr))`,
                  gap: cardsPerView === 1 ? 0 : 20,
                  alignItems: 'stretch',
                }}
              >
                {featuredVisible.map((e) => (
                  <EventCard key={e._id} event={e} />
                ))}
              </div>
              {featured.length > 0 ? (
                <div
                  role="tablist"
                  aria-label="Featured events slides"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 22,
                  }}
                >
                  {Array.from({ length: featuredMaxStart + 1 }, (_, i) => {
                    const active = i === featuredStart;
                    return (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-label={`Featured slide ${i + 1} of ${featuredMaxStart + 1}`}
                        onClick={() => setFeaturedStart(i)}
                        disabled={featuredMaxStart === 0}
                        style={{
                          width: active ? 24 : 8,
                          height: 8,
                          borderRadius: 999,
                          border: 'none',
                          padding: 0,
                          cursor: featuredMaxStart === 0 ? 'default' : 'pointer',
                          background: active ? 'var(--flame)' : 'var(--border-light)',
                          opacity: active ? 1 : 0.55,
                          transition: 'width 0.2s ease, opacity 0.2s ease, background 0.2s ease',
                        }}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>
        <style>{`
          #featured-events .featured-carousel-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 44px;
            height: 44px;
            border-radius: 12px;
            border: 1px solid var(--border-light);
            background: white;
            box-shadow: var(--shadow-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--ink);
            z-index: 2;
            transition: background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease,
              color 0.22s ease, transform 0.22s ease;
          }
          #featured-events .featured-carousel-arrow--prev { left: 0; }
          #featured-events .featured-carousel-arrow--next { right: 0; }
          #featured-events .featured-carousel-arrow:hover {
            background: rgba(255, 59, 47, 0.09);
            border-color: rgba(255, 59, 47, 0.38);
            color: var(--flame);
            box-shadow: 0 10px 28px rgba(255, 59, 47, 0.22);
            transform: translateY(-50%) scale(1.07);
          }
          #featured-events .featured-carousel-arrow:active {
            transform: translateY(-50%) scale(1.02);
            box-shadow: 0 4px 14px rgba(255, 59, 47, 0.15);
          }
          @media (prefers-reduced-motion: reduce) {
            #featured-events .featured-carousel-arrow {
              transition: none;
            }
            #featured-events .featured-carousel-arrow:hover,
            #featured-events .featured-carousel-arrow:active {
              transform: translateY(-50%);
            }
          }
        `}</style>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TRUST STRIP (replaces category browse)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="category-band">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.68)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Why people choose us</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, maxWidth: 960, margin: '0 auto' }}>
            {[
              { icon: <FaShieldAlt />, title: 'Vetted experiences', desc: 'Every listing is reviewed so you know what you are buying.' },
              { icon: <FaHeadset />, title: 'Real support', desc: 'Questions before or after purchase? Our team actually replies.' },
              { icon: <FaHandshake />, title: 'Simple requests', desc: 'Request tickets with your details and payment proof in one step.' },
              { icon: <FaStar />, title: 'Top venues', desc: 'From intimate rooms to major arenas across the country.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="category-chip" style={{ textAlign: 'left', cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: 10, maxWidth: 'none', borderRadius: 14, padding: '18px 20px' }}>
                <span style={{ display: 'inline-flex', fontSize: 18, color: '#FF3B2F' }}>{icon}</span>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>{title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, fontWeight: 400 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ABOUT
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="about" className="section" style={{ scrollMarginTop: 96 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 80, alignItems: 'center' }}>
            {/* Image side */}
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 28, overflow: 'hidden', aspectRatio: '4/5' }}>
                <img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&q=80" alt="Live event" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Floating stat card */}
              <div style={{
                position: 'absolute', bottom: -24, right: -24,
                background: 'white', borderRadius: 20,
                padding: '22px 28px',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-light)',
                minWidth: 180,
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: 'var(--flame)', lineHeight: 1 }}>500K+</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Happy Attendees</div>
              </div>
              {/* Second floating card */}
              <div style={{
                position: 'absolute', top: 24, right: -20,
                background: 'var(--ink)', borderRadius: 16,
                padding: '16px 22px',
                boxShadow: 'var(--shadow-lg)',
              }}>
                <div style={{ color: '#F59E0B', fontSize: 16, letterSpacing: 1 }}>★★★★★</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>4.9 / 5 Average</div>
              </div>
            </div>

            {/* Text side */}
            <div>
              <div className="eyebrow">🏆 Who We Are</div>
              <h2 style={{ fontSize: 'clamp(30px, 3.5vw, 48px)', marginBottom: 24, lineHeight: 1.15 }}>
                America's Premier<br />Live Events Platform
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.85, fontSize: 16, marginBottom: 16 }}>
                Grab It Hot was built with one obsession: make experiencing live events effortless, exciting, and accessible to everyone. We connect passionate people with the most extraordinary moments happening across all 50 states.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.85, fontSize: 16, marginBottom: 40 }}>
                Whether it's a sold-out music festival under the California sky or an intimate comedy night in Chicago — we get you there with instant booking, guaranteed authenticity, and zero hassle.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
                {[
                  [<FaMusic />, 'Curated Selection', 'Every event hand-verified by our team'],
                  [<FaLock />, 'Secure Payments', '256-bit encryption on every transaction'],
                  [<FaBolt />, 'Instant Delivery', 'Tickets confirmed in seconds, not hours'],
                  [<FaMobileAlt />, 'Mobile First', 'Book from anywhere, any device'],
                ].map(([icon, title, desc]) => (
                  <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--flame-ghost)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, border: '1px solid var(--flame-glow)' }}>
                      <span style={{ display: 'inline-flex' }}>{icon}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link to={toFeatured} className="btn btn-primary" style={{ padding: '16px 36px', fontSize: 15 }}>
                Upcoming events →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HOW IT WORKS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ position: 'relative', overflow: 'hidden', background: '#0B0B0B' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1800&auto=format&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,8,0.9) 0%, rgba(8,8,8,0.8) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 10% 15%, rgba(255,59,47,0.16) 0%, transparent 35%)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="eyebrow" style={{ color: '#FF6A60' }}>Simple Process</div>
            <h2 style={{ fontSize: 'clamp(30px,4vw,46px)', color: 'white' }}>How It Works</h2>
            <p style={{ color: 'rgba(255,255,255,0.62)', marginTop: 12, fontSize: 16 }}>
              Three simple steps between you and your next great event
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 22 }}>
            {[
              { step: '01', icon: <FaSearch />, title: 'Discover', desc: 'Find curated events by city, date, category and budget in seconds.' },
              { step: '02', icon: <FaTicketAlt />, title: 'Book', desc: 'Choose tickets, enter details, and confirm your order instantly.' },
              { step: '03', icon: <FaCheckCircle />, title: 'Experience', desc: 'Receive confirmation and enjoy your event without any hassle.' },
            ].map(({ step, icon, title, desc }) => (
              <div
                key={step}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 'var(--r-xl)',
                  padding: '30px 26px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 16px 38px rgba(0,0,0,0.28)',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.25s var(--ease-out), border-color 0.25s var(--ease-out)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(255,106,96,0.38)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,59,47,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, color: '#FF6A60', border: '1px solid rgba(255,106,96,0.35)' }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: 36, fontWeight: 700, color: 'rgba(255,255,255,0.14)', lineHeight: 1 }}>{step}</span>
                </div>
                <h3 style={{ fontSize: 23, marginBottom: 10, fontFamily: 'var(--font-display)', color: 'white' }}>{title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 15, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          REVIEWS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="reviews" className="section section-ink" style={{ scrollMarginTop: 96 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="eyebrow" style={{ color: '#FF3B2F' }}>Social Proof</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', color: 'white' }}>What People Are Saying</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 12, fontSize: 16 }}>
              Thousands of event-goers trust Grab It Hot every single month
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            {REVIEWS.map((r, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--r-xl)', padding: '36px 32px', backdropFilter: 'blur(4px)' }}>
                <Stars n={r.rating} />
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.8, margin: '20px 0 24px', fontFamily: 'var(--font-display)', fontWeight: 300 }}>
                  "{r.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--flame)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: 'white', flexShrink: 0 }}>
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'white', fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{r.role} · {r.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CTA BAND
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: 'var(--flame)', padding: '80px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,52px)', color: 'white', marginBottom: 16 }}>
            Your next great night starts here.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, marginBottom: 36 }}>Join 500,000+ fans who found their favorite events on Grab It Hot.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={toFeatured} style={{ background: 'white', color: 'var(--flame)', borderRadius: '999px', padding: '17px 40px', fontSize: 16, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              Browse Events →
            </Link>
            <a href="#contact" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: '999px', padding: '16px 38px', fontSize: 16, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}>
              Contact us
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CONTACT
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="contact" className="section section-smoke" style={{ scrollMarginTop: 96 }}>
        <div className="container">
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="eyebrow"><FaEnvelope /> Reach Us</div>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)' }}>Get in Touch</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 16 }}>Want to host an event or have questions? We'd love to hear from you.</p>
            </div>

            {contactSent ? (
              <div style={{ background: 'white', borderRadius: 'var(--r-xl)', padding: '64px 40px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ fontSize: 56, marginBottom: 20, color: '#1A7A4A' }}><FaCheckCircle /></div>
                <h3 style={{ fontSize: 26, marginBottom: 10 }}>Message sent!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 'var(--r-xl)', padding: '48px 44px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }}>
                <form onSubmit={sendContact}>
                  <div className="form-field">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" type="text" required placeholder="John Doe" value={contact.name} onChange={e => setContact(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" required placeholder="john@example.com" value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Message</label>
                    <textarea className="form-input" required placeholder="Tell us what you have in mind..." value={contact.message} onChange={e => setContact(p => ({ ...p, message: e.target.value }))} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: 15 }} disabled={contactSending}>
                    {contactSending ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
