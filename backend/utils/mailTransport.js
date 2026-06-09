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

/** IONOS and most hosts require FROM to match the authenticated mailbox. */
function getFromAddress() {
  return String(process.env.FROM_EMAIL || process.env.SMTP_USER || '').trim();
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
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
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
    console.error('[mail] IONOS tip: SMTP_HOST=smtp.ionos.com, PORT=587, SMTP_USER=full@yourdomain.com, FROM_EMAIL=same as SMTP_USER');
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
