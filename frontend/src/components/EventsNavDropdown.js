import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa6';

const EventsNavDropdown = ({ scrolledLight, linkStyle, mobile = false, onNavigate }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const isEventsRoute = location.pathname.startsWith('/events');

  useEffect(() => {
    if (mobile) return undefined;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [mobile]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const items = [
    { to: '/events/upcoming', label: 'Upcoming events' },
    { to: '/events/past', label: 'Past events' },
  ];

  if (mobile) {
    return (
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '14px 0',
            fontSize: 16,
            fontWeight: 500,
            background: 'none',
            border: 'none',
            color: '#0A0A0A',
          }}
        >
          Events
          <FaChevronDown style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {open ? (
          <div style={{ paddingBottom: 8, paddingLeft: 12 }}>
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                style={{
                  display: 'block',
                  padding: '10px 0',
                  fontSize: 15,
                  color: location.pathname === item.to ? '#FF3B2F' : '#4A4540',
                  fontWeight: location.pathname === item.to ? 600 : 500,
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="events-nav-dropdown" style={{ position: 'relative' }}>
      <button
        type="button"
        className={`navbar-link events-nav-dropdown__trigger${isEventsRoute ? ' navbar-link--active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          ...linkStyle(scrolledLight),
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Events
        <FaChevronDown
          style={{
            fontSize: 11,
            opacity: 0.7,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>
      {open ? (
        <div className="events-nav-dropdown__menu" role="menu">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              className={`events-nav-dropdown__item${location.pathname === item.to ? ' events-nav-dropdown__item--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default EventsNavDropdown;
