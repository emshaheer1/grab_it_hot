import { format } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { FaBriefcase, FaLaughBeam, FaLaptopCode, FaMusic, FaPalette, FaTicketAlt, FaUtensils, FaFutbol } from 'react-icons/fa';

/** Listing / detail times for US events — stored as ISO but shown in Central (venue) time */
const EVENT_DISPLAY_TZ = 'America/Chicago';

export const formatDate = (date) => {
  try { return format(new Date(date), 'EEE, MMM d, yyyy'); }
  catch { return date; }
};

export const formatTime = (date) => {
  try { return format(new Date(date), 'h:mm a'); }
  catch { return ''; }
};

export const formatDateTime = (date) => {
  try { return format(new Date(date), 'EEE, MMM d, yyyy · h:mm a'); }
  catch { return date; }
};

/** Event start/end — always shown in venue timezone so “Apr 24, 7 PM Central” stays correct everywhere */
export const formatEventDateTime = (date) => {
  if (date == null || date === '') return '';
  try {
    return formatInTimeZone(new Date(date), EVENT_DISPLAY_TZ, 'EEE, MMM d, yyyy · h:mm a zzz');
  } catch {
    return String(date);
  }
};

export const formatEventDate = (date) => {
  if (date == null || date === '') return '';
  try {
    return formatInTimeZone(new Date(date), EVENT_DISPLAY_TZ, 'EEE, MMM d, yyyy');
  } catch {
    return String(date);
  }
};

/** Full event — uses `dateComingSoon` from API when set */
export const formatEventSchedule = (event) => {
  if (event?.dateComingSoon) return 'Coming soon';
  return formatEventDateTime(event?.date);
};

export const formatEventScheduleDate = (event) => {
  if (event?.dateComingSoon) return 'Coming soon';
  return formatEventDate(event?.date);
};

/** Month + day for card badge (Chicago date, not viewer’s local midnight) */
export const getEventMonthDayParts = (date) => {
  if (date == null || date === '') return { month: '', day: '' };
  try {
    const d = new Date(date);
    return {
      month: formatInTimeZone(d, EVENT_DISPLAY_TZ, 'MMM').toUpperCase(),
      day: formatInTimeZone(d, EVENT_DISPLAY_TZ, 'd'),
    };
  } catch {
    return { month: '', day: '' };
  }
};

/** UTC instant → value for `<input type="datetime-local">` as America/Chicago wall time */
export const eventDateToDatetimeLocalValue = (isoOrDate) => {
  if (isoOrDate == null || isoOrDate === '') return '';
  try {
    return formatInTimeZone(new Date(isoOrDate), EVENT_DISPLAY_TZ, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
};

/** Parses datetime-local string as Chicago local time → ISO UTC for the API */
export const datetimeLocalValueToEventIso = (str) => {
  if (str == null || String(str).trim() === '') return undefined;
  const normalized = String(str).length === 16 ? `${str}:00` : String(str);
  try {
    const d = toDate(normalized, { timeZone: EVENT_DISPLAY_TZ });
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  } catch {
    return undefined;
  }
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

/** Event-specific request flow discount applied to list price for direct-payment events. */
export const DIRECT_PAY_DISCOUNT_PER_TICKET = 10;
export const FARHAN_ZELLE_DISCOUNT_PER_TICKET = DIRECT_PAY_DISCOUNT_PER_TICKET;

export function isFarhanEvent(ev) {
  return Boolean(ev && /farhan/i.test(String(ev.title || '')));
}

export function isDjChetasEvent(ev) {
  return Boolean(ev && /dj\s*chetas/i.test(String(ev.title || '')));
}

export function hasDirectPayDiscount(event) {
  return isFarhanEvent(event) || isDjChetasEvent(event);
}

export function eventDiscountPerTicket(event) {
  return hasDirectPayDiscount(event) ? DIRECT_PAY_DISCOUNT_PER_TICKET : 0;
}

export function discountedEventUnitPrice(event, listPrice) {
  const n = Number(listPrice);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, n - eventDiscountPerTicket(event));
}

/** Drops a trailing "Contacts:" section (promoter phone lists) from public event copy. */
export function stripContactBlockFromDescription(text) {
  if (text == null || text === '') return '';
  return String(text).replace(/\n+Contacts:\s*\n[\s\S]*$/i, '').trimEnd();
}

/**
 * If copy contains a paragraph starting with "Grab It Hot" after a blank line, split for hero layout
 * (main body + bottom-aligned closing card next to the poster).
 */
export function splitGrabItHotClosing(text) {
  const cleaned = stripContactBlockFromDescription(text || '');
  const re = /\n\n(?=Grab It Hot\b)/;
  const idx = cleaned.search(re);
  if (idx === -1) return { body: cleaned, closing: null };
  return {
    body: cleaned.slice(0, idx).trimEnd(),
    closing: cleaned.slice(idx + 2).trim(),
  };
}

/** One-line venue + street + city, state ZIP (e.g. ticket request summary). */
export function formatEventLocationOneLine(loc) {
  if (!loc || typeof loc !== 'object') return '';
  const venue = String(loc.venue || '').trim();
  const address = String(loc.address || '').trim();
  const city = String(loc.city || '').trim();
  const state = String(loc.state || '').trim();
  const zipCode = String(loc.zipCode || '').trim();
  const left = [venue, address].filter(Boolean).join(' ').trim();
  const stateZip = [state, zipCode].filter(Boolean).join(' ').trim();
  const right = [city, stateZip].filter(Boolean).join(', ').trim();
  if (left && right) return `${left}, ${right}`;
  if (left) return left;
  if (right) return right;
  return '';
}

/** Event `image` values are `/uploads/...` on the API host. On Vercel they must use the API origin or the browser loads the wrong host / a placeholder. */
export function resolveEventImageUrl(src) {
  if (src == null || src === '') return '';
  const s = String(src).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const apiUrl = process.env.REACT_APP_API_URL || '';
  const origin = apiUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  if (origin && s.startsWith('/')) return `${origin}${s}`;
  return s;
}

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'confirmed': return 'badge-green';
    case 'cancelled': return 'badge-gray';
    default: return 'badge-red';
  }
};

export const getCategoryIcon = (category) => {
  const icons = {
    Music: FaMusic,
    Comedy: FaLaughBeam,
    Tech: FaLaptopCode,
    Sports: FaFutbol,
    Arts: FaPalette,
    Food: FaUtensils,
    Business: FaBriefcase,
    Other: FaTicketAlt,
  };
  return icons[category] || FaTicketAlt;
};
