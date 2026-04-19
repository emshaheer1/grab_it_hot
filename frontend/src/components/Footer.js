import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube, FaLocationDot, FaPhone, FaEnvelope } from 'react-icons/fa6';
import { GrabMarkIcon } from './GrabMarkIcon';

const Footer = () => (
  <footer style={{ background: '#0A0A0A', color: 'white', paddingTop: 80 }}>
    <div className="container">
      {/* Top grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.4fr', gap: 48, paddingBottom: 64, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Brand column */}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Grab It <span style={{ color: '#FF3B2F' }}>Hot</span> <GrabMarkIcon style={{ marginLeft: 4 }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.8, maxWidth: 280, marginBottom: 28 }}>
            America's most trusted event ticketing platform. Connecting 500K+ fans with the country's best live experiences.
          </p>
          {/* Social icons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { icon: <FaXTwitter />, label: 'Twitter', href: 'https://x.com' },
              { icon: <FaFacebookF />, label: 'Facebook', href: 'https://facebook.com' },
              { icon: <FaLinkedinIn />, label: 'LinkedIn', href: 'https://linkedin.com' },
              { icon: <FaYoutube />, label: 'YouTube', href: 'https://youtube.com' },
              { icon: <FaInstagram />, label: 'Instagram', href: 'https://instagram.com' },
            ].map(({ icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255,255,255,0.45)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FF3B2F'; e.currentTarget.style.borderColor = '#FF3B2F'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}>
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 22 }}>Quick Links</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['/', 'Home'],
              [{ pathname: '/', hash: 'featured-events' }, 'Upcoming events'],
              [{ pathname: '/', hash: 'about' }, 'About'],
              [{ pathname: '/', hash: 'reviews' }, 'Reviews'],
              [{ pathname: '/', hash: 'contact' }, 'Contact'],
            ].map(([to, label]) => (
              <Link key={typeof to === 'string' ? to : `${to.pathname}#${to.hash}`} to={to}
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 22 }}>Categories</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Music'].map((cat) => (
              <Link key={cat} to={{ pathname: '/', hash: 'featured-events' }}
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact + newsletter */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 22 }}>Get in Touch</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {[
              [<FaLocationDot />, '123 Event Ave, New York, NY 10001'],
              [<FaPhone />, '+1 (800) 123-4567'],
              [<FaEnvelope />, 'hello@grabit-hot.com'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>{icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
          {/* Newsletter micro-form */}
          <div style={{ display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <input placeholder="Your email" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', outline: 'none', padding: '12px 14px', fontSize: 13, color: 'white', fontFamily: 'var(--font-body)' }} />
            <button style={{ background: '#FF3B2F', border: 'none', padding: '12px 18px', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Subscribe
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 8 }}>Get notified about new events near you.</p>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
          © {new Date().getFullYear()} Grab It Hot. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Sitemap'].map((t) => (
            <a key={t} href={`/${t.toLowerCase().replace(/\s+/g, '-')}`} style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
              {t}
            </a>
          ))}
        </div>
      </div>
    </div>

    <style>{`
      @media (max-width: 900px) {
        footer .container > div:first-child {
          grid-template-columns: 1fr 1fr !important;
        }
      }
      @media (max-width: 580px) {
        footer .container > div:first-child {
          grid-template-columns: 1fr !important;
        }
        footer .container > div:last-child {
          flex-direction: column !important;
          align-items: flex-start !important;
        }
      }
    `}</style>
  </footer>
);

export default Footer;
