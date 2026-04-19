import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { GrabMarkIcon } from './GrabMarkIcon';

const toFeatured = { pathname: '/', hash: 'featured-events' };
const toAbout = { pathname: '/', hash: 'about' };
const toReviews = { pathname: '/', hash: 'reviews' };
const toContact = { pathname: '/', hash: 'contact' };

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* Only the home hero uses a dark underlay; other routes are light pages → solid bar + dark link text */
  const isDarkPage = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: toFeatured, label: 'Upcoming events', hash: true },
    { to: toAbout, label: 'About', hash: true },
    { to: toReviews, label: 'Reviews', hash: true },
    { to: toContact, label: 'Contact', hash: true },
  ];

  const scrolled_or_light = scrolled || !isDarkPage;

  const linkStyle = (scrolledLight) => ({
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    '--nav-link-color': scrolledLight ? '#0A0A0A' : 'rgba(255,255,255,0.95)',
    color: 'var(--nav-link-color)',
    transition: 'all 0.2s',
    textDecoration: 'none',
  });

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: 72,
        background: scrolled_or_light
          ? 'rgba(255,255,255,0.97)'
          : 'transparent',
        borderBottom: scrolled_or_light ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
        backdropFilter: scrolled_or_light ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled_or_light ? 'blur(20px)' : 'none',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link to="/" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em',
            color: scrolled_or_light ? '#0A0A0A' : 'white',
            transition: 'color 0.3s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}>
            Grab It <span style={{ color: '#FF3B2F' }}>Hot</span>
            <GrabMarkIcon style={{ filter: scrolled_or_light ? 'none' : 'brightness(0) invert(1)' }} />
          </Link>

          <div className="hide-mobile" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 0 }}>
            {navLinks.map((l) => (
              l.hash ? (
                <Link key={l.label} to={l.to} style={linkStyle(scrolled_or_light)} className="navbar-link">
                  {l.label}
                </Link>
              ) : (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) => `navbar-link ${isActive ? 'navbar-link--active' : ''}`}
                  style={({ isActive }) => ({
                    ...linkStyle(scrolled_or_light),
                    background: 'transparent',
                  })}
                >
                  {l.label}
                </NavLink>
              )
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Link to={toFeatured} className="btn btn-primary hide-mobile" style={{ padding: '11px 22px', fontSize: 14 }}>
              Browse Events
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              style={{ background: 'none', border: 'none', padding: 8, display: 'none', flexDirection: 'column', gap: 5 }}
              className="hamburger-btn"
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  display: 'block', width: 22, height: 2, borderRadius: 2,
                  background: scrolled_or_light ? '#0A0A0A' : 'white',
                  transition: 'all 0.3s',
                  transform: menuOpen
                    ? (i === 0 ? 'rotate(45deg) translate(5px,5px)' : i === 2 ? 'rotate(-45deg) translate(5px,-5px)' : 'scaleX(0)')
                    : 'none',
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>
      </nav>

      <div style={{
        position: 'fixed', top: 72, left: 0, right: 0, zIndex: 999,
        background: 'white',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
        padding: menuOpen ? '16px 24px 24px' : 0,
        maxHeight: menuOpen ? '80vh' : 0,
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {navLinks.map((l) => (
          <Link key={l.label} to={l.to}
            style={{ display: 'block', padding: '14px 0', fontSize: 16, fontWeight: 500, borderBottom: '1px solid rgba(0,0,0,0.06)', color: '#0A0A0A' }}>
            {l.label}
          </Link>
        ))}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link to={toFeatured} className="btn btn-primary" style={{ justifyContent: 'center' }}>Browse Events</Link>
        </div>
      </div>

      {!isDarkPage && <div style={{ height: 72 }} />}

      <style>{`
        @media (max-width: 768px) {
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
