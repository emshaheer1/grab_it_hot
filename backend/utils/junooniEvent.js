function isJunooniTourEvent(eventOrTitle) {
  const title = typeof eventOrTitle === 'string' ? eventOrTitle : eventOrTitle?.title;
  return /junooni/i.test(String(title || ''));
}

const HALAL_FEST_ENTRY_NOTICE_TEXT =
  'Please note: Halal Fest entry tickets are sold separately at the venue gate for $10. This ticket is separate from the concert ticket.';

function halalFestEntryNoticeHtml() {
  // Neutral high-contrast callout: readable in color, grayscale, and inverted dark-mode email clients.
  return `
          <div style="margin:0 0 22px;padding:14px 16px 14px 18px;border:2px solid #1a1a1a;border-left:6px solid #1a1a1a;background-color:#f2f2f2;border-radius:4px;">
            <p style="margin:0;font-size:14px;line-height:1.7;color:#000000;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <strong style="color:#000000;font-weight:700;">Please note:</strong>
              Halal Fest entry tickets are sold separately at the venue gate for $10. This ticket is separate from the concert ticket.
            </p>
          </div>`;
}

module.exports = {
  isJunooniTourEvent,
  HALAL_FEST_ENTRY_NOTICE_TEXT,
  halalFestEntryNoticeHtml,
};
