const { getAdminEmail } = require('../config/adminCredentials');
const { sendMail } = require('./mailTransport');

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getAdminAlertRecipients() {
  const raw = process.env.ADMIN_ALERT_EMAIL || getAdminEmail() || process.env.FROM_EMAIL || '';
  return String(raw)
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter(Boolean);
}

function getAdminDashboardUrl() {
  const base = String(process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}/admin`;
}

async function sendAdminAlert({ subject, html, text }) {
  const recipients = getAdminAlertRecipients();
  if (!recipients.length) {
    console.warn('[mail] Admin alert skipped: set ADMIN_ALERT_EMAIL or ADMIN_EMAIL');
    return { ok: false, error: 'no_recipients' };
  }
  return sendMail({
    to: recipients.join(', '),
    subject,
    html,
    text,
  });
}

/**
 * Instant email when a customer submits a ticket request (Zelle flow).
 */
async function sendTicketRequestAdminAlert({
  fullName,
  email,
  phone,
  eventTitle,
  tierName,
  quantity,
  orderId,
  totalDisplay,
  notes,
}) {
  const adminUrl = getAdminDashboardUrl();
  const safe = {
    fullName: escapeHtml(fullName),
    email: escapeHtml(email),
    phone: escapeHtml(phone),
    eventTitle: escapeHtml(eventTitle),
    tierName: escapeHtml(tierName),
    orderId: escapeHtml(orderId || '—'),
    totalDisplay: escapeHtml(totalDisplay || '—'),
    notes: escapeHtml(notes || '').replace(/\n/g, '<br/>'),
  };

  await sendAdminAlert({
    subject: `New ticket request — ${eventTitle}`,
    text: [
      'New ticket request on Grab It Hot',
      '',
      `Event: ${eventTitle}`,
      `Customer: ${fullName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Ticket: ${tierName} × ${quantity}`,
      `Total: ${totalDisplay || '—'}`,
      `Order ID: ${orderId || '—'}`,
      '',
      notes ? `Notes:\n${notes}` : '',
      '',
      `Open admin: ${adminUrl}`,
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#FF3B2F">New ticket request</p>
        <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#111">${safe.eventTitle}</h1>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:8px 10px;background:#f5f5f5;border:1px solid #e8e8e8;width:34%"><strong>Customer</strong></td><td style="padding:8px 10px;border:1px solid #e8e8e8">${safe.fullName}</td></tr>
          <tr><td style="padding:8px 10px;background:#f5f5f5;border:1px solid #e8e8e8"><strong>Email</strong></td><td style="padding:8px 10px;border:1px solid #e8e8e8"><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
          <tr><td style="padding:8px 10px;background:#f5f5f5;border:1px solid #e8e8e8"><strong>Phone</strong></td><td style="padding:8px 10px;border:1px solid #e8e8e8">${safe.phone}</td></tr>
          <tr><td style="padding:8px 10px;background:#f5f5f5;border:1px solid #e8e8e8"><strong>Ticket</strong></td><td style="padding:8px 10px;border:1px solid #e8e8e8">${safe.tierName} × ${Number(quantity) || 1}</td></tr>
          <tr><td style="padding:8px 10px;background:#f5f5f5;border:1px solid #e8e8e8"><strong>Total</strong></td><td style="padding:8px 10px;border:1px solid #e8e8e8;font-weight:700">${safe.totalDisplay}</td></tr>
          <tr><td style="padding:8px 10px;background:#f5f5f5;border:1px solid #e8e8e8"><strong>Order ID</strong></td><td style="padding:8px 10px;border:1px solid #e8e8e8;font-family:monospace;font-weight:700">${safe.orderId}</td></tr>
        </table>
        ${safe.notes ? `<p style="font-size:13px;line-height:1.6;color:#444;margin:0 0 20px"><strong>Payment notes</strong><br/>${safe.notes}</p>` : ''}
        <a href="${adminUrl}" style="display:inline-block;background:#FF3B2F;color:white;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:14px">Open admin dashboard</a>
      </div>
    `,
  });
}

/**
 * Instant email when a logged-in user completes a booking (legacy checkout flow).
 */
async function sendBookingAdminAlert({ booking, event, tier }) {
  const adminUrl = getAdminDashboardUrl();
  const attendee = booking.attendeeInfo || {};
  await sendAdminAlert({
    subject: `New booking — ${event.title}`,
    text: [
      'New booking on Grab It Hot',
      '',
      `Event: ${event.title}`,
      `Customer: ${attendee.fullName}`,
      `Email: ${attendee.email}`,
      `Ticket: ${tier?.name || booking.ticketTier?.name} × ${booking.quantity}`,
      `Total: $${booking.totalAmount}`,
      `Booking ID: ${booking.bookingId}`,
      '',
      `Open admin: ${adminUrl}`,
    ].join('\n'),
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#FF3B2F">New booking</p>
        <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#111">${escapeHtml(event.title)}</h1>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:8px 10px;background:#f5f5f5;border:1px solid #e8e8e8;width:34%"><strong>Customer</strong></td><td style="padding:8px 10px;border:1px solid #e8e8e8">${escapeHtml(attendee.fullName)}</td></tr>
          <tr><td style="padding:8px 10px;background:#f5f5f5;border:1px solid #e8e8e8"><strong>Email</strong></td><td style="padding:8px 10px;border:1px solid #e8e8e8">${escapeHtml(attendee.email)}</td></tr>
          <tr><td style="padding:8px 10px;background:#f5f5f5;border:1px solid #e8e8e8"><strong>Ticket</strong></td><td style="padding:8px 10px;border:1px solid #e8e8e8">${escapeHtml(tier?.name || booking.ticketTier?.name)} × ${booking.quantity}</td></tr>
          <tr><td style="padding:8px 10px;background:#f5f5f5;border:1px solid #e8e8e8"><strong>Total</strong></td><td style="padding:8px 10px;border:1px solid #e8e8e8;font-weight:700">$${escapeHtml(booking.totalAmount)}</td></tr>
          <tr><td style="padding:8px 10px;background:#f5f5f5;border:1px solid #e8e8e8"><strong>Booking ID</strong></td><td style="padding:8px 10px;border:1px solid #e8e8e8;font-family:monospace;font-weight:700">${escapeHtml(booking.bookingId)}</td></tr>
        </table>
        <a href="${adminUrl}" style="display:inline-block;background:#FF3B2F;color:white;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:14px">Open admin dashboard</a>
      </div>
    `,
  });
}

module.exports = {
  sendTicketRequestAdminAlert,
  sendBookingAdminAlert,
  getAdminAlertRecipients,
};
