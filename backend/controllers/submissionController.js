const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const Event = require('../models/Event');
const ContactMessage = require('../models/ContactMessage');
const TicketRequest = require('../models/TicketRequest');

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseOrderIdFromNotes(notes) {
  const m = String(notes || '').match(/Order ID:\s*(\S+)/i);
  return m ? m[1].trim() : '';
}

function formatUsd(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function parseTotalFromNotes(notes) {
  const text = String(notes || '');
  const m = text.match(/(?:Zelle amount due|Estimated total):\s*(\$[0-9,]+(?:\.[0-9]{1,2})?)/i);
  return m ? m[1].trim() : '';
}

const TICKET_REQUEST_EMAIL_LOGO_CID = 'grabithot-logo';

async function sendTicketRequestThankYouEmail({ toEmail, fullName, eventTitle, orderId, tierName, quantity, totalDisplay }) {
  if (!process.env.SMTP_HOST || !process.env.FROM_EMAIL) {
    console.warn('Ticket request thank-you email skipped: SMTP not configured');
    return;
  }
  try {
    const logoPath = path.join(__dirname, '..', 'email-assets', 'grab-mark.png');
    const logoExists = fs.existsSync(logoPath);
    const attachments = logoExists
      ? [{ filename: 'grab-mark.png', path: logoPath, cid: TICKET_REQUEST_EMAIL_LOGO_CID }]
      : [];

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const safeName = escapeHtml(fullName);
    const safeTitle = escapeHtml(eventTitle);
    const safeOrder = escapeHtml(orderId || '—');
    const safeEmail = escapeHtml(toEmail);
    const safeTier = escapeHtml(tierName);
    const safeTotal = escapeHtml(totalDisplay || '—');

    const logoCell = logoExists
      ? `<td style="vertical-align:middle;padding-right:14px"><img src="cid:${TICKET_REQUEST_EMAIL_LOGO_CID}" alt="" width="48" height="48" style="display:block;border:0;line-height:0" /></td>`
      : '';

    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Grab It Hot'}" <${process.env.FROM_EMAIL}>`,
      to: toEmail,
      subject: `We received your ticket request — ${eventTitle}`,
      attachments,
      html: `
        <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:28px 24px 32px;color:#1a1a1a">
          <h1 style="margin:0 0 22px;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#111;line-height:1.2">Thank you</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#333">Hi ${safeName},</p>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.65;color:#444">
            We have received your ticket request for <strong>${safeTitle}</strong>.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:0 0 22px;font-size:14px">
            <tr><td style="padding:10px 12px;background:#f5f5f5;border:1px solid #e8e8e8;width:36%"><strong>Ticket</strong></td><td style="padding:10px 12px;border:1px solid #e8e8e8">${safeTier} × ${Number(quantity) || 1}</td></tr>
            <tr><td style="padding:10px 12px;background:#f5f5f5;border:1px solid #e8e8e8"><strong>Total</strong></td><td style="padding:10px 12px;border:1px solid #e8e8e8;font-weight:700;color:#111">${safeTotal}</td></tr>
            <tr><td style="padding:10px 12px;background:#f5f5f5;border:1px solid #e8e8e8"><strong>Order ID</strong></td><td style="padding:10px 12px;border:1px solid #e8e8e8;font-family:ui-monospace,monospace;font-weight:700">${safeOrder}</td></tr>
          </table>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#333">
            We will verify your payment using your order ID <strong>${safeOrder}</strong>.
            After verification, your tickets will be sent to <strong>${safeEmail}</strong>.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:36px;border-top:1px solid #e8e8e8;padding-top:28px">
            <tr>
              <td align="center" style="padding:0">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;border-collapse:collapse">
                  <tr>
                    ${logoCell}
                    <td style="vertical-align:middle;font-size:22px;font-weight:800;color:#FF3B2F;letter-spacing:-0.02em;line-height:1">Grab It Hot</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    });
  } catch (err) {
    console.error('Ticket request thank-you email error:', err.message);
  }
}

exports.createContact = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }
    const doc = await ContactMessage.create({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

exports.createTicketRequest = async (req, res, next) => {
  try {
    const { fullName, email, phone, eventId, tierId, quantity, notes } = req.body;
    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !eventId || !tierId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const tier = event.ticketTiers.id(tierId);
    if (!tier) {
      return res.status(400).json({ success: false, message: 'Invalid ticket tier for this event' });
    }

    const qty = Math.min(50, Math.max(1, parseInt(quantity, 10) || 1));

    const notesTrimmed = (notes || '').trim();
    const doc = await TicketRequest.create({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      event: event._id,
      eventTitle: event.title,
      tierId: tier._id,
      tierName: tier.name,
      quantity: qty,
      notes: notesTrimmed,
      paymentScreenshot: '',
      status: 'new',
    });

    const orderId = parseOrderIdFromNotes(notesTrimmed);
    const totalFromNotes = parseTotalFromNotes(notesTrimmed);
    const fallbackTotal = formatUsd(tier.price * qty);
    sendTicketRequestThankYouEmail({
      toEmail: doc.email,
      fullName: doc.fullName,
      eventTitle: doc.eventTitle,
      orderId,
      tierName: doc.tierName,
      quantity: doc.quantity,
      totalDisplay: totalFromNotes || fallbackTotal,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};
