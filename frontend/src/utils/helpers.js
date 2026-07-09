import { format } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { FaBriefcase, FaLaughBeam, FaLaptopCode, FaMusic, FaPalette, FaTicketAlt, FaUtensils, FaFutbol } from 'react-icons/fa';

/** Listing / detail times for US events — stored as ISO but shown in Central (venue) time */
const EVENT_DISPLAY_TZ = 'America/Chicago';

export function isJunooniTourEvent(ev) {
  return Boolean(ev && /junooni/i.test(String(ev.title || '')));
}

export function isJunooniChicagoEvent(ev) {
  return isJunooniTourEvent(ev) && /chicago/i.test(String(ev.title || ''));
}

export function isJunooniDallasEvent(ev) {
  return isJunooniTourEvent(ev) && /dallas/i.test(String(ev.title || ''));
}

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
  if (isJunooniChicagoEvent(event)) {
    return 'Sat, Aug 8, 2026 · Gates 6:30 PM · Show 7:30 PM CDT';
  }
  if (isJunooniDallasEvent(event)) {
    return 'Sat, Aug 15, 2026 · Gates 8:00 PM · Show 8:30 PM CDT';
  }
  return formatEventDateTime(event?.date);
};

export const formatEventScheduleDate = (event) => {
  if (event?.dateComingSoon) return 'Coming soon';
  if (isJunooniChicagoEvent(event)) return 'Sat, Aug 8, 2026';
  if (isJunooniDallasEvent(event)) return 'Sat, Aug 15, 2026';
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
export const ARJUN_RAMPAL_LIST_PRICE = 99;
export const ARJUN_RAMPAL_SALE_PRICE = 75;
export const ARJUN_RAMPAL_DISCOUNT_PER_TICKET = ARJUN_RAMPAL_LIST_PRICE - ARJUN_RAMPAL_SALE_PRICE;

/** List / sale prices for Junooni Tour ticket tiers — fallback when `salePrice` is not in DB. */
export const JUNOONI_TIER_PRICES = {
  'General Admission': { list: 45, sale: 40 },
  VIP: { list: 75, sale: 70 },
  VVIP: { list: 150, sale: 125 },
};

export const JUNOONI_VVIP_DISPLAY_SUFFIX = '(Meet&Greet Included)';

function findEventTier(event, tierName, listPrice) {
  if (!event?.ticketTiers?.length) return null;
  if (tierName) {
    const byName = event.ticketTiers.find((t) => t.name === tierName);
    if (byName) return byName;
  }
  if (listPrice != null && listPrice !== '') {
    const n = Number(listPrice);
    if (!Number.isNaN(n)) {
      return event.ticketTiers.find((t) => Number(t.price) === n) || null;
    }
  }
  return null;
}

/** Pricing from tier DB fields (`price` = list, `salePrice` = sale). */
export function tierPricingFromDb(tier) {
  if (!tier) return null;
  const list = Number(tier.price);
  if (Number.isNaN(list)) return null;
  const saleRaw = tier.salePrice;
  if (saleRaw != null && saleRaw !== '' && !Number.isNaN(Number(saleRaw))) {
    return { list, sale: Number(saleRaw) };
  }
  return null;
}

function junooniTierKey(tierName) {
  if (!tierName) return null;
  const normalized = String(tierName).trim().toLowerCase();
  return Object.keys(JUNOONI_TIER_PRICES).find(
    (k) => normalized === k.toLowerCase() || normalized.startsWith(`${k.toLowerCase()} `),
  ) || null;
}

export function junooniTierPricing(tierName) {
  const key = junooniTierKey(tierName);
  return key ? JUNOONI_TIER_PRICES[key] : null;
}

/** Junooni VVIP label shown on event and checkout UI. */
export function junooniTierDisplayName(event, tierName) {
  if (!tierName) return tierName;
  if (isJunooniChicagoEvent(event) && junooniTierKey(tierName) === 'VVIP') {
    return `VVIP ${JUNOONI_VVIP_DISPLAY_SUFFIX}`;
  }
  return tierName;
}

export function isFarhanEvent(ev) {
  return Boolean(ev && /farhan/i.test(String(ev.title || '')));
}

export function isDjChetasEvent(ev) {
  return Boolean(ev && /dj\s*chetas/i.test(String(ev.title || '')));
}

export function isArjunRampalEvent(ev) {
  return Boolean(ev && /arjun\s*rampal|rampage\s*tour/i.test(String(ev.title || '')));
}

export function isHiddenFromHomeFeatured(ev) {
  if (!ev?.title) return false;
  return /^(DJ\s+Chetas|Jigrra\s+Live|Arjun\s+Rampal|Rampage\s+Tour)/i.test(String(ev.title));
}

/** Home featured carousel shows Junooni Tour only. */
export function isHomeFeaturedEvent(ev) {
  return isJunooniTourEvent(ev);
}

export function eventDiscountPerTicket(event, tierName, listPrice) {
  const tier = findEventTier(event, tierName, listPrice);
  const dbPricing = tierPricingFromDb(tier);
  if (dbPricing) return Math.max(0, dbPricing.list - dbPricing.sale);
  const junooni = isJunooniChicagoEvent(event) && tierName ? junooniTierPricing(tierName) : null;
  if (junooni) return junooni.list - junooni.sale;
  if (isArjunRampalEvent(event)) return ARJUN_RAMPAL_DISCOUNT_PER_TICKET;
  if (isFarhanEvent(event) || isDjChetasEvent(event)) return DIRECT_PAY_DISCOUNT_PER_TICKET;
  return 0;
}

export function hasDirectPayDiscount(event) {
  if (event?.ticketTiers?.some((t) => {
    const p = tierPricingFromDb(t);
    return p && p.sale < p.list;
  })) return true;
  if (isJunooniChicagoEvent(event)) return true;
  return eventDiscountPerTicket(event) > 0;
}

export function discountedEventUnitPrice(event, listPrice, tierName) {
  const tier = findEventTier(event, tierName, listPrice);
  const dbPricing = tierPricingFromDb(tier);
  if (dbPricing) return dbPricing.sale;
  const junooni = isJunooniChicagoEvent(event) && tierName ? junooniTierPricing(tierName) : null;
  if (junooni) return junooni.sale;
  if (isJunooniChicagoEvent(event)) {
    const n = Number(listPrice);
    const byList = Object.values(JUNOONI_TIER_PRICES).find((p) => p.list === n);
    if (byList) return byList.sale;
  }
  const n = Number(listPrice);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, n - eventDiscountPerTicket(event, tierName, listPrice));
}

/** Lowest sale price for event cards. */
export function eventCardFromPrice(event) {
  const dbTiers = (event?.ticketTiers || []).map((t) => tierPricingFromDb(t)).filter(Boolean);
  if (dbTiers.length) {
    return {
      list: Math.min(...dbTiers.map((p) => p.list)),
      sale: Math.min(...dbTiers.map((p) => p.sale)),
    };
  }
  if (isJunooniChicagoEvent(event)) {
    const tiers = Object.values(JUNOONI_TIER_PRICES);
    return {
      list: Math.min(...tiers.map((p) => p.list)),
      sale: Math.min(...tiers.map((p) => p.sale)),
    };
  }
  const list = event?.minPrice ?? event?.ticketTiers?.[0]?.price ?? 0;
  return {
    list,
    sale: hasDirectPayDiscount(event) ? discountedEventUnitPrice(event, list) : list,
  };
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
