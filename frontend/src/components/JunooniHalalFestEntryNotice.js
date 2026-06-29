import React from 'react';
import { FaCircleInfo } from 'react-icons/fa6';

/** Shown during Junooni Tour checkout — Halal Fest gate entry is separate from concert tickets. */
export default function JunooniHalalFestEntryNotice({ style }) {
  return (
    <div
      role="note"
      style={{
        borderRadius: 'var(--r-lg)',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        background: 'linear-gradient(180deg, #eff6ff 0%, #f0f9ff 100%)',
        padding: '14px 16px',
        ...style,
      }}
    >
      <p style={{ margin: 0, fontSize: 14, color: '#1e3a8a', lineHeight: 1.65, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <FaCircleInfo style={{ flexShrink: 0, marginTop: 3, color: '#2563eb' }} aria-hidden />
        <span>
          <strong style={{ color: '#1e40af' }}>Please note:</strong>{' '}
          Halal Fest entry tickets are sold separately at the venue gate for $10. This ticket is separate from the concert ticket.
        </span>
      </p>
    </div>
  );
}
