const fs = require('fs');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');

function getSmtpPort() {
  const p = Number(process.env.SMTP_PORT);
  return Number.isFinite(p) && p > 0 ? p : 587;
}

function isResendConfigured() {
  return Boolean(String(process.env.RESEND_API_KEY || '').trim());
}

function isRelayConfigured() {
  return Boolean(
    String(process.env.MAIL_RELAY_URL || '').trim() &&
    String(process.env.MAIL_RELAY_SECRET || '').trim(),
  );
}

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS,
  );
}

function isMailConfigured() {
  return isResendConfigured() || isRelayConfigured() || isSmtpConfigured();
}

function getMailTransportType() {
  if (isResendConfigured()) return 'resend';
  if (isRelayConfigured()) return 'ionos-relay';
  if (isSmtpConfigured()) return 'smtp';
  return 'none';
}

function getMailStatus() {
  const type = getMailTransportType();
  if (type === 'resend') return 'configured (resend)';
  if (type === 'ionos-relay') return 'configured (ionos-relay)';
  if (type === 'smtp') return 'configured (smtp)';
  return 'missing_mail_env';
}

function normalizeSmtpPass(pass) {
  return String(pass || '').replace(/\s+/g, '').trim();
}

/** Gmail and most SMTP hosts require From to match the authenticated mailbox. */
function getFromAddress() {
  const user = String(process.env.SMTP_USER || '').trim();
  const from = String(process.env.FROM_EMAIL || '').trim();
  const host = String(process.env.SMTP_HOST || '').toLowerCase();
  if (isResendConfigured()) {
    return from || user || '';
  }
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
  if (!isSmtpConfigured()) return null;

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
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    family: 4,
    tls: {
      minVersion: 'TLSv1.2',
    },
    ...(secure ? {} : { requireTLS: true }),
  });
}

function mapAttachmentsForResend(attachments) {
  if (!attachments?.length) return undefined;
  return attachments.map((a) => {
    let content = a.content;
    if (!content && a.path) {
      content = fs.readFileSync(a.path).toString('base64');
    } else if (Buffer.isBuffer(content)) {
      content = content.toString('base64');
    }
    const item = {
      filename: a.filename || 'attachment',
      content: String(content || ''),
    };
    if (a.cid) item.content_id = a.cid;
    return item;
  });
}

function normalizeRecipients(to) {
  const raw = Array.isArray(to) ? to : String(to || '').split(/[,;]/);
  return raw.map((e) => String(e).trim()).filter(Boolean);
}

async function sendViaResend({ to, subject, html, text, attachments }) {
  const from = getFromHeader();
  if (!from) {
    console.warn('[mail] Resend skipped — set FROM_EMAIL to a verified sender (e.g. tickets@grabithot.com)');
    return { ok: false, error: 'no_from_address' };
  }

  const resend = new Resend(String(process.env.RESEND_API_KEY).trim());
  const recipients = normalizeRecipients(to);
  if (!recipients.length) {
    return { ok: false, error: 'no_recipients' };
  }

  const { data, error } = await resend.emails.send({
    from,
    to: recipients,
    subject,
    html,
    text,
    attachments: mapAttachmentsForResend(attachments),
  });

  if (error) {
    console.error('[mail] Resend send failed:', error.message || error);
    return { ok: false, error: error.message || String(error) };
  }

  console.log(`[mail] Resend sent — id ${data?.id || 'unknown'} → ${recipients.join(', ')}`);
  return { ok: true, id: data?.id };
}

async function sendViaRelay({ to, subject, html, text }) {
  const url = String(process.env.MAIL_RELAY_URL || '').trim();
  const secret = String(process.env.MAIL_RELAY_SECRET || '').trim();
  const recipients = normalizeRecipients(to);
  if (!recipients.length) {
    return { ok: false, error: 'no_recipients' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mail-Relay-Secret': secret,
      },
      body: JSON.stringify({
        to: recipients.join(', '),
        subject,
        html: html || `<pre>${text || ''}</pre>`,
        text: text || undefined,
      }),
      signal: AbortSignal.timeout(25000),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      const err = payload.error || `HTTP ${response.status}`;
      console.error('[mail] IONOS relay failed:', err);
      return { ok: false, error: err };
    }

    console.log(`[mail] IONOS relay sent → ${recipients.join(', ')}`);
    return { ok: true };
  } catch (err) {
    console.error('[mail] IONOS relay error:', err.message);
    return { ok: false, error: err.message };
  }
}

async function sendViaSmtp({ to, subject, html, text, attachments }) {
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
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      attachments,
    });
    console.log(`[mail] SMTP sent — ${info.messageId || 'ok'} → ${to}`);
    return { ok: true, id: info.messageId };
  } catch (err) {
    console.error('[mail] Send failed:', err.message);
    if (err.response) console.error('[mail] SMTP response:', err.response);
    if (String(err.message || '').toLowerCase().includes('timeout') || err.code === 'ETIMEDOUT') {
      console.error('[mail] Render free tier blocks SMTP ports 587/465 — use RESEND_API_KEY on production instead.');
    }
    return { ok: false, error: err.message };
  }
}

async function verifyMailTransport() {
  if (isRelayConfigured()) {
    console.log(`[mail] IONOS relay ready — ${process.env.MAIL_RELAY_URL}`);
    return true;
  }

  if (isResendConfigured()) {
    const from = getFromAddress();
    if (!from) {
      console.warn('[mail] Resend: set FROM_EMAIL to an address verified in your Resend dashboard');
      return false;
    }
    console.log(`[mail] Resend API ready — sending as ${from}`);
    if (from.toLowerCase().endsWith('@gmail.com')) {
      console.warn('[mail] Resend cannot send as @gmail.com — verify grabithot.com in Resend and use e.g. tickets@grabithot.com');
    }
    return true;
  }

  if (!isSmtpConfigured()) {
    console.warn('[mail] Mail not configured (set RESEND_API_KEY for Render, or SMTP_HOST/SMTP_USER/SMTP_PASS locally)');
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
    console.error('[mail] On Render free tier, SMTP is blocked — set RESEND_API_KEY instead.');
    console.error('[mail] Gmail tip: SMTP_USER=grabithot@gmail.com, FROM_EMAIL=same address, SMTP_PASS=16-char App Password (2FA on)');
    return false;
  }
}

async function sendMail({ to, subject, html, text, attachments }) {
  if (isResendConfigured()) {
    return sendViaResend({ to, subject, html, text, attachments });
  }
  if (isRelayConfigured()) {
    return sendViaRelay({ to, subject, html, text, attachments });
  }
  return sendViaSmtp({ to, subject, html, text, attachments });
}

module.exports = {
  createMailTransporter,
  getFromAddress,
  getFromHeader,
  getMailStatus,
  getMailTransportType,
  getSmtpPort,
  isMailConfigured,
  sendMail,
  verifyMailTransport,
};
