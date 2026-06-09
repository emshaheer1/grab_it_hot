const nodemailer = require('nodemailer');

function getSmtpPort() {
  const p = Number(process.env.SMTP_PORT);
  return Number.isFinite(p) && p > 0 ? p : 587;
}

function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS,
  );
}

function normalizeSmtpPass(pass) {
  return String(pass || '').replace(/\s+/g, '').trim();
}

/** Gmail and most SMTP hosts require From to match the authenticated mailbox. */
function getFromAddress() {
  const user = String(process.env.SMTP_USER || '').trim();
  const from = String(process.env.FROM_EMAIL || '').trim();
  const host = String(process.env.SMTP_HOST || '').toLowerCase();
  if (host.includes('gmail') && user) {
    if (from && from.toLowerCase() !== user.toLowerCase()) {
      console.warn(`[mail] Gmail requires From = SMTP_USER; using ${user} instead of ${from}`);
    }
    return user;
  }
  return from || user;
}

function getFromHeader() {
  const addr = getFromAddress();
  if (!addr) return null;
  return `"${process.env.FROM_NAME || 'Grab It Hot'}" <${addr}>`;
}

function createMailTransporter() {
  if (!isMailConfigured()) return null;

  const port = getSmtpPort();
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    process.env.SMTP_SECURE === '1' ||
    port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: String(process.env.SMTP_USER || '').trim(),
      pass: normalizeSmtpPass(process.env.SMTP_PASS),
    },
    tls: {
      minVersion: 'TLSv1.2',
    },
    ...(secure ? {} : { requireTLS: true }),
  });
}

async function verifyMailTransport() {
  if (!isMailConfigured()) {
    console.warn('[mail] SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS on the server)');
    return false;
  }
  if (!getFromAddress()) {
    console.warn('[mail] Set FROM_EMAIL or use SMTP_USER as the sender address');
  }
  const transporter = createMailTransporter();
  if (!transporter) return false;
  try {
    await transporter.verify();
    console.log(
      `[mail] SMTP ready — ${process.env.SMTP_HOST}:${getSmtpPort()} as ${process.env.SMTP_USER}`,
    );
    return true;
  } catch (err) {
    console.error('[mail] SMTP verify failed:', err.message);
    if (err.response) console.error('[mail] SMTP response:', err.response);
    console.error('[mail] Gmail tip: SMTP_USER=grabithot@gmail.com, FROM_EMAIL=same address, SMTP_PASS=16-char App Password (2FA on)');
    return false;
  }
}

async function sendMail({ to, subject, html, text, attachments }) {
  const from = getFromHeader();
  if (!from) {
    console.warn('[mail] Skipped — no FROM_EMAIL or SMTP_USER');
    return { ok: false, error: 'no_from_address' };
  }
  const transporter = createMailTransporter();
  if (!transporter) {
    console.warn('[mail] Skipped — SMTP not configured');
    return { ok: false, error: 'not_configured' };
  }
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      attachments,
    });
    return { ok: true };
  } catch (err) {
    console.error('[mail] Send failed:', err.message);
    if (err.response) console.error('[mail] SMTP response:', err.response);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  createMailTransporter,
  getFromAddress,
  getFromHeader,
  getSmtpPort,
  isMailConfigured,
  sendMail,
  verifyMailTransport,
};
